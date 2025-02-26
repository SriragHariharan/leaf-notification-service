import { Notification } from "./notification.interface";

export interface INotificationRepository {
    getNotifications(userID: string): Promise<Notification[]>;
    markNotificationsAsRead(userID: string): Promise<void>;
    deleteAllNotifications(userID: string): Promise<void>;
    getUnreadNotificationsCount(userID: string): Promise<number>;
}