import { Router } from "express";
import { requireAuth } from "../middleware/auth.mjs";
import { listFavorites, addFavorite, removeFavorite } from "../controllers/favorites.mjs";

const router = Router();
router.get("/",    requireAuth, listFavorites);
router.post("/",   requireAuth, addFavorite);
router.delete("/:productId", requireAuth, removeFavorite);

export default router;
