import { pool } from "../config/db.mjs";

/** Util: genera un slug básico a partir del nombre */
function slugify(str = "") {
  return String(str)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * GET /api/products
 * Query: q, category (slug o id), sort (new|price_asc|price_desc|name_asc|name_desc), page, limit
 */
export const productsList = async (req, res) => {
  try {
    const {
      q,
      category,
      sort = "new",
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 12));
    const offset = (pageNum - 1) * limitNum;

    const where = [];
    const params = [];

    if (q) {
      where.push("(p.name LIKE ? OR p.description LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }

    if (category) {
      // soporta slug (string) o id numérico
      if (/^\d+$/.test(String(category))) {
        where.push("p.category_id = ?");
        params.push(Number(category));
      } else {
        where.push("c.slug = ?");
        params.push(String(category));
      }
    }

    const orderBy =
      sort === "price_asc"  ? "p.price ASC" :
      sort === "price_desc" ? "p.price DESC" :
      sort === "name_asc"   ? "p.name ASC" :
      sort === "name_desc"  ? "p.name DESC" :
                              "p.created_at DESC"; // default: new

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `
      SELECT p.id, p.name, p.slug, p.description, p.price, p.stock,
             p.category_id, p.image_url, p.created_at, p.updated_at,
             c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereSQL}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
      `,
      [...params, limitNum, offset]
    );

    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereSQL}
      `,
      params
    );

    res.json({
      data: rows,
      total,
      page: pageNum,
      limit: limitNum,
      last_page: Math.ceil(total / limitNum)
    });
  } catch (e) {
    console.error("productsList error:", e.message);
    res.status(500).json({ error: "Error listando productos" });
  }
};

/**
 * GET /api/products/:idOrSlug
 * Soporta id numérico o slug string
 */
export const getProduct = async (req, res) => {
  try {
    const idOrSlug = req.params.id; // tu ruta actual usa :id; soportamos slug también
    let rows;

    if (/^\d+$/.test(String(idOrSlug))) {
      [rows] = await pool.query(
        `
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = ?
        LIMIT 1
        `,
        [Number(idOrSlug)]
      );
    } else {
      [rows] = await pool.query(
        `
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.slug = ?
        LIMIT 1
        `,
        [String(idOrSlug)]
      );
    }

    if (!rows.length) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(rows[0]);
  } catch (e) {
    console.error("getProduct error:", e.message);
    res.status(500).json({ error: "Error obteniendo producto" });
  }
};

/**
 * POST /api/products
 * Body (multipart/form-data): name, slug?, description?, price, stock?, category_id?, image (file)
 * Requiere upload.single("image") en la ruta si se sube imagen
 */
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug: slugIn,
      description,
      price,
      stock,
      category_id
    } = req.body;

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Validaciones mínimas
    if (!name || price === undefined) {
      return res.status(400).json({ error: "Faltan campos obligatorios: name, price" });
    }

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: "price inválido" });
    }

    const stockNum = stock === undefined ? 0 : Number(stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      return res.status(400).json({ error: "stock inválido" });
    }

    const categoryIdNum = category_id ? Number(category_id) : null;
    if (category_id !== undefined && (!Number.isInteger(categoryIdNum) || categoryIdNum <= 0)) {
      return res.status(400).json({ error: "category_id inválido" });
    }

    const slug = slugIn ? slugify(slugIn) : slugify(name);

    // Inserta
    const [result] = await pool.query(
      `
      INSERT INTO products (name, slug, description, price, stock, category_id, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        slug,
        description ?? "",
        priceNum,
        stockNum,
        categoryIdNum,
        image_url
      ]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      slug,
      description: description ?? "",
      price: priceNum,
      stock: stockNum,
      category_id: categoryIdNum,
      image_url
    });
  } catch (e) {
    // posiblmente slug duplicado (UNIQUE)
    console.error("createProduct error:", e.message);
    res.status(500).json({ error: "Error al crear el producto", detail: e.message });
  }
};

/**
 * PUT /api/products/:id
 * Body (multipart/form-data permitido): name?, slug?, description?, price?, stock?, category_id?, image?
 * Requiere upload.single("image") si llega archivo
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Campos opcionales
    const fields = {};
    const numeric = {};

    if (req.body.name !== undefined) fields.name = req.body.name;
    if (req.body.slug !== undefined) fields.slug = slugify(req.body.slug);
    if (req.body.description !== undefined) fields.description = req.body.description;

    if (req.body.price !== undefined) {
      const priceNum = Number(req.body.price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        return res.status(400).json({ error: "price inválido" });
      }
      numeric.price = priceNum;
    }

    if (req.body.stock !== undefined) {
      const stockNum = Number(req.body.stock);
      if (!Number.isInteger(stockNum) || stockNum < 0) {
        return res.status(400).json({ error: "stock inválido" });
      }
      numeric.stock = stockNum;
    }

    if (req.body.category_id !== undefined) {
      const categoryIdNum = Number(req.body.category_id);
      if (!Number.isInteger(categoryIdNum) || categoryIdNum <= 0) {
        return res.status(400).json({ error: "category_id inválido" });
      }
      numeric.category_id = categoryIdNum;
    }

    if (req.file) {
      fields.image_url = `/uploads/${req.file.filename}`;
    }

    // Construcción dinámica de SET
    const sets = [];
    const params = [];

    for (const [k, v] of Object.entries(fields)) {
      sets.push(`${k} = ?`);
      params.push(v);
    }
    for (const [k, v] of Object.entries(numeric)) {
      sets.push(`${k} = ?`);
      params.push(v);
    }

    if (!sets.length) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    await pool.query(
      `UPDATE products SET ${sets.join(", ")} WHERE id = ?`,
      [...params, id]
    );

    res.json({ ok: true, message: "Producto actualizado" });
  } catch (e) {
    console.error("updateProduct error:", e.message);
    res.status(500).json({ error: "Error al actualizar el producto", detail: e.message });
  }
};

/**
 * (Opcional) DELETE /api/products/:id
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM products WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error("deleteProduct error:", e.message);
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
};
