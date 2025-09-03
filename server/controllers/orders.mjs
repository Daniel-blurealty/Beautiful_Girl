import { pool } from "../config/db.mjs";

/**
 * Crea un pedido para el usuario autenticado.
 * Body esperado: { items: [{ product_id, quantity }, ...] }
 */
export const createOrder = async (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ error: "No has iniciado sesión" });

  const { items } = req.body || {};

  // Validaciones básicas
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No hay productos en la orden" });
  }

  // Normaliza y agrupa cantidades por product_id (evita duplicados)
  const qtyById = new Map();
  for (const it of items) {
    const pid = Number(it?.product_id);
    const qty = Number(it?.quantity);
    if (!Number.isInteger(pid) || pid <= 0) {
      return res.status(400).json({ error: `product_id inválido: ${it?.product_id}` });
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: `quantity inválida para product_id ${pid}` });
    }
    qtyById.set(pid, (qtyById.get(pid) || 0) + qty);
  }

  const productIds = Array.from(qtyById.keys());
  const placeholders = productIds.map(() => "?").join(",");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Trae productos y bloquea las filas para este checkout
    const [rows] = await conn.query(
      `SELECT id, price, stock
         FROM products
        WHERE id IN (${placeholders})
        FOR UPDATE`,
      productIds
    );

    if (rows.length !== productIds.length) {
      // Algún product_id no existe
      const foundIds = new Set(rows.map(r => r.id));
      const missing = productIds.filter(id => !foundIds.has(id));
      throw new Error(`Producto(s) inexistente(s): ${missing.join(", ")}`);
    }

    // Verifica stock
    for (const p of rows) {
      const needed = qtyById.get(p.id);
      if (p.stock < needed) {
        throw new Error(`Stock insuficiente para producto ${p.id} (disponible: ${p.stock}, requerido: ${needed})`);
      }
    }

    // Calcula total
    const total = rows.reduce((sum, p) => {
      const qty = qtyById.get(p.id);
      return sum + (Number(p.price) * qty);
    }, 0);

    // Crea el pedido
    const [orderRes] = await conn.query(
      "INSERT INTO orders (user_id, status, total_amount) VALUES (?, 'paid', ?)",
      [userId, total]
    );
    const orderId = orderRes.insertId;

    // Inserta items y descuenta stock
    for (const p of rows) {
      const qty = qtyById.get(p.id);
      const unitPrice = Number(p.price);

      await conn.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
        [orderId, p.id, qty, unitPrice]
      );

      await conn.query(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [qty, p.id]
      );
    }

    await conn.commit();
    return res.status(201).json({ id: orderId, total_amount: total, status: "pagado" });
  } catch (err) {
    await conn.rollback();
    console.error("createOrder error:", err.message);
    return res.status(400).json({ error: "Error al crear la orden", detail: err.message });
  } finally {
    conn.release();
  }
};

/**
 * Lista pedidos del usuario autenticado.
 * Opcional: ?include_items=true para traer items de cada pedido.
 */
export const listOrders = async (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ error: "No has iniciado sesión" });

  const includeItems = String(req.query.include_items || "").toLowerCase() === "true";

  try {
    const [orders] = await pool.query(
      "SELECT id, status, total_amount, created_at, updated_at FROM orders ORDER BY created_at DESC",
      [userId]
    );

    if (!includeItems || orders.length === 0) {
      return res.json({ data: orders });
    }

    const orderIds = orders.map(o => o.id);
    const placeholders = orderIds.map(() => "?").join(",");
    const [items] = await pool.query(
      `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
              p.name AS product_name, p.slug AS product_slug, p.image_url
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id IN (${placeholders})
        ORDER BY oi.order_id DESC, oi.id ASC`,
      orderIds
    );

    // Agrupa items por order_id
    const itemsByOrder = new Map();
    for (const it of items) {
      if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
      itemsByOrder.get(it.order_id).push(it);
    }

    const result = orders.map(o => ({
      ...o,
      items: itemsByOrder.get(o.id) || []
    }));

    return res.json({ data: result });
  } catch (err) {
    console.error("listMyOrders error:", err.message);
    return res.status(500).json({ error: "Error obteniendo pedidos" });
  }
}

export const getOrder = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Falta el ID de la orden" });
  }

  try {
    const [order] = await pool.query(`
      SELECT id, user_id, status, total_amount, created_at, updated_at
      FROM orders
      WHERE id = ?
    `, [id]);

    if (!order) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    res.json({ data: order });
  } catch (error) {
    console.error("Error al obtener orden:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export const editOrder = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  try {
    const [result] = await pool.query(`
      UPDATE orders SET status = ? WHERE id = ?
    `, [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    res.json({ message: "Orden actualizada" });
  } catch (error) {
    console.error("Error al editar orden:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export const deleteOrder = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Falta el ID de la orden" });
  }
  try {
    const [result] = await pool.query(`
      DELETE FROM orders WHERE id = ?
    `, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }
    res.json({ message: "Orden eliminada" });
  } catch (error) {
    console.error("Error al eliminar orden:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}