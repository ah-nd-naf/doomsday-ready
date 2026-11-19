import { Router } from "express";
import { movieController } from "../controllers/movie.controller";

const router = Router();

router.get("/", (req, res, next) => movieController.getAll(req, res, next));
router.post("/", (req, res, next) => movieController.create(req, res, next));
router.patch("/:id", (req, res, next) => movieController.update(req, res, next));

export default router;
