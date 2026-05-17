import type { EachMessagePayload } from "kafkajs";
import createHttpError from "http-errors";
import { User } from "../../models/User.model";
import { Notification } from "../../models/Notification.model";
import fetchFriendID from "../../helpers/fetchFriends";
import { io } from "../../socket";
import kafka from "./kafka";

const TOPICS = ["notification.post.created", "post.liked", "post.commented"] as const;
const consumer = kafka.consumer({ groupId: "notification-service-post-notifs" });

async function getInteractedUserDetails(userId: string) {
  const userDetails = await User.findOne({ userID: userId });
  if (!userDetails) {
    throw createHttpError(404, "User not found");
  }
  return userDetails;
}

async function processMessage(message: {
  type: string;
  postID: string;
  postOwnerID: string;
  interactedUserID: string;
}): Promise<void> {
  const userDetails = await getInteractedUserDetails(message.interactedUserID);

  if (message.type === "post_created") {
    const notificationMessage = `${userDetails.username} added a new post`;
    const friendsList = await fetchFriendID(message.postOwnerID);
    for (const friendID of friendsList) {
      const newNotification = new Notification({
        userID: friendID,
        content: notificationMessage,
        type: "comment",
        interactedBy: message.interactedUserID,
        postId: message.postID,
      });
      await newNotification.save();
      io.to(friendID).emit("post_notification", newNotification);
    }
  } else if (message.type === "post_commented") {
    const notificationMessage = `${userDetails.username} commented on your post`;
    const newNotification = new Notification({
      userID: message.postOwnerID,
      content: notificationMessage,
      type: "post",
      interactedBy: message.interactedUserID,
      postId: message.postID,
    });
    await newNotification.save();
    io.to(message.postOwnerID).emit("post_notification", newNotification);
  }
}

async function onMessage({ message }: EachMessagePayload): Promise<void> {
  const raw = message.value?.toString() ?? "";
  let payload: { type: string; postID: string; postOwnerID: string; interactedUserID: string };
  try {
    payload = JSON.parse(raw);
  } catch {
    console.warn("[Kafka] skipped invalid post notification message");
    return;
  }

  try {
    await processMessage(payload);
  } catch (error) {
    console.error("Error processing post notification:", error);
  }
}

async function startPostNotificationsConsumer(): Promise<void> {
  try {
    await consumer.connect();
    for (const topic of TOPICS) {
      await consumer.subscribe({ topic, fromBeginning: true });
    }
    await consumer.run({ eachMessage: onMessage });
    console.log("Post notification consumer started");
  } catch (error) {
    console.error("Error starting post notification consumer:", error);
  }
}

startPostNotificationsConsumer();
