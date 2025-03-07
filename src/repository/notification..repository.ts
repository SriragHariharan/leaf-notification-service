import createHttpError from "http-errors";
import { INotificationRepository } from "../interface/INotificationRepository";
import { Notification } from "../models/Notification.model";

class NotificationRepository implements INotificationRepository{
    constructor(){}

    /* get all notifications for a specific user */
    async getNotifications(userID: string): Promise<any[]> {
        try {
            const notifications = await Notification.find({ userID: userID, isDeleted: false }).sort({ createdAt: -1 });
            return notifications;
        } catch (error) {
            throw createHttpError(500, "Unable to fetch notifications");
        }
    }

    async markNotificationsAsRead(userID: string): Promise<void> {
        try {
            await Notification.updateMany({ userID: userID }, { isRead: true });
        } catch (error) {
            throw createHttpError(500, "Unable to mark notifications as read");
        }
    }

    async deleteAllNotifications(userID: string): Promise<void> {
        try {
            await Notification.updateMany({ userID }, { isDeleted: true });
        } catch (error) {
            throw createHttpError(500, "Unable to delete notifications");
        }
    }   

    //get the count of unread notifications
    async getUnreadNotificationsCount(userID: string): Promise<number> {
        try {
            const count = await Notification.countDocuments({ userID, isRead: false });
            return count;
        } catch (error) {
            throw createHttpError(500, "Unable to fetch unread notification count");
        }
    }

}

export default NotificationRepository;