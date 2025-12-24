import "dotenv/config"
import express from "express"
import { connectToDB } from "../database/db.js"
import cors from "cors"
import helmet from "helmet"
import { router } from "./routes/media-routes.js"
import errorHandler from "./middleware/errorHandler.js"
import logger from "./utils/logger.js"

const app = express()

const PORT = process.env.PORT || 3003

connectToDB()

app.use(cors())
app.use(helmet())
app.use(express.json())

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body,${req.body}`)
    next()
})

// *** Homework - implement ip based rate limiting for sensitive endpoints

app.use("/api/media", router)
app.use(errorHandler)

app.listen(PORT, () => {
    logger.info(`Media service now running on port ${PORT}`)
})

process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at", promise, "reason:", reason)
})