import { uploadMediaToCloudinary } from "../utils/cloudinary.js";
import Media from "../models/Media.js";
import logger from "../utils/logger.js";


export async function uploadMedia(req, res) {
    logger.info("starting media upload.")
    try {
        console.log(req.file, "file req")
        if (!req.file) {
            logger.error("No file found, please add a file and try again.")
            return res.status(400).json({
                success: false,
                message: "No file found, please add a file and try again."
            })
        } else {
            const { originalname, mimetype, buffer } = req.file
            const originalName = originalname
            const mimeType = mimetype
            const userId = req.user.userId

            logger.info(`File details: name=${originalName}, type=${mimeType}`)
            logger.info("Uploading to cloudinary starting.")

            const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file)
            logger.info(`cloudinary upload successfully, public Id:${cloudinaryUploadResult.public_id}`)

            const newlyCreatedMedia = new Media({
                publicId: cloudinaryUploadResult.public_id,
                originalName,
                mimeType: mimeType,
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
        logger.error(`Error creating media.`, err)
        res.status(500).json({
            message: "Error creating media.",
            success: false
        })
    }
}


export async function getAllMedias(req, res) {

    req.on("aborted", () => {
        logger.warn("Client aborted request, stop processing");
    });
    try {
        const results = await Media.find({}).maxTimeMS(5000).exec()
        res.json({ results })
    }
    catch (err) {
        logger.error(`Error fetching medias.`, err)
        res.status(500).json({
            message: "Error fetching media.",
            success: false
        })
    }
}