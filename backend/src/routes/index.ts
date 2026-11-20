import { Router } from "express";
import movieRoutes from "./movie.routes";
import cinemaRoutes from "./cinema.routes";

const apiRouter = Router();

apiRouter.use("/movies", movieRoutes);
apiRouter.use("/cinemas", cinemaRoutes);

export default apiRouter;
