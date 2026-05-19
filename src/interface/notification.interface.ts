export type NotificationType =
  | "comment"
  | "post"
  | "like"
  | "friend_request"
  | "friend_accept";

export type EntityType = "post" | "friend_request";

export interface NotificationActor {
  username: string;
  profilePic?: string | null;
}

export interface Notification {
  id: string;
  userID: string;
  type: NotificationType;
  content: string;
  isRead: boolean;
  isDeleted: boolean;
  interactedBy: string;
  postId?: string;
  entityId?: string;
  entityType?: EntityType;
  dedupeKey?: string;
  createdAt: Date;
  updatedAt: Date;
  actor?: NotificationActor;
}

export interface CreateNotificationInput {
  userID: string;
  content: string;
  type: NotificationType;
  interactedBy: string;
  postId?: string;
  entityId?: string;
  entityType?: EntityType;
  dedupeKey: string;
}
