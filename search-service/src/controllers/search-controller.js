import logger from "../utils/logger.js";

export async function searchController(req, res) {
    logger.info("Search endpoint hit.")
    try {
        const { query } = req.query

        const results = await searchController.find({ $text: { $search: query } },
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