import "dotenv/config"

import express from "express"
import Redis from "ioredis"
import helmet from "helmet"
import { router } from "./routes/post-routes.js"
import errorHandler from "./middleware/errorHandler.js"
import logger from "./utils/logger.js"
import { connectToDB } from "../database/db.js"
import { configureCors } from "../config/corsConfig.js"
import { RateLimiterRedis } from "rate-limiter-flexible"
import rateLimit from "express-rate-limit"
import RedisStore from "rate-limit-redis"
import { connectRabbitMQ } from "./utils/rabbitmq.js"

connectToDB()

const app = express()
const PORT = process.env.PORT || 3002

const redisClient = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || "6379"
})

redisClient.on("connect", () => {
    console.log("Redis connected");
})

redisClient.on("error", (error) => {
    console.log("Redis error", error);
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet())
app.use(configureCors())

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`)
    next()
})

// ip based rate limiting for sensitive endpoints

const sensitiveEndpointLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`)
        res.status(429).json({
            success: false,
            message: "Too many requests."
        })
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
})

app.use("/api/posts", sensitiveEndpointLimit)

app.use("/api/posts", (req, res, next) => {
    req.redisClient = redisClient
    next()
}, router)

app.use(errorHandler)

async function startServer() {
    try {
        await connectRabbitMQ()
        app.listen(PORT, () => {
            logger.info(`Post service running on port ${PORT}`)
        })
    }
    catch (err) {
        logger.error("Failed to connect to server.", err)
        process.exit(1)
    }
}

startServer()



process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at", promise, "reason", reason)
})