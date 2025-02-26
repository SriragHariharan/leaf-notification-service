export interface Notification {
  id: string;
  userID: string;
  type: "comment" | "post" | "like" | "friend_request" | "friend_accept";
  content: string;
  isRead: boolean;
  isDeleted: boolean;
  interactedBy: string;
  postId?: string;
  createdAt: Date;
  updatedAt: Date;
}