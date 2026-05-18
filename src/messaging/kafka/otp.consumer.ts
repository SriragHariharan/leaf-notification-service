import type { EachMessagePayload } from "kafkajs";
import logger from "../../helpers/logger";
import { sendOTPEmail, sendPasswordResetLink } from "../../helpers/nodemailer";
import kafka from "./kafka";

const TOPIC = "otp";
const consumer = kafka.consumer({ groupId: "notification-service-otp" });

async function processOtp(otpData: { type?: string; email?: string; otp?: number | string }): Promise<void> {
  if (otpData?.type === "otp" && otpData.email) {
    //sendOTPEmail(otpData.email, String(otpData.otp));
    logger.info(`[Kafka] OTP email triggered for ${otpData.email}`);
  } else if (otpData?.type === "link" && otpData.email) {
    //sendPasswordResetLink(otpData.email, String(otpData.otp));
    logger.info(`[Kafka] Password reset link triggered for ${otpData.email}`);
  } else {
    logger.warn("[Kafka] skipped invalid otp message");
  }
}

async function onMessage({ message }: EachMessagePayload): Promise<void> {
  const raw = message.value?.toString() ?? "";
  let otpData: { type?: string; email?: string; otp?: number | string };
  try {
    otpData = JSON.parse(raw);
  } catch {
    logger.warn("[Kafka] skipped invalid otp message");
    return;
  }

  try {
    await processOtp(otpData);
  } catch (error) {
    logger.error("[Kafka] Error processing OTP event", { error });
  }
}

async function startOtpConsumer(): Promise<void> {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    await consumer.run({ eachMessage: onMessage });
    logger.info("[Kafka] Ready to consume otp");
  } catch (error) {
    logger.error("[Kafka] Critical error in otp consumer setup", { error });
  }
}

startOtpConsumer();
