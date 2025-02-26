import { Notification } from "./notification.interface";

export interface INotificationService {
    getNotifications(userID: string): Promise<Notification[]>;
    markNotificationsAsRead(userID: string): Promise<void>;
    deleteAllNotifications(userID: string): Promise<void>;
    getUnreadNotificationCount(userID: string): Promise<number>
}