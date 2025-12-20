import logger from "../utils/logger.js";
import { validateLogin, validateRegistration } from "../utils/validation.js";
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
                logger.info("User saved successfully.", user._id)

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

// login an user

export async function loginUser(req, res) {
    logger.info("Login endpoint hit.....")
    try {
        const { error } = validateLogin(req.body)
        if (error) {
            logger.warn("Validation error", error.details[0].message)
            res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        } else {
            const { email, password } = req.body
            const user = await User.findOne({ email })
            if (!user) {
                logger.warn("Invalid user")
                return res.status(400).json({
                    success: false,
                    message: "Invalid credentials."
                })
            } else {
                const isValidPassword = await user.comparePassword(password)
                if (!isValidPassword) {
                    logger.warn("Invalid password")
                    res.status(404).json({
                        success: false,
                        message: "Invalid password."
                    })
                } else {
                    const { accessToken, refreshToken } = await generateTokens(user)

                    res.json({
                        accessToken,
                        refreshToken,
                        userId: user._id
                    })
                }
            }
        }
    } catch (error) {
        logger.error("Login error occured.", err)
        res.status(500).json({
            message: `Internal server error.`,
            success: false
        })
    }
}

// refresh token

export async function refreshToken(req, res) {
    logger.info("Refresh token endpoint hit")
    try {
        const { refreshToken } = req.body
        if (!refreshToken) {
            logger.warn("Refresh token missing.")
            return res.status(400).json({
                success: false,
                message: "Invalid credentials."
            })
        }
    }
    catch (err) {
        logger.error("Refresh token error occured.")
        res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}