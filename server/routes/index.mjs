import { Router } from "express";
import authRouter from "./auth.mjs";
import productsRouter from "./products.mjs";
import ordersRouter from "./orders.mjs";
import categoriesRouter from "./categories.mjs"
import favorites from "./favorites.mjs";

const router = Router();

router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/orders", ordersRouter);
router.use("/categories", categoriesRouter);
router.use("/favorites", favorites);

export default router;
