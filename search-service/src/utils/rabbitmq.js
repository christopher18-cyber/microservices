import "dotenv/config"
import amqp from "amqplib"
import logger from "./logger.js"

let connection = null
let channel = null

const EXCHANGE_NAME = "facebook_events"
const QUEUE_NAME = "search_service"

export async function connectRabbitMQ() {
    try {
        if (!process.env.RABBITMQ_URL) {
            throw new Error('RABBITMQ_URL is not defined.')
        }
        connection = await amqp.connect(process.env.RABBITMQ_URL)
        channel = await connection.createChannel()

        await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false })
        //assert queue 
        await channel.assertQueue(QUEUE_NAME, { durable: true })

        // bind queue
        await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "post.deleted")

        logger.info("Connected to rabbit mq and queue is ready")

        // starts consuming messages

        channel.consume(QUEUE_NAME, async (msg) => {
            if (!msg) return
            try {
                const event = JSON.parse(mag.content.toString())
                console.log("Event received.", event);
                await handlePostDeleted(event)
                channel.ack(msg)
            } catch (err) {
                logger.error("Error handling message", err)
                channel.nack(msg)
            }
        })
        return channel
    }
    catch (err) {
        logger.error("Error connecting to rabbit mq", err)
    }
}
// export async function publishEvent(routingKey, message) {
//     if (!channel) {
//         await connectRabbitMQ()
//     }
//     channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)))
//     logger.info(`Event published: ${routingKey}`)
// }

export async function consumeEvent(routingKey, callback) {
    if (!channel) {
        await connectRabbitMQ()
    }

    const queues = await channel.assertQueue("", { exclusive: true })
    await channel.bindQueue(queues.queue, EXCHANGE_NAME, routingKey)
    channel.consume(queues.queue, (msg) => {
        if (msg !== null) {
            const content = JSON.parse(msg.content.toString())
            callback(content)
            channel.ack(msg)
        }
    })

    logger.info(`Subscribed to event: ${routingKey}`)
}