import createHttpError from "http-errors";
import { INotificationRepository } from "../interface/INotificationRepository";
import {
  CreateNotificationInput,
  Notification,
  NotificationActor,
} from "../interface/notification.interface";
import { Notification as NotificationModel } from "../models/Notification.model";
import { User } from "../models/User.model";
import logger from "../helpers/logger";

function toNotification(doc: Record<string, unknown>, actor?: NotificationActor): Notification {
  return {
    id: String(doc._id),
    userID: String(doc.userID),
    type: doc.type as Notification["type"],
    content: String(doc.content),
    isRead: Boolean(doc.isRead),
    isDeleted: Boolean(doc.isDeleted),
    interactedBy: String(doc.interactedBy),
    postId: doc.postId ? String(doc.postId) : undefined,
    entityId: doc.entityId ? String(doc.entityId) : undefined,
    entityType: doc.entityType as Notification["entityType"],
    dedupeKey: doc.dedupeKey ? String(doc.dedupeKey) : undefined,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
    actor,
  };
}

class NotificationRepository implements INotificationRepository {
  async getNotifications(userID: string): Promise<Notification[]> {
    logger.debug(`Entering getNotifications method. Param: ${userID}`, {
      method: "getNotifications",
      layer: "repository",
    });
    try {
      const docs = await NotificationModel.find({ userID, isDeleted: false })
        .sort({ createdAt: -1 })
        .lean();

      const actorIds = [...new Set(docs.map((d) => String(d.interactedBy)))];
      const users = await User.find({ userID: { $in: actorIds } })
        .select("userID username profilePic")
        .lean();
      const userMap = new Map(
        users.map((u) => [
          String(u.userID),
          { username: String(u.username), profilePic: u.profilePic ?? null },
        ]),
      );

      return docs.map((doc) =>
        toNotification(doc as Record<string, unknown>, userMap.get(String(doc.interactedBy))),
      );
    } catch (error) {
      logger.error(`Unexpected error in getNotifications. Param: ${userID}`, {
        error,
        layer: "repository",
      });
      throw createHttpError(500, "Unable to fetch notifications");
    }
  }

  async createIfNotExists(
    input: CreateNotificationInput,
  ): Promise<{ notification: Notification; isNew: boolean } | null> {
    try {
      const existing = await NotificationModel.findOne({ dedupeKey: input.dedupeKey }).lean();
      if (existing) {
        return {
          notification: toNotification(existing as Record<string, unknown>),
          isNew: false,
        };
      }

      const doc = await NotificationModel.create({
        userID: input.userID,
        content: input.content,
        type: input.type,
        interactedBy: input.interactedBy,
        postId: input.postId,
        entityId: input.entityId,
        entityType: input.entityType,
        dedupeKey: input.dedupeKey,
        isRead: false,
        isDeleted: false,
      });

      return {
        notification: toNotification(doc.toObject() as Record<string, unknown>),
        isNew: true,
      };
    } catch (error: unknown) {
      const mongoError = error as { code?: number };
      if (mongoError?.code === 11000) {
        const existing = await NotificationModel.findOne({ dedupeKey: input.dedupeKey }).lean();
        return existing
          ? {
              notification: toNotification(existing as Record<string, unknown>),
              isNew: false,
            }
          : null;
      }
      logger.error("Failed to create notification", { error, dedupeKey: input.dedupeKey });
      throw error;
    }
  }

  async markNotificationsAsRead(userID: string): Promise<void> {
    await NotificationModel.updateMany({ userID, isDeleted: false }, { isRead: true });
  }

  async markNotificationAsRead(
    userID: string,
    notificationId: string,
  ): Promise<Notification | null> {
    const doc = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, userID, isDeleted: false },
      { isRead: true },
      { new: true },
    ).lean();

    if (!doc) {
      return null;
    }

    return toNotification(doc as Record<string, unknown>);
  }

  async deleteAllNotifications(userID: string): Promise<void> {
    await NotificationModel.updateMany({ userID }, { isDeleted: true });
  }

  async getUnreadNotificationsCount(userID: string): Promise<number> {
    return NotificationModel.countDocuments({ userID, isRead: false, isDeleted: false });
  }
}

export default NotificationRepository;
