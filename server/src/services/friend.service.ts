import type { FriendRequestInfo } from "@gamenite/shared";
import { FriendRequestRepo } from "../repository.ts";
import { getUserByUsername } from "./auth.service.ts";
import { populateSafeUserInfo } from "./user.service.ts";

/**
 * Send a friend request from one user to another.
 *
 * @param fromUsername - The username of the the sending user
 * @param toUsername - The username of the receiving user
 * @returns The created friend request info, or an error message if the request cannot be sent
 */
export async function sendFriendRequest(
  fromUsername: string,
  toUsername: string,
): Promise<FriendRequestInfo | { error: string }> {
  if (fromUsername === toUsername) {
    return { error: "You cannot send a friend request to yourself" };
  }

  const fromUser = await getUserByUsername(fromUsername);
  const toUser = await getUserByUsername(toUsername);
  if (!fromUser || !toUser) {
    return { error: "User not found" };
  }

  // Check all friend requests to see if one already exists between these two users
  const allKeys = await FriendRequestRepo.getAllKeys();
  for (const key of allKeys) {
    const req = await FriendRequestRepo.get(key);
    const isFromTo = req.fromUserId === fromUser.userId && req.toUserId === toUser.userId;
    const isToFrom = req.fromUserId === toUser.userId && req.toUserId === fromUser.userId;
    if (isFromTo || isToFrom) {
      if (req.status === "pending") {
        // Different error messages for each direction: sender vs recipient, safeguard against
        // race conditions
        return isFromTo
          ? { error: "Friend request already sent" }
          : { error: "This user has already sent you a friend request" };
      }
      if (req.status === "accepted") {
        return { error: "You are already friends" };
      }
    }
  }

  const requestId = await FriendRequestRepo.add({
    fromUserId: fromUser.userId,
    toUserId: toUser.userId,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  const [fromUserInfo, toUserInfo] = await Promise.all([
    populateSafeUserInfo(fromUser.userId),
    populateSafeUserInfo(toUser.userId),
  ]);

  return {
    requestId,
    fromUser: fromUserInfo,
    toUser: toUserInfo,
    status: "pending",
    createdAt: new Date(),
  };
}

/**
 * Get all pending friend requests for a user.
 *
 * @param username - The user whose incoming requests to fetch
 * @returns Sorted by most recent first
 */
export async function getPendingFriendRequests(username: string): Promise<FriendRequestInfo[]> {
  const user = await getUserByUsername(username);
  if (!user) return [];

  const allKeys = await FriendRequestRepo.getAllKeys();
  const results: FriendRequestInfo[] = [];

  for (const key of allKeys) {
    const req = await FriendRequestRepo.get(key);
    if (req.toUserId === user.userId && req.status === "pending") {
      const [fromUserInfo, toUserInfo] = await Promise.all([
        populateSafeUserInfo(req.fromUserId),
        populateSafeUserInfo(req.toUserId),
      ]);
      results.push({
        requestId: key,
        fromUser: fromUserInfo,
        toUser: toUserInfo,
        status: req.status,
        createdAt: new Date(req.createdAt),
      });
    }
  }

  return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Accept a friend request. Only the recipient can accept.
 *
 * @param requestId - The friend request ID
 * @param username - The accepting user (must be the recipient)
 */
export async function acceptFriendRequest(
  requestId: string,
  username: string,
): Promise<FriendRequestInfo | { error: string }> {
  const user = await getUserByUsername(username);
  if (!user) return { error: "User not found" };

  const req = await FriendRequestRepo.find(requestId);
  if (!req) return { error: "Friend request not found" };
  if (req.toUserId !== user.userId) return { error: "You can only accept requests sent to you" };
  if (req.status !== "pending") return { error: "This request has already been responded to" };

  await FriendRequestRepo.set(requestId, { ...req, status: "accepted" });

  const [fromUserInfo, toUserInfo] = await Promise.all([
    populateSafeUserInfo(req.fromUserId),
    populateSafeUserInfo(req.toUserId),
  ]);

  return {
    requestId,
    fromUser: fromUserInfo,
    toUser: toUserInfo,
    status: "accepted",
    createdAt: new Date(req.createdAt),
  };
}

/**
 * Decline a friend request. Only the recipient can decline.
 *
 * @param requestId - The friend request ID
 * @param username - The declining user (must be the recipient)
 */
export async function declineFriendRequest(
  requestId: string,
  username: string,
): Promise<{ success: true; fromUsername: string } | { error: string }> {
  const user = await getUserByUsername(username);
  if (!user) return { error: "User not found" };

  const req = await FriendRequestRepo.find(requestId);
  if (!req) return { error: "Friend request not found" };
  if (req.toUserId !== user.userId) return { error: "You can only decline requests sent to you" };
  if (req.status !== "pending") return { error: "This request has already been responded to" };

  const fromUser = await populateSafeUserInfo(req.fromUserId);
  await FriendRequestRepo.set(requestId, { ...req, status: "declined" });
  return { success: true, fromUsername: fromUser.username };
}

/**
 * Check the friend request status between two users (for display on profile).
 *
 * @param viewerUsername - The logged-in user viewing the profile
 * @param profileUsername - The user whose profile is being viewed
 * @returns none | pending_outgoing | pending_incoming | friends
 */
export async function getFriendStatus(
  viewerUsername: string,
  profileUsername: string,
): Promise<
  | { status: "none" }
  | { status: "pending_outgoing"; requestId: string }
  | { status: "pending_incoming" }
  | { status: "friends" }
  | { error: string }
> {
  const viewer = await getUserByUsername(viewerUsername);
  const profile = await getUserByUsername(profileUsername);
  if (!viewer || !profile) return { error: "User not found" };
  if (viewerUsername === profileUsername) return { status: "none" };

  const allKeys = await FriendRequestRepo.getAllKeys();
  for (const key of allKeys) {
    const req = await FriendRequestRepo.get(key);
    const isViewerToProfile = req.fromUserId === viewer.userId && req.toUserId === profile.userId;
    const isProfileToViewer = req.fromUserId === profile.userId && req.toUserId === viewer.userId;

    if (isViewerToProfile || isProfileToViewer) {
      if (req.status === "accepted") return { status: "friends" };
      if (req.status === "pending") {
        return isViewerToProfile
          ? { status: "pending_outgoing", requestId: key }
          : { status: "pending_incoming" };
      }
    }
  }

  return { status: "none" };
}
/**
 * Get all accepted friends for a user.
 *
 * @param username - The user whose friends to fetch
 * @returns List of friend user info
 */
export async function getFriendsList(username: string) {
  const user = await getUserByUsername(username);
  if (!user) return [];

  const allKeys = await FriendRequestRepo.getAllKeys();
  const friendUserIds = new Set<string>();

  for (const key of allKeys) {
    const req = await FriendRequestRepo.get(key);
    if (req.status === "accepted") {
      if (req.fromUserId === user.userId) {
        friendUserIds.add(req.toUserId);
      } else if (req.toUserId === user.userId) {
        friendUserIds.add(req.fromUserId);
      }
    }
  }

  const friends = await Promise.all(
    Array.from(friendUserIds).map((userId) => populateSafeUserInfo(userId)),
  );

  return friends;
}

/**
 * Remove a friend (delete the friendship).
 *
 * @param username - The user removing the friend
 * @param friendUsername - The friend to remove
 * @returns Success or error message
 */
export async function removeFriend(
  username: string,
  friendUsername: string,
): Promise<{ success: true } | { error: string }> {
  const user = await getUserByUsername(username);
  const friend = await getUserByUsername(friendUsername);
  if (!user || !friend) return { error: "User not found" };

  const allKeys = await FriendRequestRepo.getAllKeys();

  for (const key of allKeys) {
    const req = await FriendRequestRepo.get(key);
    const isUserToFriend = req.fromUserId === user.userId && req.toUserId === friend.userId;
    const isFriendToUser = req.fromUserId === friend.userId && req.toUserId === user.userId;

    if ((isUserToFriend || isFriendToUser) && req.status === "accepted") {
      await FriendRequestRepo.delete(key);
      return { success: true };
    }
  }

  return { error: "Friendship not found" };
}

/**
 * Cancel an outgoing friend request. Only the sender can cancel.
 *
 * @param requestId - The friend request ID
 * @param username - The cancelling user (must be the sender)
 * @returns Success or error message
 */
export async function cancelFriendRequest(
  requestId: string,
  username: string,
): Promise<{ success: true; toUsername: string } | { error: string }> {
  const user = await getUserByUsername(username);
  if (!user) return { error: "User not found" };

  const req = await FriendRequestRepo.find(requestId);
  if (!req) return { error: "Friend request not found" };
  if (req.fromUserId !== user.userId) return { error: "You can only cancel requests you sent" };
  if (req.status !== "pending") return { error: "This request has already been responded to" };

  const toUser = await populateSafeUserInfo(req.toUserId);
  await FriendRequestRepo.delete(requestId);
  return { success: true, toUsername: toUser.username };
}
