import bcrypt from "bcryptjs";
import { pool } from "../config/db.mjs";

/**
 * Normaliza email a minúsculas y sin espacios.
 */
function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    const normEmail = normalizeEmail(email);

    // ¿ya existe?
    const [exists] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normEmail]
    );
    if (exists.length) {
      return res.status(409).json({ message: "El email ya está registrado" });
    }

    // hash
    const password_hash = await bcrypt.hash(password, 10);

    // crea usuario (role por defecto: customer)
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')",
      [name, normEmail, password_hash]
    );

    // guarda sesión
    req.session.user = {
      id: result.insertId,
      name,
      email: normEmail,
      role: "customer",
    };

    return res.status(201).json({
      ok: true,
      user: req.session.user,
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ message: "Error en el registro" });
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res) => {
    console.log("HIT /api/auth", req.body); 
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    const normEmail = normalizeEmail(email);

    const [rows] = await pool.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = ? LIMIT 1",
      [normEmail]
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // guarda sesión
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.status(200).json({
      ok: true,
      user: req.session.user,
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

/**
 * GET /api/auth/me
 * Devuelve el usuario de la sesión (o null)
 */
export const me = async (req, res) => {
  try {
    return res.json({ user: req.session.user ?? null });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ message: "Error" });
  }
};

/**
 * POST /api/auth/logout
 * Destruye la sesión
 */
export const logout = async (req, res) => {
  try {
    req.session.destroy(() => {
      // también puedes limpiar la cookie si quieres:
      // res.clearCookie("connect.sid");
      return res.json({ ok: true });
    });
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json({ message: "Error al cerrar sesión" });
  }
};
