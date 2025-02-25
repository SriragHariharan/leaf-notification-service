/**
 * RabbitMQ Consumer for Friend Request Notifications
 * 
 * This consumer listens to the "friend_request_exchange" for messages related to friend requests.
 * When a user sends a friend request to another user, the producer sends a notification to this exchange.
 * This consumer processes those notifications by performing actions such as sending emails, updating databases, etc.
 */

import * as amqp from 'amqplib';
import { io } from '../../socket';
import { Notification } from '../../models/Notification.model'; // Adjust the path as needed
import { User } from '../../models/User.model'; // Assuming you have a User model

const EXCHANGE = "friend_request_exchange";
const ROUTING_KEY = 'friend_request_routing_key';
const QUEUE_NAME = 'friend_request_queue';

async function consumeFriendRequestNotifications(): Promise<void> {
    let connection;
    try {
        connection = await amqp.connect(process.env.RABBITMQ_CONNECTION_STRING!);
        const channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE, "direct", { durable: true });
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        await channel.bindQueue(QUEUE_NAME, EXCHANGE, ROUTING_KEY);

        console.log("Waiting for friend request notifications...");

        await channel.consume(QUEUE_NAME, async (msg) => {
            if (msg !== null) {
                try {
                    const messageContent = JSON.parse(msg.content.toString());
                    console.log("Received friend request notification:", messageContent);

                    await processFriendRequestNotification(messageContent);

                    channel.ack(msg);
                } catch (error) {
                    console.error("Error processing friend request notification:", error);
                    channel.nack(msg, false, false);
                }
            }
        });

    } catch (error) {
        console.error("Error consuming friend request notifications: ", error);
        if (connection) {
            await connection.close();
        }
        throw error;
    }
}

async function processFriendRequestNotification(notification: any): Promise<void> {
    const { requestSenderID, requestReceiverID } = notification;
    try {

        // Emit a real-time event to the requestReceiverID's room
        io.to(requestReceiverID).emit("friend_request_received", {
            message: "sent you a friend request"
        });
        const sender = await User.findOne({ userID: requestSenderID }).select('username')
        console.log(sender?.username, " ::: Sendername")

        //save to db
        const content = `${sender?.username} sent you a friend request`
        const newNotification = new Notification({ userID: requestReceiverID, content, type: "friend_request", interactedBy: requestSenderID });
        await newNotification.save();

        console.log(`📢 Sent friend request notification to room ${requestReceiverID}`);
    } catch (error) {
        console.error("Error saving friend request notification:", error);
    }
}

// Start consuming notifications
consumeFriendRequestNotifications().catch(console.error);
