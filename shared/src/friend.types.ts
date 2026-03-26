import type { SafeUserInfo } from "./user.types.ts";

/**
 * Relationship + block state between the viewer and another user's profile
 */
export type FriendProfileStatus =
  | { status: "none" }
  | { status: "pending_outgoing"; requestId: string }
  | { status: "pending_incoming" }
  | { status: "friends" }
  | { status: "blocked_by_them" }
  | { status: "blocked_by_you" };

/**
 * A friend request as returned to the client.
 * - `requestId`: database key
 * - `fromUser`: the user who sent the request
 * - `toUser`: the user who received the request
 * - `status`: current status of the request
 * - `createdAt`: when the request was sent
 */
export interface FriendRequestInfo {
  requestId: string;
  fromUser: SafeUserInfo;
  toUser: SafeUserInfo;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
}
