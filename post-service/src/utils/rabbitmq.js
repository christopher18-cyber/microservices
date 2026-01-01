import "dotenv/config"
import amqp from "amqplib"
import logger from "./logger.js"

let connection = null
let channel = null

const EXCHANGE_NAME = "facebook_events"

const QUEUE_NAME = "post_service"

const isProduction = process.env.NODE_ENV === "production"

const url = process.env.RABBITMQ_URL

export async function connectRabbitMQ() {
    try {
        if (!process.env.RABBITMQ_URL) {
            throw new Error('RABBITMQ_URL is not defined.')
        }
        connection = await amqp.connect(process.env.RABBITMQ_URL)
        channel = await connection.createChannel()

        await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: isProduction })
        //assert queue 
        await channel.assertQueue(QUEUE_NAME, { durable: isProduction })

        // bind queue
        await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "post.deleted")

        logger.info("Connected to rabbit mq and queue is ready")

        // starts consuming messages

        // channel.consume(QUEUE_NAME, async (msg) => {
        //     if (!msg) return
        //     try {
        //         const event = JSON.parse(msg.content.toString())
        //         console.log("Event received.", event);
        //         await handlePostDeleted(event)
        //         channel.ack(msg)
        //     } catch (err) {
        //         logger.error("Error handling message", err)
        //         channel.nack(msg, false, false)
        //     }
        // })
        return channel
    }
    catch (err) {
        logger.error("Error connecting to rabbit mq", err)
    }
}

export async function publishEvent(routingKey, message) {
    if (!channel) {
        await connectRabbitMQ()
    }
    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)))
    logger.info(`Event published: ${routingKey}`)
}