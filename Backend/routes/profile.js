import { Router } from "express";
import { ProfileController } from "../controllers/profile.js";
import { verifyToken } from "../middleware/verifyToken.js";
export const profileRouter = Router()

profileRouter.get("/:id/profile", ProfileController.getProfile)
profileRouter.patch("/profile", verifyToken, ProfileController.update)