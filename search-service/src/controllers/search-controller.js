import logger from "../utils/logger.js";
import { Search } from "../models/Search.js";

export async function searchController(req, res) {
    logger.info("Search endpoint hit.")
    try {
        const { query } = req.query
        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Query paramter is required."
            })
        }

        const results = await Search.find({ $text: { $search: query } },
            { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } }).limit(10)

        res.json(results)
    }
    catch (err) {
        logger.error("Error while searching post.")
        res.status(500).json({
            success: false,
            message: "Error while searching post."
        })
    }
}