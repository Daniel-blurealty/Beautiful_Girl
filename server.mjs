// server.mjs
import "dotenv/config";        // 👈 carga .env ANTES de los demás imports
import app from "./server/app.mjs";

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
