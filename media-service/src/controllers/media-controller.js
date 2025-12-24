import { uploadMediaToCloudinary } from "../utils/cloudinary.js";
import Media from "../models/Media.js";
import logger from "../utils/logger.js";


export async function uploadMedia(req, res) {
    logger.info("starting media upload.")
    try {
        if (!req.file) {
            logger.error("No file found, please add a file and try again.")
            return res.status(400).json({
                success: false,
                message: "No file found, please add a file and try again."
            })
        } else {
            const { originalName, mimeType, buffer } = req.file
            const userId = req.user.userId

            logger.info(`File details: name=${originalName}, type=${mimeType}`)
            logger.info("Uploading to cloudinary starting.")

            const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file)
            logger.info(`cloudinary upload successfully, public Id:${cloudinaryUploadResult.public_id}`)

            const newlyCreatedMedia = new Media({
                publicId: cloudinaryUploadResult.public_id,
                originalName,
                mimeType,
                url: cloudinaryUploadResult.secure_url,
                userId
            })

            await newlyCreatedMedia.save()

            res.status(201).json({
                success: true,
                mediaId: newlyCreatedMedia._id,
                url: newlyCreatedMedia.url,
                message: "Media upload is successful."
            })
        }
    }
    catch (err) {
        logger.error(`Error while uploading`, error)
        res.status(500).json({
            message: "Error while uploading",
            success: false
        })
    }
}