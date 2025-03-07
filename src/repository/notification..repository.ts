import createHttpError from "http-errors";
import { INotificationRepository } from "../interface/INotificationRepository";
import { Notification } from "../models/Notification.model";
import logger from "../helpers/logger";

class NotificationRepository implements INotificationRepository {
    constructor() {}

    /* Get all notifications for a specific user */
    async getNotifications(userID: string): Promise<any[]> {
        logger.debug(`Entering getNotifications method. Param: ${userID}`, { method: "getNotifications", layer: "repository" });
        try {
            logger.info(`Fetching notifications for userID: ${userID}`, { layer: "repository" });

            const notifications = await Notification.find({ userID: userID, isDeleted: false }).sort({ createdAt: -1 });

            logger.info(`Successfully fetched notifications for userID: ${userID}`, { layer: "repository" });
            return notifications;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getNotifications. Param: ${userID}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in getNotifications. Param: ${userID}`, { error, layer: "repository" });
                throw createHttpError(500, "Unable to fetch notifications");
            }
        } finally {
            logger.debug(`Exiting getNotifications method. Param: ${userID}`, { method: "getNotifications", layer: "repository" });
        }
    }

    /* Mark all notifications as read for a specific user */
    async markNotificationsAsRead(userID: string): Promise<void> {
        logger.debug(`Entering markNotificationsAsRead method. Param: ${userID}`, { method: "markNotificationsAsRead", layer: "repository" });
        try {
            logger.info(`Marking notifications as read for userID: ${userID}`, { layer: "repository" });

            await Notification.updateMany({ userID: userID }, { isRead: true });

            logger.info(`Successfully marked notifications as read for userID: ${userID}`, { layer: "repository" });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in markNotificationsAsRead. Param: ${userID}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in markNotificationsAsRead. Param: ${userID}`, { error, layer: "repository" });
                throw createHttpError(500, "Unable to mark notifications as read");
            }
        } finally {
            logger.debug(`Exiting markNotificationsAsRead method. Param: ${userID}`, { method: "markNotificationsAsRead", layer: "repository" });
        }
    }

    /* Delete all notifications for a specific user (soft delete) */
    async deleteAllNotifications(userID: string): Promise<void> {
        logger.debug(`Entering deleteAllNotifications method. Param: ${userID}`, { method: "deleteAllNotifications", layer: "repository" });
        try {
            logger.info(`Deleting all notifications for userID: ${userID}`, { layer: "repository" });

            await Notification.updateMany({ userID }, { isDeleted: true });

            logger.info(`Successfully deleted all notifications for userID: ${userID}`, { layer: "repository" });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in deleteAllNotifications. Param: ${userID}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in deleteAllNotifications. Param: ${userID}`, { error, layer: "repository" });
                throw createHttpError(500, "Unable to delete notifications");
            }
        } finally {
            logger.debug(`Exiting deleteAllNotifications method. Param: ${userID}`, { method: "deleteAllNotifications", layer: "repository" });
        }
    }

    /* Get the count of unread notifications for a specific user */
    async getUnreadNotificationsCount(userID: string): Promise<number> {
        logger.debug(`Entering getUnreadNotificationsCount method. Param: ${userID}`, { method: "getUnreadNotificationsCount", layer: "repository" });
        try {
            logger.info(`Fetching unread notifications count for userID: ${userID}`, { layer: "repository" });

            const count = await Notification.countDocuments({ userID, isRead: false });

            logger.info(`Successfully fetched unread notifications count for userID: ${userID}`, { layer: "repository" });
            return count;
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getUnreadNotificationsCount. Param: ${userID}`, { error, layer: "repository" });
                throw error;
            } else {
                logger.error(`Unexpected error in getUnreadNotificationsCount. Param: ${userID}`, { error, layer: "repository" });
                throw createHttpError(500, "Unable to fetch unread notification count");
            }
        } finally {
            logger.debug(`Exiting getUnreadNotificationsCount method. Param: ${userID}`, { method: "getUnreadNotificationsCount", layer: "repository" });
        }
    }
}

export default NotificationRepository;