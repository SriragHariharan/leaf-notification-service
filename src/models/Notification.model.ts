import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["post", "like", "comment", "friend_request", "friend_accept"],
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        interactedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        postId: {
            type: String,
            required: false,
        }
    },
    {
        timestamps: true,
    }
);

export const Notification = mongoose.model("Notification", notificationSchema);