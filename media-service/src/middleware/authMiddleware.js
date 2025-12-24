import logger from "../utils/logger.js";

export function authenticateRequest(req, res, next) {
    const userId = req.headers["x-user-id"]

    if (!userId) {
        logger.warn("Access attempt without user Id.")
        return res.status(401).json({
            success: false,
            message: "Auhentication required, pls login to continue."
        })
    } else {
        req.user = { userId }
        next()
    }
}