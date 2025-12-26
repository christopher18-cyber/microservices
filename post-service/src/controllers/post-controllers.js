import logger from "../utils/logger.js";
import Post from "../models/Post.js";
import { validateCreatePost } from "../utils/validation.js";
import { publishEvent } from "../utils/rabbitmq.js";

export async function invalidatePostCaches(req, input) {

    const cachedKey = `post:${input}`
    await req.redisClient.del(cachedKey)
    const keys = await req.redisClient.keys("posts:*")
    if (keys.length > 0) {
        await req.redisClient.del(keys)
    }
}

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
        await invalidatePostCaches(req, newlyCreatedPost._id.toString())
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
    try {
        const postId = req.params.id
        const cacheKey = `post:${postId}`

        const cachedPost = await req.redisClient.get(cacheKey)

        if (cachedPost) {
            return res.json(JSON.parse(cachedPost))
        } else {
            const singlePostDetailsbyId = await Post.findById(postId)
            if (!singlePostDetailsbyId) {
                return res.status(404).json({
                    message: "Post not found",
                    success: false
                })
            } else {
                await req.redisClient.setex(cachedPost, 3600, JSON.stringify(singlePostDetailsbyId))
                res.json(singlePostDetailsbyId)
            }
        }
    }
    catch (err) {
        logger.error("Error fetching post.", err)
        res.status(500).json({
            success: false,
            message: "Error fetching post by ID."
        })
    }
}

export async function deletePost(req, res) {
    try {

        const post = await Post.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId
        })

        if (!post) {
            return res.status(404).json({
                message: `Post not found.`,
                success: false
            })
        } else {

            await publishEvent("post-deleted", {
                postId: post._id.toString(),
                userId: req.user.userId,
                mediaIds: post.mediaIds
            })
            await invalidatePostCaches(req, req.params.id)
            res.json({
                message: "post deleted successfully",
                success: true
            })
        }
    }
    catch (err) {
        logger.error("Error deleting post.", err)
        res.status(500).json({
            success: false,
            message: "Error deleting post."
        })
    }
}