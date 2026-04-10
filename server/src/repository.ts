import { createRepo } from "./keyv.ts";
import type {
  AuthRecord,
  BlockRecord,
  ChatRecord,
  CommentRecord,
  ConversationRecord,
  DirectMessageRecord,
  FriendRequestRecord,
  GameRecord,
  MessageRecord,
  ThreadRecord,
  UserRecord,
  UserStatsRecord,
} from "./models.ts";

export const AuthRepo = createRepo<AuthRecord>("auth");
export const BlockRepo = createRepo<BlockRecord>("block");
export const ChatRepo = createRepo<ChatRecord>("chat");
export const CommentRepo = createRepo<CommentRecord>("comment");
export const ConversationRepo = createRepo<ConversationRecord>("conversation");
export const DirectMessageRepo = createRepo<DirectMessageRecord>("directMessage");
export const FriendRequestRepo = createRepo<FriendRequestRecord>("friendRequest");
export const GameRepo = createRepo<GameRecord>("game");
export const MessageRepo = createRepo<MessageRecord>("message");
export const ThreadRepo = createRepo<ThreadRecord>("thread");
export const UserRepo = createRepo<UserRecord>("user");
export const UserStatsRepo = createRepo<UserStatsRecord>("user_stats");
