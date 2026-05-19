import { User } from "../models/User.model";
import type { INotificationRepository } from "../interface/INotificationRepository";
import type { CreateNotificationInput } from "../interface/notification.interface";
import type { FriendshipEvent } from "../messaging/kafka/contracts/friendship-event.dto";
import type { InteractionEvent } from "../messaging/kafka/contracts/interaction-event.dto";
import logger from "../helpers/logger";
import {
  emitFriendRequestReceived,
  emitPostNotification,
} from "./socket-notification.service";

type EventHandler = (event: Record<string, unknown>) => Promise<void>;

export class EventNotificationService {
  private readonly handlers: Map<string, EventHandler>;

  constructor(private readonly notificationRepository: INotificationRepository) {
    this.handlers = new Map([
      ["friend_request.sent", (e) => this.handleFriendRequestSent(e as unknown as FriendshipEvent)],
      ["post.liked", (e) => this.handlePostLiked(e as unknown as InteractionEvent)],
      ["post.commented", (e) => this.handlePostCommented(e as unknown as InteractionEvent)],
    ]);
  }

  async handle(eventType: string, event: Record<string, unknown>): Promise<void> {
    const handler = this.handlers.get(eventType);
    if (!handler) {
      logger.debug(`No notification handler for eventType=${eventType}`);
      return;
    }
    await handler(event);
  }

  private async resolveActorUsername(actorUserId: string): Promise<string> {
    const user = await User.findOne({ userID: actorUserId }).select("username").lean();
    return user?.username ?? "Someone";
  }

  private async persistAndEmit(
    input: CreateNotificationInput,
    socket: "friend_request" | "post",
  ): Promise<void> {
    const result = await this.notificationRepository.createIfNotExists(input);
    if (!result) {
      return;
    }

    if (!result.isNew) {
      logger.debug(`Duplicate notification skipped dedupeKey=${input.dedupeKey}`);
      return;
    }

    const { notification } = result;

    if (socket === "friend_request") {
      emitFriendRequestReceived(input.userID, notification);
    } else {
      emitPostNotification(input.userID, notification);
    }

    logger.info(`Notification created type=${input.type} recipient=${input.userID}`, {
      layer: "event-notification",
      dedupeKey: input.dedupeKey,
    });
  }

  private async handleFriendRequestSent(event: FriendshipEvent): Promise<void> {
    const actorUserId = event.actorUserId?.trim();
    const targetUserId = event.targetUserId?.trim();
    const requestId = event.requestId?.trim();

    if (!actorUserId || !targetUserId || !requestId) {
      logger.warn("friend_request.sent missing required fields", { event });
      return;
    }

    const username = await this.resolveActorUsername(actorUserId);
    const dedupeKey = `friend_request.sent:${requestId}`;

    await this.persistAndEmit(
      {
        userID: targetUserId,
        content: `${username} sent you a friend request`,
        type: "friend_request",
        interactedBy: actorUserId,
        entityId: requestId,
        entityType: "friend_request",
        dedupeKey,
      },
      "friend_request",
    );
  }

  private async handlePostLiked(event: InteractionEvent): Promise<void> {
    const actorUserId = event.actorUserId?.trim();
    const targetUserId = event.targetUserId?.trim();
    const postId = event.postId?.trim();

    if (!actorUserId || !targetUserId || !postId) {
      logger.warn("post.liked missing required fields", { event });
      return;
    }

    if (actorUserId === targetUserId) {
      return;
    }

    const username = await this.resolveActorUsername(actorUserId);
    const dedupeKey = `post.liked:${postId}:${actorUserId}`;

    await this.persistAndEmit(
      {
        userID: targetUserId,
        content: `${username} liked your post`,
        type: "like",
        interactedBy: actorUserId,
        postId,
        entityId: postId,
        entityType: "post",
        dedupeKey,
      },
      "post",
    );
  }

  private async handlePostCommented(event: InteractionEvent): Promise<void> {
    const actorUserId = event.actorUserId?.trim();
    const targetUserId = event.targetUserId?.trim();
    const postId = event.postId?.trim();
    const commentId = event.commentId?.trim();

    if (!actorUserId || !targetUserId || !postId) {
      logger.warn("post.commented missing required fields", { event });
      return;
    }

    if (actorUserId === targetUserId) {
      return;
    }

    const username = await this.resolveActorUsername(actorUserId);
    const dedupeKey = commentId
      ? `post.commented:${postId}:${actorUserId}:${commentId}`
      : `post.commented:${postId}:${actorUserId}`;

    await this.persistAndEmit(
      {
        userID: targetUserId,
        content: `${username} commented on your post`,
        type: "comment",
        interactedBy: actorUserId,
        postId,
        entityId: postId,
        entityType: "post",
        dedupeKey,
      },
      "post",
    );
  }
}
