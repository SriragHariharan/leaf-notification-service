/* this helper function is used to send OTP & password reset via email */

import createHttpError from "http-errors";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
    },
});

export function sendOTPEmail(email: string, otp: string) {
    try {
        transporter.sendMail({
            from: process.env.MY_EMAIL,
            to: email,
            subject: 'OTP Verification from Leaf',
            text: `Your OTP for verification is ${otp}`,
        })       
        console.log("otp sent successfully");
        return true;
    } catch (error) {
        throw createHttpError("Unable to send email")
    }
}

export function sendPasswordResetLink(email: string, resetLink: string) {
    try {
        transporter.sendMail({
            from: process.env.MY_EMAIL,
            to: email,
            subject: 'Password Reset Link from Leaf',
            text: `Click the link below to reset your password: ${resetLink}`,
        });
        console.log("reset link sent successfully");
        return true;
    }
    catch (error) {
        throw createHttpError("Unable to send email");
    }
}
