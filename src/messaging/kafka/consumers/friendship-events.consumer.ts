import type { EachMessagePayload } from "kafkajs";
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
    return;
  }

  logConsumerContext(TOPIC, payload, event.eventType);

  try {
    await eventNotificationService.handle(event.eventType, event as unknown as Record<string, unknown>);
  } catch (error) {
    throw error;
  }
}

async function startFriendshipEventsConsumer(): Promise<void> {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    await consumer.run({ eachMessage: onMessage });
  } catch (error) {
  }
}

startFriendshipEventsConsumer();
