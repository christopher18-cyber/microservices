import logger from "../utils/logger.js";
import { validateRegistration } from "../utils/validation.js";
import User from "../models/User.js";
import { generateTokens } from "../utils/generateToken.js";

// user registraion

export async function registerUser(req, res) {
    logger.info("Registration endpoint hit")
    try {

        // validate schemma
        const { error } = validateRegistration(req.body)
        if (error) {
            logger.warn("Validation error", error.details[0].message)
            res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        } else {
            const { email, password, username } = req.body

            let user = await User.findOne({ $or: [{ email }, { username }] })
            if (user) {
                logger.warn("User already exists.")
                res.status(400).json({
                    success: false,
                    message: "User already exists."
                })
            } else {
                user = new User({ email, password, username })
                await user.save()
                logger.warn("User saved successfully.", user._id)

                const { accessToken, refreshToken } = await generateTokens(user)

                res.status(201).json({
                    success: true,
                    message: `User registered successfully`,
                    accessToken,
                    refreshToken
                })
            }
        }
    }
    catch (err) {
        logger.error("Registeration error occured.", err)
        res.status(500).json({
            message: `Internal server error.`,
            success: false
        })
    }
}