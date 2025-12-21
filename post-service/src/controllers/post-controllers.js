import logger from "../utils/logger.js";
import Post from "../models/Post.js";

export async function createPost(req, res) {
    try {
        const { content, mediaIds } = req.body
        const newlyCreatedPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || []
        })

        await newlyCreatedPost.save()
        logger.info("Post created successfully.", newlyCreatedPost)
        res.status(201).json({
            success: true,
            message: "Post created successfully."
        })
    }
    catch (err) {
        logger.error("Error creating post", err)
        res.status(500).json({
            success: false,
            message: "Error creating post."
        })
    }
}

export async function getAllPosts(req, res) {
    try { }
    catch (err) {
        logger.error("Error fetching posts.", err)
        res.status(500).json({
            success: false,
            message: "Error fetching posts."
        })
    }
}

export async function getPost(req, res) {
    try { }
    catch (err) {
        logger.error("Error fetching post.", err)
        res.status(500).json({
            success: false,
            message: "Error fetching post by ID."
        })
    }
}

export async function deletePost(req, res) {
    try { }
    catch (err) {
        logger.error("Error deleting post.", err)
        res.status(500).json({
            success: false,
            message: "Error deleting post."
        })
    }
}