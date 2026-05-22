import {
  CreateNotificationInput,
  Notification,
} from "./notification.interface";

export interface INotificationRepository {
  getNotifications(userID: string): Promise<Notification[]>;

  markNotificationsAsRead(userID: string): Promise<void>;

  markNotificationAsRead(
    userID: string,
    notificationId: string,
  ): Promise<Notification | null>;

  deleteAllNotifications(userID: string): Promise<void>;

  getUnreadNotificationsCount(userID: string): Promise<number>;

  createIfNotExists(
    input: CreateNotificationInput,
  ): Promise<{ notification: Notification; isNew: boolean } | null>;
}
