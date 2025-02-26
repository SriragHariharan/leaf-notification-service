import { NextFunction, Request, Response } from "express";
import { INotificationService } from "../interface/INotificationService";

class NotificationController {
    private notificationService: INotificationService
    constructor(notificationService: INotificationService){
        this.notificationService = notificationService
    }

    async getNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const userID = req?.user?.aud;
            const notifications = await this.notificationService.getNotifications(userID);
            res.status(200).json({success: true, message: null, data:{ notifications }});
        } catch (error) {
            next(error);
        }
    }

    async markNotificationsAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userID = req?.user?.aud;
            await this.notificationService.markNotificationsAsRead(userID);
            res.status(200).json({success: true, message: "Notifications marked as read", data: null});
        } catch (error) {
            next(error);
        }
    }

    async deleteNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const userID = req?.user?.aud;
            await this.notificationService.deleteAllNotifications(userID);
            res.status(200).json({success: true, message: "Notifications deleted", data: null});
        } catch (error) {
            next(error);
        }
    }

    //get the count of unread notifications
    async getUnreadNotificationsCount(req: Request, res: Response, next: NextFunction) {
        try {
            const userID = req?.user?.aud;
            const count = await this.notificationService.getUnreadNotificationCount(userID);
            res.status(200).json({success: true, message: null, data:{ count }});
        } catch (error) {
            next(error);
        }
    }
}

export default NotificationController;