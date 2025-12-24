import logger from "../utils/logger.js"
import jwt from "jsonwebtoken"

export function validateToken(req, res, next) {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
        logger.warn("Access attempt without token.")
        return res.status(401).json({
            message: "Authentication failed",
            success: false
        })
    }


    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn("Invalid token.")
            return res.status(401).json({
                message: "Invalid token.",
                success: false
            })
        } else {
            req.user = user
            next()
        }
    })
}