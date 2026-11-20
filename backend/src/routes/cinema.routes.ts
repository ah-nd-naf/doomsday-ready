import { Router } from "express";
import { cinemaController } from "../controllers/cinema.controller";

const router = Router();

router.get("/", (req, res, next) => cinemaController.getAll(req, res, next));
router.get("/:id/booking", (req, res, next) =>
  cinemaController.getBooking(req, res, next)
);
router.post("/", (req, res, next) => cinemaController.create(req, res, next));

export default router;
