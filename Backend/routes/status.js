import { Router } from "express";
import { StatusController } from "../controllers/status.js";
export const statusRouter = Router()

statusRouter.get('/', StatusController.getByStatus)
statusRouter.post('/', StatusController.save)
statusRouter.delete('/:id', StatusController.delete)
