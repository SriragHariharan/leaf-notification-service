import type { EachMessagePayload } from "kafkajs";
import logger from "../../helpers/logger";
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
    logger.error("[Kafka] Invalid user data: Missing userID");
    return false;
  }

  if (!userData.username) {
    logger.error("[Kafka] Invalid user data: Missing username");
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
    logger.info(`[Database] Successfully upserted user with userID: ${userData.userID}`);
    return true;
  } catch (error) {
    logger.error(`[Kafka] Error processing user event for userID: ${userData.userID}`, { error });
    return false;
  }
}

async function onMessage({ message }: EachMessagePayload): Promise<void> {
  const raw = message.value?.toString() ?? "";
  let userData: UserEventPayload;
  try {
    userData = JSON.parse(raw);
  } catch {
    logger.warn("[Kafka] skipped invalid user.events message");
    return;
  }

  logger.info(`[Kafka] Received user event for userID: ${userData?.userID}`);
  const success = await processUserData(userData);
  if (!success) {
    logger.warn(`[Kafka] Processing failed for userID: ${userData?.userID}`);
  }
}

async function startUserEventsConsumer(): Promise<void> {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    await consumer.run({ eachMessage: onMessage });
    logger.info("[Kafka] Ready to consume user.events");
  } catch (error) {
    logger.error("[Kafka] Critical error in user-events consumer setup", { error });
  }
}

startUserEventsConsumer();
