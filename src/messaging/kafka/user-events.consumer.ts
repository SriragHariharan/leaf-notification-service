import type { EachMessagePayload } from "kafkajs";
import { User } from "../../models/User.model";
import kafka from "./kafka";

const TOPIC = "user.events";
const consumer = kafka.consumer({ groupId: "notification-service-user-events" });

interface UserEventPayload {
  userID?: string;
  username?: string;
  profilePicture?: string | null;
}

async function processUserData(userData: UserEventPayload): Promise<boolean> {
  if (!userData?.userID) {
    return false;
  }

  if (!userData.username) {
    return false;
  }

  try {
    await User.findOneAndUpdate(
      { userID: userData.userID },
      {
        $set: {
          username: userData.username,
          profilePic: userData.profilePicture ?? null,
        },
      },
      { upsert: true, new: true }
    );
    return true;
  } catch (error) {
    return false;
  }
}

async function onMessage({ message }: EachMessagePayload): Promise<void> {
  const raw = message.value?.toString() ?? "";
  let userData: UserEventPayload;
  try {
    userData = JSON.parse(raw);
  } catch {
    return;
  }
  const success = await processUserData(userData);
  if (!success) {
  }
}

async function startUserEventsConsumer(): Promise<void> {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    await consumer.run({ eachMessage: onMessage });
  } catch (error) {
  }
}

startUserEventsConsumer();
