import logger from "../../helpers/logger";
import { sendOTPEmail, sendPasswordResetLink } from "../../helpers/nodemailer";
import { getRabbitMQConnection } from "./rabbitmq.config";

console.log("[console log] RabbitMQ server is listening...");

const EXCHANGE = "otp_exchange";
const BINDING_KEY = 'otp_routing_key';
const QUEUE = "otp_service_queue";
const DLX_EXCHANGE = "otp_dlx_exchange";
const DLX_QUEUE = "otp_dlx_queue";
const MAX_RETRIES = 5;

async function getVerificationOTP() {
    try {
        logger.info("[RabbitMQ] Initializing connection to RabbitMQ...");

        // Establish a TCP connection
        const connection = await getRabbitMQConnection();
        logger.info("[RabbitMQ] Connection established successfully.");

        // Create a channel (communication line)
        const channel = await connection.createChannel();
        logger.info("[RabbitMQ] Channel created successfully.");

        // Create a main exchange (if not exists)
        await channel.assertExchange(EXCHANGE, "direct", { durable: true });
        logger.info(`[RabbitMQ] Exchange '${EXCHANGE}' asserted.`);

        // Create a DLX (if not exists)
        await channel.assertExchange(DLX_EXCHANGE, "direct", { durable: true });
        logger.info(`[RabbitMQ] DLX '${DLX_EXCHANGE}' asserted.`);

        // Create a DLQ (if not exists)
        await channel.assertQueue(DLX_QUEUE, { durable: true });
        logger.info(`[RabbitMQ] DLQ '${DLX_QUEUE}' asserted.`);

        // Bind the DLQ to the DLX
        await channel.bindQueue(DLX_QUEUE, DLX_EXCHANGE, DLX_QUEUE);
        logger.info(`[RabbitMQ] DLQ '${DLX_QUEUE}' bound to DLX '${DLX_EXCHANGE}'.`);

        // Create the main queue with DLX configuration
        await channel.assertQueue(QUEUE, {
            durable: true,
            deadLetterExchange: DLX_EXCHANGE,
            deadLetterRoutingKey: DLX_QUEUE,
        });
        logger.info(`[RabbitMQ] Queue '${QUEUE}' asserted with DLX '${DLX_EXCHANGE}'.`);

        // Bind the main queue to the exchange
        await channel.bindQueue(QUEUE, EXCHANGE, BINDING_KEY);
        logger.info(`[RabbitMQ] Queue '${QUEUE}' bound to exchange '${EXCHANGE}'.`);

        /* Consume messages from the main queue */
        channel.consume(QUEUE, async (message: any) => {
            if (message !== null) {
                try {
                    const otpData = JSON.parse(message.content.toString());
                    logger.info(`[RabbitMQ] Received OTP event for userID: ${otpData?.id}`);

                    let success = false;
                    //if type is otp call send otp function else call reset function
                    if(otpData?.type === "otp"){
                        success = sendOTPEmail(otpData?.email, otpData?.otp);
                    }else if(otpData?.type === "link"){
                        success = sendPasswordResetLink(otpData?.email, otpData?.otp);
                    }
                    if (success) {
                        logger.info(`[RabbitMQ] Successfully processed OTP for userID: ${otpData?.id}`);
                        channel.ack(message);
                    } else {
                        logger.warn(`[RabbitMQ] Processing failed for userID: ${otpData?.id}. Sending to DLQ.`);
                        channel.nack(message, false, false); // Reject the message (do not requeue)
                    }
                } catch (error) {
                    logger.error(`[RabbitMQ] Error processing OTP event: `, { error });
                    channel.nack(message, false, false); // Reject the message (do not requeue)
                }
            }
        });

        /* Consume messages from the DLQ for retries */
        channel.consume(DLX_QUEUE, async (message: any) => {
            if (message !== null) {
                const otpData = JSON.parse(message.content.toString());
                const retryCount = message.properties.headers['x-retry-count'] || 0;

                if (retryCount < MAX_RETRIES) {
                    logger.warn(`[RabbitMQ] Retrying event (${retryCount + 1}/${MAX_RETRIES}) for userID: ${otpData?.userID}`);

                    const success = sendOTPEmail(otpData?.email, otpData?.otp);

                    if (success) {
                        logger.info(`[RabbitMQ] Retry successful for userID: ${otpData?.userID}`);
                        channel.ack(message);
                    } else {
                        logger.warn(`[RabbitMQ] Retry failed for userID: ${otpData?.userID}. Republishing to DLQ...`);
                        // Increment retry count and republish to DLQ
                        channel.publish(EXCHANGE, "", Buffer.from(JSON.stringify(otpData)), {
                            persistent: true,
                            headers: { 'x-retry-count': retryCount + 1 },
                        });
                        channel.ack(message);
                    }
                } else {
                    logger.error(`[RabbitMQ] Max retries reached for userID: ${otpData?.userID}. Manual intervention required.`, { otpData });
                    channel.ack(message);
                }
            }
        });

        logger.info("[RabbitMQ] Ready to consume messages...");
    } catch (error) {
        logger.error(`[RabbitMQ] Critical error in consumer setup: `, { error });
    }
}

getVerificationOTP();