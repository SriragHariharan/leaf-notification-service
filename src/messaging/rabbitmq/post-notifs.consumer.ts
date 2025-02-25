import * as amqp from 'amqplib';
import createHttpError from 'http-errors';
import { User } from '../../models/User.model';
import { Notification } from '../../models/Notification.model';
import fetchFriendID from '../../helpers/fetchFriends';
import { io } from '../../socket';

// Define the exchange name and type
const EXCHANGE_NAME = 'notifications';
const EXCHANGE_TYPE = 'topic';

// Define the queue name
const QUEUE_NAME = 'notification_queue';

// Define the routing keys for binding
const ROUTING_KEYS = [
  'post.created',
  'post.liked',
  'post.commented',
];

// Function to start the consumer
async function postNotificationsConsumer() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(process.env.RABBITMQ_CONNECTION_STRING!);
    const channel = await connection.createChannel();

    // Assert the topic exchange
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

    // Assert the queue
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Bind the queue to the exchange with the routing keys
    for (const routingKey of ROUTING_KEYS) {
      await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, routingKey);
    }

    console.log('Consumer started. Waiting for messages...');

    // Consume messages from the queue
    channel.consume(QUEUE_NAME, (msg) => {
      if (msg !== null) {
        const message = JSON.parse(msg.content.toString());
        console.log('Received message:', message);

        // Process the message here
        processMessage(message);

        // Acknowledge the message
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('Error starting consumer:', error);
  }
}

// Function to process the message
async function processMessage(message: { type: string, postID: string; postOwnerID: string; interactedUserID: string }) {
    const userDetails = await getInteractedUserDetails(message?.interactedUserID);
    console.log(userDetails, " ::: user details")
    /* if a new post is created, send notification to all his friends */
    if(message?.type === "post_created") {
        const notificationMessage = `${userDetails?.username} added a new post`;
        //get the list of friends and fanout to all the friends
        const friendsList = await fetchFriendID(message?.postOwnerID);
        /* fanning out the notification to all his friends */
        console.log(friendsList, " ::: friends list")
        friendsList.forEach(async (friendID: string) => {   
            const newNotification = new Notification({ userID: friendID, content: notificationMessage, type: "post", interactedBy: message?.interactedUserID, postId: message?.postID });
            await newNotification.save();
            // Emit the notification to the room corresponding to the friendID
            io.to(friendID).emit('post_notification', newNotification);
        })

    }
    /* if somenone commented on the post then add a notification */
    else if(message?.type === "post_commented") {
        const notificationMessage = `${userDetails?.username} commented on your post`;
        const newNotification = new Notification({ userID: message?.postOwnerID, content: notificationMessage, type: "post", interactedBy: message?.interactedUserID, postId: message?.postID });
        await newNotification.save();
        // Emit the notification to the room corresponding to the postOwnerID
        io.to(message.postOwnerID).emit('post_notification', newNotification);
    }
}

/* get the details of the user */
async function getInteractedUserDetails(userId: string) {
    try {
        const userDetails = await User.findOne({ userID : userId });
        if(!userDetails) {
            throw createHttpError(404, "User not found");
        }
        return userDetails;
    } catch (error) {
        throw createHttpError(500, "An unexpected error occurred");
    }
}

postNotificationsConsumer();