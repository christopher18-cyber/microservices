import express from "express"
import { searchController } from "../controllers/search-controller.js"
import { authenticateRequest } from "../middleware/authMiddleware.js"

const router = express.Router()

router.use(authenticateRequest)
router.get("/posts", searchController)

export { router as searchRoutes }