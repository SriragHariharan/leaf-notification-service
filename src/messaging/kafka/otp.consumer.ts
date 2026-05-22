import type { EachMessagePayload } from "kafkajs";
import { sendOTPEmail, sendPasswordResetLink } from "../../helpers/nodemailer";
import kafka from "./kafka";

const TOPIC = "otp";
const consumer = kafka.consumer({ groupId: "notification-service-otp" });

async function processOtp(otpData: { type?: string; email?: string; otp?: number | string }): Promise<void> {
  if (otpData?.type === "otp" && otpData.email) {
    //sendOTPEmail(otpData.email, String(otpData.otp));
  } else if (otpData?.type === "link" && otpData.email) {
    //sendPasswordResetLink(otpData.email, String(otpData.otp));
  } else {
  }
}

async function onMessage({ message }: EachMessagePayload): Promise<void> {
  const raw = message.value?.toString() ?? "";
  let otpData: { type?: string; email?: string; otp?: number | string };
  try {
    otpData = JSON.parse(raw);
  } catch {
    return;
  }

  try {
    await processOtp(otpData);
  } catch (error) {
  }
}

async function startOtpConsumer(): Promise<void> {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    await consumer.run({ eachMessage: onMessage });
  } catch (error) {
  }
}

startOtpConsumer();
