import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carga el .env que está en Server/.env sin importar desde dónde ejecutes
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Valida que existan las variables (fallar pronto y claro)
const required = ["MYSQL_HOST", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DB"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
}

export const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
})

try {
  const [r] = await pool.query("SELECT 1 AS ok");
  console.log("DB OK:", r[0].ok === 1 ? "conectado" : "algo raro");
} catch (e) {
  console.error("Error conectando a MySQL:", e.message);
  // vuelve a lanzar para caer rápido
  throw e;
}