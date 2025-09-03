import { Router } from "express";
import { register, login, me, logout } from "../controllers/auth.mjs";
import { requireAuth } from "../middleware/auth.mjs";

const router = Router();

router.post("/register", register);
router.post("/logout", requireAuth, logout);
router.post("/", login);
router.get("/me", requireAuth, me);

export default router;
