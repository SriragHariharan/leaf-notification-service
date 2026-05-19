import NotificationRepository from "../../repository/notification..repository";
import { EventNotificationService } from "../../services/event-notification.service";

const notificationRepository = new NotificationRepository();

export const eventNotificationService = new EventNotificationService(notificationRepository);
