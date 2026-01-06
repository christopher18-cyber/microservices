import "dotenv/config"
import express from "express"
import Redis from "ioredis"
import cors from "cors"
import helmet from "helmet"
import errorHandler from "./middleware/errorHandler.js"
import logger from "./utils/logger.js"
import { connectRabbitMQ, consumeEvent } from "./utils/rabbitmq.js"
import { connectToDB } from "../database/db.js"
import { searchRoutes } from "./routes/search-routes.js"
import { handlePostCreated, handlePostDeleted } from "./eventHandler/search-event-handler.js"

const app = express()
const PORT = process.env.PORT || 3004

connectToDB()


const redisClient = new Redis({
    host: process.env.REDIS_HOST_DOCKER || process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379
})

redisClient.on("connect", () => {
    console.log("Connected to redis successfuly.");
});
redisClient.on("error", (error) => {
    console.log("Error when connecting to redis.");
})

app.use(cors())
app.use(helmet())
app.use(express.json())

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body,${req.body}`)
    next()
})

// *** Homework - implement Ip based rate limiting for sensitive endpoints

app.use("/api/search", searchRoutes)

app.use(errorHandler)

async function startServer() {
    try {
        await connectRabbitMQ()

        // consume the events /subscribe to the events

        await consumeEvent("post.created", handlePostCreated)
        await consumeEvent("post.deleted", handlePostDeleted)

        app.listen(PORT, () => { logger.info(`Search service is running on port ${PORT}`) })
    }
    catch (err) {
        logger.error("Failed to start search service", err)
        process.exit(1)
    }
}

startServer()