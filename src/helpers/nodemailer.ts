/* This helper function is used to send OTP & password reset via email */
import createHttpError from "http-errors";
import nodemailer from "nodemailer";
import logger from "./logger";

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
    },
});

/* Send OTP via email to the user */
export function sendOTPEmail(email: string, otp: string) {
    logger.debug(`Entering sendOTPEmail method. Email: ${email}`, { method: "sendOTPEmail", layer: "nodemailer helper" });
    try {
        logger.info(`Sending OTP to email: ${email}`, { layer: "nodemailer helper" });

        transporter.sendMail({
            from: process.env.MY_EMAIL,
            to: email,
            subject: 'OTP Verification from Leaf',
            text: `Your OTP for verification is ${otp}`,
        });

        logger.info(`OTP sent successfully to email: ${email}`, { layer: "nodemailer helper" });
        console.log("otp sent successfully");
        return true;
    } catch (error) {
        logger.error(`Error sending OTP email to ${email}: ${error}`, { error, layer: "nodemailer helper" });
        throw createHttpError("Unable to send email");
    } finally {
        logger.debug(`Exiting sendOTPEmail method. Email: ${email}`, { method: "sendOTPEmail", layer: "nodemailer helper" });
    }
}

/* Send password reset link via email to the user */
export function sendPasswordResetLink(email: string, resetLink: string) {
    logger.debug(`Entering sendPasswordResetLink method. Email: ${email}`, { method: "sendPasswordResetLink", layer: "nodemailer helper" });
    try {
        logger.info(`Sending password reset link to email: ${email}`, { layer: "nodemailer helper" });

        transporter.sendMail({
            from: process.env.MY_EMAIL,
            to: email,
            subject: 'Password Reset Link from Leaf',
            text: `Click the link below to reset your password: ${resetLink}`,
        });

        logger.info(`Password reset link sent successfully to email: ${email}`, { layer: "nodemailer helper" });
        console.log("reset link sent successfully");
        return true;
    } catch (error) {
        logger.error(`Error sending password reset link to ${email}: ${error}`, { error, layer: "nodemailer helper" });
        throw createHttpError("Unable to send email");
    } finally {
        logger.debug(`Exiting sendPasswordResetLink method. Email: ${email}`, { method: "sendPasswordResetLink", layer: "nodemailer helper" });
    }
}