import logger from "../../helpers/logger";
import type { EachMessagePayload } from "kafkajs";

export function parseJsonMessage<T>(raw: string, topic: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    logger.warn(`[kafka:${topic}] skipped invalid JSON message`);
    return null;
  }
}

export function logConsumerContext(
  topic: string,
  payload: EachMessagePayload,
  eventType?: string,
): void {
  const { partition, message } = payload;
  logger.debug(`[kafka:${topic}] processing eventType=${eventType ?? "unknown"}`, {
    partition,
    offset: message.offset,
  });
}
