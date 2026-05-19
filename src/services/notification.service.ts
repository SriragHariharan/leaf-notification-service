import createHttpError from "http-errors";
import logger from "../helpers/logger";
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
        logger.debug(`Entering getNotifications method. Param: ${userID}`, { method: "getNotifications", layer: "service" });
        try {
            logger.info(`Fetching notifications for userID: ${userID}`, { layer: "service" });

            const notifications = await this.notificationRepository.getNotifications(userID);

            logger.info(`Successfully fetched notifications for userID: ${userID}`, { layer: "service" });
            return notifications;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getNotifications. Param: ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getNotifications. Param: ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "Unable to fetch notifications");
            }
        } finally {
            logger.debug(`Exiting getNotifications method. Param: ${userID}`, { method: "getNotifications", layer: "service" });
        }
    }

    async markNotificationAsRead(userID: string, notificationId: string): Promise<Notification> {
        logger.debug(`Entering markNotificationAsRead method.`, {
            method: "markNotificationAsRead",
            layer: "service",
        });
        try {
            const notification = await this.notificationRepository.markNotificationAsRead(
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
            logger.error(`Unexpected error in markNotificationAsRead`, { error, layer: "service" });
            throw createHttpError(500, "Unable to mark notification as read");
        }
    }

    /* Mark all notifications as read for a specific user */
    async markNotificationsAsRead(userID: string): Promise<void> {
        logger.debug(`Entering markNotificationsAsRead method. Param: ${userID}`, { method: "markNotificationsAsRead", layer: "service" });
        try {
            logger.info(`Marking notifications as read for userID: ${userID}`, { layer: "service" });

            await this.notificationRepository.markNotificationsAsRead(userID);

            logger.info(`Successfully marked notifications as read for userID: ${userID}`, { layer: "service" });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in markNotificationsAsRead. Param: ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in markNotificationsAsRead. Param: ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "Unable to mark notifications as read");
            }
        } finally {
            logger.debug(`Exiting markNotificationsAsRead method. Param: ${userID}`, { method: "markNotificationsAsRead", layer: "service" });
        }
    }

    /* Delete all notifications for a specific user */
    async deleteAllNotifications(userID: string): Promise<void> {
        logger.debug(`Entering deleteAllNotifications method. Param: ${userID}`, { method: "deleteAllNotifications", layer: "service" });
        try {
            logger.info(`Deleting all notifications for userID: ${userID}`, { layer: "service" });

            await this.notificationRepository.deleteAllNotifications(userID);

            logger.info(`Successfully deleted all notifications for userID: ${userID}`, { layer: "service" });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in deleteAllNotifications. Param: ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in deleteAllNotifications. Param: ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "Unable to delete notifications");
            }
        } finally {
            logger.debug(`Exiting deleteAllNotifications method. Param: ${userID}`, { method: "deleteAllNotifications", layer: "service" });
        }
    }

    /* Get the count of unread notifications for a specific user */
    async getUnreadNotificationCount(userID: string): Promise<number> {
        logger.debug(`Entering getUnreadNotificationCount method. Param: ${userID}`, { method: "getUnreadNotificationCount", layer: "service" });
        try {
            logger.info(`Fetching unread notifications count for userID: ${userID}`, { layer: "service" });

            const count = await this.notificationRepository.getUnreadNotificationsCount(userID);

            logger.info(`Successfully fetched unread notifications count for userID: ${userID}`, { layer: "service" });
            return count;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getUnreadNotificationCount. Param: ${userID}`, { error, layer: "service" });
                throw error;
            } else {
                logger.error(`Unexpected error in getUnreadNotificationCount. Param: ${userID}`, { error, layer: "service" });
                throw createHttpError(500, "Unable to fetch unread notification count");
            }
        } finally {
            logger.debug(`Exiting getUnreadNotificationCount method. Param: ${userID}`, { method: "getUnreadNotificationCount", layer: "service" });
        }
    }
}

export default NotificationService;