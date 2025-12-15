import mongoose from "mongoose"
import argon2 from "argon2"

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
}, { timestamps: true })

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        try { }
        catch (err) { }
    }
})