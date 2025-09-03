
import express from "express";
import morgan from "morgan";
import session from "express-session";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import router from "./routes/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
process.loadEnvFile?.(); // opcional (Node 20.6+)

// 1) Middlewares base
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2) Estáticos del front (monolito)
app.use(express.static(path.join(__dirname, "../public"))); // ← /public en la raíz

// 3) Estáticos de uploads (imágenes)
const uploadsDir = path.join(__dirname, "./uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use("/uploads", express.static(uploadsDir));

// 4) Sesiones
app.use(session({
  secret: "dev-only-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax", // OK en http localhost
    // secure: true,  // habilita si sirves por HTTPS
  },
}));

// 5) API (prefijo /api para que el front use rutas relativas)
app.use("/api", router);




export default app;
