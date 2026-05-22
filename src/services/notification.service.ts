import createHttpError from "http-errors";
import { INotificationRepository } from "../interface/INotificationRepository";
import { INotificationService } from "../interface/INotificationService";
import { Notification } from "../interface/notification.interface";

class NotificationService implements INotificationService {
  private notificationRepository: INotificationRepository;

  constructor(notificationRepository: INotificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  /* Get notifications for a specific user */
  async getNotifications(userID: string): Promise<Notification[]> {
    try {
      const notifications =
        await this.notificationRepository.getNotifications(userID);
      return notifications;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "Unable to fetch notifications");
      }
    }
  }

  async markNotificationAsRead(
    userID: string,
    notificationId: string,
  ): Promise<Notification> {
    try {
      const notification =
        await this.notificationRepository.markNotificationAsRead(
          userID,
          notificationId,
        );

      if (!notification) {
        throw createHttpError(404, "Notification not found");
      }
      return notification;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      }
      throw createHttpError(500, "Unable to mark notification as read");
    }
  }

  /* Mark all notifications as read for a specific user */
  async markNotificationsAsRead(userID: string): Promise<void> {
    try {
      await this.notificationRepository.markNotificationsAsRead(userID);
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "Unable to mark notifications as read");
      }
    }
  }

  /* Delete all notifications for a specific user */
  async deleteAllNotifications(userID: string): Promise<void> {
    try {
      await this.notificationRepository.deleteAllNotifications(userID);
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "Unable to delete notifications");
      }
    }
  }

  /* Get the count of unread notifications for a specific user */
  async getUnreadNotificationCount(userID: string): Promise<number> {
    try {
      const count =
        await this.notificationRepository.getUnreadNotificationsCount(userID);
      return count;
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        throw error;
      } else {
        throw createHttpError(500, "Unable to fetch unread notification count");
      }
    }
  }
}

export default NotificationService;
