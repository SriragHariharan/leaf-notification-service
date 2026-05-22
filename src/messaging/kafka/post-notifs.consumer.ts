import type { EachMessagePayload } from "kafkajs";
import createHttpError from "http-errors";
import { User } from "../../models/User.model";
import { Notification } from "../../models/Notification.model";
import fetchFriendID from "../../helpers/fetchFriends";
import { io } from "../../socket";
import kafka from "./kafka";

const TOPIC = "notification.post.created";
const consumer = kafka.consumer({ groupId: "notification-service-post-notifs" });

interface PostCreatedPayload {
  type: string;
  postID: string;
  postOwnerID: string;
  interactedUserID: string;
}

async function getInteractedUserDetails(userId: string) {
  const userDetails = await User.findOne({ userID: userId });
  if (!userDetails) {
    throw createHttpError(404, "User not found");
  }
  return userDetails;
}

async function processPostCreated(message: PostCreatedPayload): Promise<void> {
  const userDetails = await getInteractedUserDetails(message.interactedUserID);
  const notificationMessage = `${userDetails.username} added a new post`;
  const friendsList = await fetchFriendID(message.postOwnerID);
  const dedupeBase = `post_created:${message.postID}`;

  for (const friendID of friendsList) {
    const dedupeKey = `${dedupeBase}:${friendID}`;

    const existing = await Notification.findOne({ dedupeKey });

    if (existing) {
      continue;
    }

    const newNotification = new Notification({
      userID: friendID,
      content: notificationMessage,
      type: "post",
      interactedBy: message.interactedUserID,
      postId: message.postID,
      entityId: message.postID,
      entityType: "post",
      dedupeKey,
    });

    await newNotification.save();

    io.to(friendID).emit("post_notification", newNotification);
  }
}

async function onMessage({ message }: EachMessagePayload): Promise<void> {
  const raw = message.value?.toString() ?? "";

  let payload: PostCreatedPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  try {
    if (payload.type === "post_created") {
      await processPostCreated(payload);
    }
  } catch (error) {
  }
}

async function startPostNotificationsConsumer(): Promise<void> {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    await consumer.run({ eachMessage: onMessage });
  } catch (error) {
  }
}

startPostNotificationsConsumer();
