import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
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
      type: String,
      required: true,
    },
    postId: {
      type: String,
      required: false,
    },
    entityId: {
      type: String,
      required: false,
    },
    entityType: {
      type: String,
      required: false,
      enum: ["post", "friend_request"],
    },
    dedupeKey: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ userID: 1, createdAt: -1 });
notificationSchema.index({ dedupeKey: 1 }, { unique: true });

export const Notification = mongoose.model("Notification", notificationSchema);
