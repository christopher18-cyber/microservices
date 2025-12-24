import logger from "../utils/logger.js";
import Post from "../models/Post.js";
import { validateCreatePost } from "../utils/validation.js";

export async function createPost(req, res) {
    logger.info("Create post endpoint hit.")
    try {
        const { error } = validateCreatePost(req.body)
        if (error) {
            logger.warn("Validation error", error.details[0].message)
            res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }
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
    try {

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const startIndex = (page - 1) * limit


        const cacheKey = `posts:${page}:${limit}`

        const cachedPosts = await req.redisClient.get(cacheKey)

        if (cachedPosts) {
            return res.json(JSON.parse(cachedPosts))
        } else {
            const posts = await Post.find({}).sort({ createdAt: -1 }).skip(startIndex).limit(limit)

            const totalNoOfPosts = await Post.countDocuments()

            const result = {
                posts,
                currentPage: page,
                totalPages: Math.ceil(totalNoOfPosts / limit),
                totalPosts: totalNoOfPosts
            }

            // save your post into redis

            await req.redisClient.setex(cacheKey, 300, JSON.stringify())
            res.json(result)
        }
    }
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