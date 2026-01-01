import logger from "../utils/logger.js";
import { Search } from "../models/Search.js";

export async function handlePostCreated(event) {
    try {
        const newSearchPost = new Search({
            postId: event.postId,
            userId: event.userId,
            content: event.userId,
            createdAt: event.createdAt
        })

        await newSearchPost.save()

        logger.info(`Search post created: ${event.postId}, ${newSearchPost._id.toString()}`)
    }
    catch (err) {
        logger.error(err, "Error handling post creation event.")
    }
}

export async function handlePostDeleted(event) {
    try {
        await Search.findOneAndDelete({ postId: event.postId })
        logger.info(`Search post deleted: ${event.postId}`)
    }
    catch (err) {
        logger.error(err, "Error handling post deletion event.")
    }
}