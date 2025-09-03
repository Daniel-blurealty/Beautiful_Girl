// routes/orders.routes.mjs
import { Router } from "express";
import { requireAuth } from "../middleware/auth.mjs";
import { createOrder, deleteOrder, editOrder, getOrder, listOrders } from "../controllers/orders.mjs";

const router = Router();

router.post("/", requireAuth, createOrder);
router.get("/", requireAuth, listOrders);
router.get("/:id", requireAuth, getOrder);
router.put("/:id", requireAuth, editOrder);
router.delete("/:id", requireAuth, deleteOrder);

export default router;
