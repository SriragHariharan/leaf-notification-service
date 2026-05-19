import { Router, Request, Response, NextFunction } from "express";
import NotificationRepository from "../repository/notification..repository";
import { validateAccessToken } from "../helpers/jwt.helper";
import NotificationService from "../services/notification.service";
import NotificationController from "../controllers/notification.controller";

const notificationRouter = Router();

//DI
const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

//get all notifications
notificationRouter.get("/", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    notificationController.getNotifications(req, res, next);
})

//mark a single notification as read
notificationRouter.patch("/:notificationId/read", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    notificationController.markNotificationAsRead(req, res, next);
})

//mark all notifications as read
notificationRouter.put("/", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    notificationController.markNotificationsAsRead(req, res, next);
})

//soft delete all notifications
notificationRouter.delete("/", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    notificationController.deleteNotifications(req, res, next); 
})

//get count of unread notifications
notificationRouter.get("/count", validateAccessToken, (req: Request, res: Response, next: NextFunction) => {
    notificationController.getUnreadNotificationsCount(req, res, next);
})


export default notificationRouter;