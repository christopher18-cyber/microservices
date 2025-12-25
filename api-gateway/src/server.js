import "dotenv/config"
import express from "express"
import cors from "cors"
import Redis from "ioredis"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import RedisStore from "rate-limit-redis"
import logger from "./utils/logger.js"
import proxy from "express-http-proxy"
import errorHandler from "./middleware/errorhandler.js"
import { validateToken } from "./middleware/authMiddleware.js"

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

app.use(ratelimit)
app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`)
    next()
})

const proxyOption = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api")
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Proxy error: ${err.message}`)
        res.status(500).json({
            message: `Internal server error`, error: err.message,
            success: false
        })
    }
}

// setting up proxy for identity service

app.use("/v1/auth", proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOption,
    proxyReqBodyDecorator: (bodyContent, srcReq) => {
        return bodyContent
    },
    proxyReqOptDecorator: (proxyReqOpts) => {
        proxyReqOpts.headers = proxyReqOpts.headers || {}
        proxyReqOpts.headers["Content-Type"] = "application/json"
        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from identity service: ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

//setting up proxy for post service
app.use("/v1/posts", validateToken, proxy(process.env.POST_SERVICE_URL, {
    ...proxyOption,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json";
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId

        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from post service: ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

// setting up proxy for media service
app.use("/v1/media", validateToken, proxy(process.env.MEDIA_SERVICE_URL, {
    ...proxyOption,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
        if (!srcReq.headers["content-type"].startsWith("multipart/form")) {
            proxyReqOpts.headers["content-type"] = "application/json";
        }

        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from media service: ${proxyRes.statusCode}`)
        return proxyResData
    },
    parseReqBody: false
}))

app.use(errorHandler)

app.listen(PORT, () => {
    logger.info(`API gateway is now running on port ${PORT}`);
    logger.info(`Identity service is running on port ${process.env.IDENTITY_SERVICE_URL}`)
    logger.info(`Post service is running on port ${process.env.POST_SERVICE_URL}`)
    logger.info(`Media service is running on port ${process.env.MEDIA_SERVICE_URL}`)
    logger.info(`Redis Url: redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
})