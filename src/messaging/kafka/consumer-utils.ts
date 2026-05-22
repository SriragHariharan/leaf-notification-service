import type { EachMessagePayload } from "kafkajs";

export function parseJsonMessage<T>(raw: string, topic: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function logConsumerContext(
  topic: string,
  payload: EachMessagePayload,
  eventType?: string,
): void {
  const { partition, message } = payload;
}
