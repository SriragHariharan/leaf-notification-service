export type InteractionEventType =
  | "post.liked"
  | "post.unliked"
  | "post.commented"
  | "post.uncommented";

export interface InteractionEvent {
  eventType: InteractionEventType;
  actorUserId: string;
  targetUserId: string;
  postId: string;
  timestamp: string;
  commentId?: string;
}
