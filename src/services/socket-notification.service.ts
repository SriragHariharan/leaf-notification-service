import { io } from "../socket";
import type { Notification } from "../interface/notification.interface";

export function emitFriendRequestReceived(targetUserId: string, notification: Notification): void {
  io.to(targetUserId).emit("friend_request_received", {
    message: "sent you a friend request",
    notification,
  });
}

export function emitPostNotification(targetUserId: string, notification: Notification): void {
  io.to(targetUserId).emit("post_notification", notification);
}
