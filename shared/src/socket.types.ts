import {
  type ChatInfo,
  type ChatMoveLogPayload,
  type ChatNewMessagePayload,
  type ChatUserJoinedPayload,
  type ChatUserLeftPayload,
} from "./chat.types.ts";
import { type FriendRequestInfo } from "./friend.types.ts";
import { type NewMessagePayload } from "./message.types.ts";
import { type WithAuth } from "./auth.types.ts";
import { type GameMakeMovePayload, type GamePlayInfo, type TaggedGameView } from "./game.types.ts";
import { type SafeUserInfo } from "./user.types.ts";

/**
 * The Socket.io interface for client to server communication
 */
export interface ClientToServerEvents {
  chatJoin: (payload: WithAuth<string>) => void;
  chatLeave: (payload: WithAuth<string>) => void;
  chatSendMessage: (payload: WithAuth<NewMessagePayload>) => void;
  gameJoinAsPlayer: (payload: WithAuth<string>) => void;
  gameMakeMove: (payload: WithAuth<GameMakeMovePayload>) => void;
  gameStart: (payload: WithAuth<string>) => void;
  gameWatch: (payload: WithAuth<string>) => void;
  presenceRegister: (payload: WithAuth<Record<string, never>>) => void;
  presenceUnregister: (payload: WithAuth<Record<string, never>>) => void;
}

/**
 * The Socket.io interface for server to client information
 */
export interface ServerToClientEvents {
  chatJoined: (payload: ChatInfo) => void;
  chatMoveLog: (payload: ChatMoveLogPayload) => void;
  chatNewMessage: (payload: ChatNewMessagePayload) => void;
  chatUserJoined: (payload: ChatUserJoinedPayload) => void;
  chatUserLeft: (payload: ChatUserLeftPayload) => void;
  friendRequestReceived: (payload: FriendRequestInfo) => void;
  friendRequestCancelled: (payload: {
    requestId: string;
    fromUsername: string;
    toUsername: string;
  }) => void;
  friendRequestAccepted: (payload: FriendRequestInfo) => void;
  friendRequestDeclined: (payload: {
    requestId: string;
    fromUsername: string;
    toUsername: string;
  }) => void;
  friendRemoved: (payload: { username: string; friendUsername: string }) => void;
  userBlocked: (payload: { blockerUsername: string; blockedUsername: string }) => void;
  userUnblocked: (payload: { blockerUsername: string; blockedUsername: string }) => void;
  gamePlayersUpdated: (payload: SafeUserInfo[]) => void;
  gameStateUpdated: (payload: TaggedGameView & { forPlayer: boolean }) => void;
  gameWatched: (payload: GamePlayInfo) => void;
  userPresenceChanged: (payload: { username: string; isOnline: boolean }) => void;
}
