import type { SafeUserInfo } from "./user.types.ts";

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
