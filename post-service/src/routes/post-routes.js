import express from "express"
import { createPost } from "../controllers/post-controllers.js"
import { authenticateRequest } from "../middleware/authMiddleware.js"

const router = express()

router.use(authenticateRequest)
router.post("/create-post", createPost)

export { router }