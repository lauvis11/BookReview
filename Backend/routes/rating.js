import { Router } from "express";
export const ratingRouter = Router()
import { RatingController } from "../controllers/rating.js";

ratingRouter.put('/:id/rating', RatingController.save)
ratingRouter.get('/:id/rating', RatingController.getByUser)


