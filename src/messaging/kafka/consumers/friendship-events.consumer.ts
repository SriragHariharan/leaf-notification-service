import type { EachMessagePayload } from "kafkajs";
import logger from "../../../helpers/logger";
import type { FriendshipEvent } from "../contracts/friendship-event.dto";
import { logConsumerContext, parseJsonMessage } from "../consumer-utils";
import { eventNotificationService } from "../event-notification.bootstrap";
import kafka from "../kafka";

const TOPIC = "friendship.events";
const consumer = kafka.consumer({ groupId: "notification-service-friendship-events" });

async function onMessage(payload: EachMessagePayload): Promise<void> {
  const raw = payload.message.value?.toString() ?? "";
  const event = parseJsonMessage<FriendshipEvent>(raw, TOPIC);
  if (!event?.eventType) {
    logger.warn(`[kafka:${TOPIC}] skipped message with missing eventType`);
    return;
  }

  logConsumerContext(TOPIC, payload, event.eventType);

  try {
    await eventNotificationService.handle(event.eventType, event as unknown as Record<string, unknown>);
  } catch (error) {
    logger.error(`[kafka:${TOPIC}] handler failed eventType=${event.eventType}`, { error });
    throw error;
  }
}

async function startFriendshipEventsConsumer(): Promise<void> {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    await consumer.run({ eachMessage: onMessage });
    logger.info(`[kafka:${TOPIC}] consumer started`);
  } catch (error) {
    logger.error(`[kafka:${TOPIC}] failed to start consumer`, { error });
  }
}

startFriendshipEventsConsumer();
