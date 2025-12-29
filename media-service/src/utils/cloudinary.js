import "dotenv/config"
import { v2 as cloudinary } from "cloudinary"
import logger from "./logger.js"

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
})

export const uploadMediaToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "auto"
            },
            (error, result) => {
                if (error) {
                    logger.error("Error while uploading media to cloudinary.")
                    reject(error)
                } else {
                    resolve(result)
                }
            }
        )

        uploadStream.end(file.buffer)
    })
}


export async function deleteMediaFromCloudinary(publicId) {
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" })
        console.log("Delete result", result);

        logger.info("Media deleted successfully from cloud storage.", publicId)
        return result
    }
    catch (err) {
        logger.error("Error deleting media from cloundiary.", err)
        throw err
    }
}