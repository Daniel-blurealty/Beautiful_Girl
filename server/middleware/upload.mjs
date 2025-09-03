import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Guardaremos aquí (misma carpeta que expusimos en app.mjs)
const UPLOADS_DIR = path.join(__dirname, "../uploads");

// Almacena con nombre único
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase(); // .jpg, .png, ...
    const name = Date.now() + "-" + Math.random().toString(36).slice(2) + ext;
    cb(null, name);
  },
});

function fileFilter(_req, file, cb) {
  const ok = /^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.mimetype);
  cb(ok ? null : new Error("Tipo de imagen no soportado"), ok);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});
