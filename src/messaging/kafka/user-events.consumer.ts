import type { EachMessagePayload } from "kafkajs";
import logger from "../../helpers/logger";
import { User } from "../../models/User.model";
import kafka from "./kafka";

const TOPIC = "user.events";
const consumer = kafka.consumer({ groupId: "notification-service-user-events" });

async function processUserData(userData: {
  userID?: string;
  username?: string;
  profilePicture?: string;
  type?: string;
}): Promise<boolean> {
  if (!userData?.userID) {
    logger.error("[Kafka] Invalid user data: Missing userID");
    return false;
  }

  try {
    if (userData.type === "user") {
      if (!userData.username) {
        logger.error("[Kafka] Invalid user data: Missing username");
        return false;
      }
      const newUser = new User({
        userID: userData.userID,
        username: userData.username,
        profilePic: userData.profilePicture,
      });
      await newUser.save();
      logger.info(`[Database] Successfully created user with userID: ${userData.userID}`);
      return true;
    }
    if (userData.type === "username" && userData.username) {
      await User.updateOne({ userID: userData.userID }, { $set: { username: userData.username } });
      logger.info(`[Database] Successfully updated username for userID: ${userData.userID}`);
      return true;
    }
    if (userData.type === "picture" && userData.profilePicture) {
      await User.updateOne({ userID: userData.userID }, { $set: { profilePic: userData.profilePicture } });
      logger.info(`[Database] Successfully updated profile picture for userID: ${userData.userID}`);
      return true;
    }
    logger.warn(`[Kafka] Unknown user event type: ${userData.type}`);
    return false;
  } catch (error) {
    logger.error(`[Kafka] Error processing user event for userID: ${userData.userID}`, { error });
    return false;
  }
}

async function onMessage({ message }: EachMessagePayload): Promise<void> {
  const raw = message.value?.toString() ?? "";
  let userData: { userID?: string; username?: string; profilePicture?: string; type?: string };
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
