import { Router } from "express";
import { listCategories, createCategory, deleteCategory, editCategory } from "../controllers/categories.mjs";

const router = Router();
router.get("/", listCategories);
router.post("/", createCategory);
router.delete("/:id", deleteCategory);
router.put("/:id", editCategory);

export default router;
