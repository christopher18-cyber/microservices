import "dotenv/config"
import amqp from "amqplib"
import logger from "./logger.js"

let connection = null
let channel = null

const EXCHANGE_NAME = "facebook_events"

export async function connectRabbitMQ() {
    try {
        if (!process.env.RABBITMQ_URL) {
            throw new Error('RABBITMQ_URL is not defined.')
        }
        connection = await amqp.connect(process.env.RABBITMQ_URL)
        channel = await connection.createChannel()

        await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false })

        logger.info("Connected to rabbit mq")
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