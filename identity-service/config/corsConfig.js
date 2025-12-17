import cors from "cors"

export function configureCors() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",")

    return cors({
        // origin-> this will tell which origin, you want user to access your api
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true)
            } else {
                callback(new Error("Not allowed by cors"))
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-type", "Authorization", "Accept-Version"],
        exposedHeaders: ["X-Total-Count", "Content-Range"],
        credentials: true,
        preflightContinue: false,
        maxAge: 600,
        optionsSuccessStatus: 204
    })
}