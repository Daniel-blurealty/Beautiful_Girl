import { pool } from "../config/db.mjs";

// GET /api/favorites  → favoritos del usuario logueado
export async function listFavorites(req, res) {
  const userId = Number(req.session.user.id);
  const [rows] = await pool.query(`
    SELECT p.id, p.name, p.slug, p.description, p.price, p.stock,
           p.category_id, p.image_url, p.created_at, p.updated_at,
           c.name AS category_name, c.slug AS category_slug
    FROM favorites f
    JOIN products p  ON p.id = f.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `, [userId]);
  res.json({ data: rows });
}

// POST /api/favorites { product_id }
export async function addFavorite(req, res) {
  const userId = Number(req.session.user.id);
  const productId = Number(req.body.product_id);
  if (!productId) return res.status(400).json({ message: "product_id requerido" });
  await pool.query(`INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)`, [userId, productId]);
  res.status(201).json({ ok: true });
}

// DELETE /api/favorites/:productId
export async function removeFavorite(req, res) {
  const userId = Number(req.session.user.id);
  const productId = Number(req.params.productId);
  await pool.query(`DELETE FROM favorites WHERE user_id = ? AND product_id = ?`, [userId, productId]);
  res.json({ ok: true });
}
