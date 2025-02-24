/**
 * RabbitMQ Consumer for Friend Request Notifications
 * 
 * This consumer listens to the "friend_request_exchange" for messages related to friend requests.
 * When a user sends a friend request to another user, the producer sends a notification to this exchange.
 * This consumer processes those notifications by performing actions such as sending emails, updating databases, etc.
 */

import * as amqp from 'amqplib';

const EXCHANGE = "friend_request_exchange";
const ROUTING_KEY = 'friend_request_routing_key';
const QUEUE_NAME = 'friend_request_queue';

async function consumeFriendRequestNotifications(): Promise<void> {
    let connection;
    try {
        // Create a TCP connection to RabbitMQ
        connection = await amqp.connect(process.env.RABBITMQ_CONNECTION_STRING!);

        // Create a channel (communication line within the TCP connection)
        const channel = await connection.createChannel();

        // Assert the exchange exists (create if it doesn't)
        await channel.assertExchange(EXCHANGE, "direct", { durable: true });

        // Assert the queue exists (create if it doesn't)
        await channel.assertQueue(QUEUE_NAME, { durable: true });

        // Bind the queue to the exchange using the routing key
        await channel.bindQueue(QUEUE_NAME, EXCHANGE, ROUTING_KEY);

        console.log("Waiting for friend request notifications...");

        // Consume messages from the queue
        await channel.consume(QUEUE_NAME, (msg) => {
            if (msg !== null) {
                try {
                    // Parse the message content (expected to be a JSON string)
                    const messageContent = JSON.parse(msg.content.toString());
                    console.log("Received friend request notification:", messageContent);

                    // Process the notification (e.g., send an email, update database, etc.)
                    processFriendRequestNotification(messageContent);

                    // Acknowledge the message to remove it from the queue
                    channel.ack(msg);
                } catch (error) {
                    console.error("Error processing friend request notification:", error);
                    // Reject the message and do not requeue it
                    channel.nack(msg, false, false);
                }
            }
        });

    } catch (error) {
        console.error("Error consuming friend request notifications: ", error);
        if (connection) {
            // Ensure the connection is closed in case of an error
            await connection.close();
        }
        throw error;
    }
}

/**
 * Processes a friend request notification.
 * 
 * This function contains the logic to handle the notification, such as sending an email
 * to the receiver or updating a database with the friend request details.
 */
function processFriendRequestNotification(notification: any): void {
    // Implement your logic to process the notification here
    // For example, you might send an email to the receiver or update a database
    console.log(`Processing friend request from ${notification.requestSenderID} to ${notification.requestReceiverID}`);
}

// Start consuming notifications
consumeFriendRequestNotifications().catch(console.error);