import { pool } from "../config/db.mjs";

export async function listCategories(req, res) {
  // Devuelve id, nombre, slug y product_count
  const [rows] = await pool.query(`
    SELECT c.id, c.name AS name, c.slug,
           COUNT(p.id) AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name, c.slug
    ORDER BY c.name ASC
  `);
  res.json({ data: rows });
}

export async function createCategory(req, res){
  const { name, slug, description } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }
  try {
    const [result] = await pool.query(`
      INSERT INTO categories (name, slug, description)
      VALUES (?, ?, ?)
    `, [name, slug, description]);
    res.status(201).json({ id: result.insertId, name, slug, description });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function deleteCategory(req, res) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Falta el ID de la categoría" });
  }
  try {
    const [result] = await pool.query(`
      DELETE FROM categories WHERE id = ?
    `, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    res.json({ message: "Categoría eliminada" });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function editCategory(req, res) {
  const { id } = req.params;
  const { name, slug, description } = req.body;

  try {
    const [result] = await pool.query(`
      UPDATE categories SET name = ?, slug = ?, description = ?
      WHERE id = ?
    `, [name, slug, description, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json({ message: "Categoría actualizada" });
  } catch (error) {
    console.error("Error al editar categoría:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
