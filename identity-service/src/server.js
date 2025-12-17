import dotenv from "dotevn"
dotenv.config()

import express from "express"
import { connectToDB } from "../database/db.js"
import helmet from "helmet"
import { configureCors } from "../config/corsConfig.js"
import logger from "./utils/logger.js"
import { RateLimiterRedis } from "rate-limiter-flexible"
import Redis from "ioredis"
import rateLimit from "express-rate-limit"
import RedisStore from "rate-limit-redis"

const app = express()

const redisClient = new Redis(process.env.REDIS_URL)

app.use(express.json())
app.use(helmet())
app.use(configureCors())

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`)
    next()
})

// DDOS protection and rate limiting

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "middleware",
    points: 10,
    duration: 1
})

app.use((req, res, next) => {
    rateLimiter.consume(req.ip).then(() => next()).catch(() => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`)
        res.status(429).json({
            success: false,
            message: "Too many requests."
        })
    })
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
        sendCommand: (...args) => { }
    })
})