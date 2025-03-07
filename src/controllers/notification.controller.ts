import { NextFunction, Request, Response } from "express";
import { INotificationService } from "../interface/INotificationService";
import logger from "../helpers/logger";
import createHttpError from "http-errors";

class NotificationController {
    private notificationService: INotificationService;
    constructor(notificationService: INotificationService) {
        this.notificationService = notificationService;
    }

    /* Get notifications for the authenticated user */
    async getNotifications(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getNotifications method.`, { method: "getNotifications", layer: "controller" });
        try {
            const userID = req?.user?.aud;
            logger.info(`Fetching notifications for userID: ${userID}`, { layer: "controller" });

            const notifications = await this.notificationService.getNotifications(userID);

            logger.info(`Successfully fetched notifications for userID: ${userID}`, { layer: "controller" });
            res.status(200).json({ success: true, message: null, data: { notifications } });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getNotifications. userID: ${req?.user?.aud}`, { error, layer: "controller" });
            } else {
                logger.error(`Unexpected error in getNotifications. userID: ${req?.user?.aud}`, { error, layer: "controller" });
            }
            next(error);
        } finally {
            logger.debug(`Exiting getNotifications method.`, { method: "getNotifications", layer: "controller" });
        }
    }

    /* Mark all notifications as read for the authenticated user */
    async markNotificationsAsRead(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering markNotificationsAsRead method.`, { method: "markNotificationsAsRead", layer: "controller" });
        try {
            const userID = req?.user?.aud;
            logger.info(`Marking notifications as read for userID: ${userID}`, { layer: "controller" });

            await this.notificationService.markNotificationsAsRead(userID);

            logger.info(`Successfully marked notifications as read for userID: ${userID}`, { layer: "controller" });
            res.status(200).json({ success: true, message: "Notifications marked as read", data: null });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in markNotificationsAsRead. userID: ${req?.user?.aud}`, { error, layer: "controller" });
            } else {
                logger.error(`Unexpected error in markNotificationsAsRead. userID: ${req?.user?.aud}`, { error, layer: "controller" });
            }
            next(error);
        } finally {
            logger.debug(`Exiting markNotificationsAsRead method.`, { method: "markNotificationsAsRead", layer: "controller" });
        }
    }

    /* Delete all notifications for the authenticated user */
    async deleteNotifications(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering deleteNotifications method.`, { method: "deleteNotifications", layer: "controller" });
        try {
            const userID = req?.user?.aud;
            logger.info(`Deleting notifications for userID: ${userID}`, { layer: "controller" });

            await this.notificationService.deleteAllNotifications(userID);

            logger.info(`Successfully deleted notifications for userID: ${userID}`, { layer: "controller" });
            res.status(200).json({ success: true, message: "Notifications deleted", data: null });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in deleteNotifications. userID: ${req?.user?.aud}`, { error, layer: "controller" });
            } else {
                logger.error(`Unexpected error in deleteNotifications. userID: ${req?.user?.aud}`, { error, layer: "controller" });
            }
            next(error);
        } finally {
            logger.debug(`Exiting deleteNotifications method.`, { method: "deleteNotifications", layer: "controller" });
        }
    }

    /* Get the count of unread notifications for the authenticated user */
    async getUnreadNotificationsCount(req: Request, res: Response, next: NextFunction) {
        logger.debug(`Entering getUnreadNotificationsCount method.`, { method: "getUnreadNotificationsCount", layer: "controller" });
        try {
            const userID = req?.user?.aud;
            logger.info(`Fetching unread notifications count for userID: ${userID}`, { layer: "controller" });

            const count = await this.notificationService.getUnreadNotificationCount(userID);

            logger.info(`Successfully fetched unread notifications count for userID: ${userID}`, { layer: "controller" });
            res.status(200).json({ success: true, message: null, data: { count } });
        } catch (error) {
            if (createHttpError.isHttpError(error)) {
                logger.error(`HttpError in getUnreadNotificationsCount. userID: ${req?.user?.aud}`, { error, layer: "controller" });
            } else {
                logger.error(`Unexpected error in getUnreadNotificationsCount. userID: ${req?.user?.aud}`, { error, layer: "controller" });
            }
            next(error);
        } finally {
            logger.debug(`Exiting getUnreadNotificationsCount method.`, { method: "getUnreadNotificationsCount", layer: "controller" });
        }
    }
}

export default NotificationController;