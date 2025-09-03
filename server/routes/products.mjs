import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.mjs";
import { upload } from "../middleware/upload.mjs";
import { productsList, getProduct, createProduct, updateProduct, deleteProduct } from "../controllers/products.mjs";

const router = Router();

router.post("/", requireAuth, requireAdmin, upload.single("image"), createProduct);
router.get("/", productsList);
router.get("/:id", getProduct);
router.put("/:id", requireAuth, requireAdmin, upload.single("image"), updateProduct);
router.delete("/:id", requireAuth, requireAdmin, deleteProduct);

export default router;
