import Media from "../models/Media.js";
import { deleteMediaFromCloudinary } from "../utils/cloudinary.js";

export async function handlePostDeleted(event) {
    console.log(event, "eventeventevent");
    const { postId, mediaIds } = event
    try {
        const mediaToDelete = await Media.find({ _id: { $in: mediaIds } })

        for (const media of mediaToDelete) {
            await deleteMediaFromCloudinary(media.publicId)
            await Media.findByIdAndDelete(media._id)

            logger.info(`Deleted media ${media._id} associated with this deleted post ${postId}`)

        }

        logger.info(`Processed deletion of media post for post id ${postId}`)
    }
    catch (err) {
        logger.error("Error occured while media deletion", err)
    }
}