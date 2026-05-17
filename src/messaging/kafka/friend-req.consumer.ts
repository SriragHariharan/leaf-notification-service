import type { EachMessagePayload } from "kafkajs";
import { io } from "../../socket";
import { Notification } from "../../models/Notification.model";
import { User } from "../../models/User.model";
import kafka from "./kafka";

const TOPIC = "friend.request";
const consumer = kafka.consumer({ groupId: "notification-service-friend-request" });

async function processFriendRequestNotification(notification: {
  requestSenderID?: string;
  requestReceiverID?: string;
}): Promise<void> {
  const { requestSenderID, requestReceiverID } = notification;
  if (!requestSenderID || !requestReceiverID) {
    console.warn("[Kafka] skipped invalid friend.request message");
    return;
  }

  io.to(requestReceiverID).emit("friend_request_received", {
    message: "sent you a friend request",
  });

  const sender = await User.findOne({ userID: requestSenderID }).select("username");
  const content = `${sender?.username} sent you a friend request`;
  const newNotification = new Notification({
    userID: requestReceiverID,
    content,
    type: "friend_request",
    interactedBy: requestSenderID,
  });
  await newNotification.save();
  console.log(`Sent friend request notification to room ${requestReceiverID}`);
}

async function onMessage({ message }: EachMessagePayload): Promise<void> {
  const raw = message.value?.toString() ?? "";
  let payload: { requestSenderID?: string; requestReceiverID?: string };
  try {
    payload = JSON.parse(raw);
  } catch {
    console.warn("[Kafka] skipped invalid friend.request message");
    return;
  }

  try {
    await processFriendRequestNotification(payload);
  } catch (error) {
    console.error("Error processing friend request notification:", error);
  }
}

async function startFriendRequestConsumer(): Promise<void> {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    await consumer.run({ eachMessage: onMessage });
    console.log("Waiting for friend request notifications...");
  } catch (error) {
    console.error("Error starting friend request consumer:", error);
  }
}

startFriendRequestConsumer();
