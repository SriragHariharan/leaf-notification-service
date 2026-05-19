import { Notification } from "./notification.interface";

export interface INotificationService {
    getNotifications(userID: string): Promise<Notification[]>;
    markNotificationsAsRead(userID: string): Promise<void>;
    markNotificationAsRead(userID: string, notificationId: string): Promise<Notification>;
    deleteAllNotifications(userID: string): Promise<void>;
    getUnreadNotificationCount(userID: string): Promise<number>;
}
