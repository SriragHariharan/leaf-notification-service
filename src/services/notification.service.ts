import { INotificationRepository } from "../interface/INotificationRepository";
import { INotificationService } from "../interface/INotificationService";
import { Notification } from "../interface/notification.interface";

class NotificationService implements INotificationService {
    
    private notificationRepository: INotificationRepository;
    constructor(notificationRepository: INotificationRepository){
        this.notificationRepository = notificationRepository;
    }

    //get notifications for a user
    async getNotifications(userID: string): Promise<Notification[]> {
        try {
            const notifications = await this.notificationRepository.getNotifications(userID);
            return notifications;
        } catch (error) {
            throw error;
        }
    }

    async markNotificationsAsRead(userID: string): Promise<void> {
        try {
            await this.notificationRepository.markNotificationsAsRead(userID);
        } catch (error) {
            throw error;
        }
    }

    async deleteAllNotifications(userID: string): Promise<void> {
        try {
            await this.notificationRepository.deleteAllNotifications(userID);
        } catch (error) {
            throw error;
        }
    }

    //get the count of unread notifications
    async getUnreadNotificationCount(userID: string): Promise<number> {
        try {
            const count = await this.notificationRepository.getUnreadNotificationsCount(userID);
            return count;
        } catch (error) {
            throw error;
        }
    }
}

export default NotificationService;