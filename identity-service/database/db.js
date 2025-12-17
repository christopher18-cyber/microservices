import mongoose from "mongoose"
import logger from "../src/utils/logge.js";

const uri = process.env.MONGODB_URI

export async function connectToDB() {
    try {
        await mongoose.connect(uri, {
            dbName: "microservice-database"
        })
        logger.info("Connected to MongoDB")

    }
    catch (err) {
        logger.error("MongoDB connection failed", err);
    }
}