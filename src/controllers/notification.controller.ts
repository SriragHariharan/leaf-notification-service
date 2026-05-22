import { NextFunction, Request, Response } from "express";
import { INotificationService } from "../interface/INotificationService";
import createHttpError from "http-errors";


class NotificationController {
    private notificationService: INotificationService;

    constructor(notificationService: INotificationService) {

        this.notificationService = notificationService;
    }

    /* Get notifications for the authenticated user */
    async getNotifications(req: Request, res: Response, next: NextFunction) {
        try {

            const userID = req?.user?.aud;

            const notifications = await this.notificationService.getNotifications(userID);
            res.status(200).json({ success: true, message: null, data: { notifications } });
        }
 catch (error) {

            next(error);
        }
    }

    async markNotificationAsRead(req: Request, res: Response, next: NextFunction) {
        try {

            const userID = req?.user?.aud;

            const notificationId = req.params.notificationId;

            const notification = await this.notificationService.markNotificationAsRead(
                userID,
                notificationId,
            );

            res.status(200).json({ success: true, message: null, data: { notification } });
        }
 catch (error) {

            next(error);
        }
    }

    /* Mark all notifications as read for the authenticated user */
    async markNotificationsAsRead(req: Request, res: Response, next: NextFunction) {
        try {

            const userID = req?.user?.aud;

            await this.notificationService.markNotificationsAsRead(userID);
            res.status(200).json({ success: true, message: "Notifications marked as read", data: null });
        }
 catch (error) {

            next(error);
        }
    }

    /* Delete all notifications for the authenticated user */
    async deleteNotifications(req: Request, res: Response, next: NextFunction) {
        try {

            const userID = req?.user?.aud;

            await this.notificationService.deleteAllNotifications(userID);
            res.status(200).json({ success: true, message: "Notifications deleted", data: null });
        }
 catch (error) {

            next(error);
        }
    }

    /* Get the count of unread notifications for the authenticated user */
    async getUnreadNotificationsCount(req: Request, res: Response, next: NextFunction) {
        try {

            const userID = req?.user?.aud;

            const count = await this.notificationService.getUnreadNotificationCount(userID);
            res.status(200).json({ success: true, message: null, data: { count } });
        }
 catch (error) {

            next(error);
        }
    }
}

export default NotificationController;