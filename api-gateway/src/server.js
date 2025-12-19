import "dotenv/config"
import express from "express"
import cors from "cors"
import Redis from "ioredis"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import RedisStore from "rate-limit-redis"
import logger from "./utils/logger.js"
const app = express()

const PORT = process.env.PORT || 3000

const redisClient = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || "6379"
})

redisClient.on("connect", () => {
    console.log("Connected to redis successfuly.");
});
redisClient.on("error", (error) => {
    console.log("Error when connecting to redis.");
})

app.use(helmet())
app.use(cors())
app.use(express.json())

// rate-limiting 

const ratelimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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

app.use(rateLimit())