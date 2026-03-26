import type { SafeUserInfo } from "@gamenite/shared";
import type { RecordId } from "../models.ts";
import { BlockRepo, FriendRequestRepo } from "../repository.ts";
import { getUserByUsername } from "./auth.service.ts";
import { populateSafeUserInfo } from "./user.service.ts";

function blockKey(blockerUserId: RecordId, blockedUserId: RecordId): string {
  return `block:${blockerUserId}:${blockedUserId}`;
}

/**
 * Whether `blockerUserId` has blocked `blockedUserId`
 */
export async function isDirectedBlock(
  blockerUserId: RecordId,
  blockedUserId: RecordId,
): Promise<boolean> {
  return (await BlockRepo.find(blockKey(blockerUserId, blockedUserId))) !== null;
}

/**
 * Whether there is any block between the two users (in either direction)
 */
export async function hasBlockBetween(userIdA: RecordId, userIdB: RecordId): Promise<boolean> {
  if ((await BlockRepo.find(blockKey(userIdA, userIdB))) !== null) return true;
  return (await BlockRepo.find(blockKey(userIdB, userIdA))) !== null;
}

/**
 * Removes every friend request between two users (pending, accepted, or declined)
 * Returns whether they were friends (accepted)
 */
export async function removeAllFriendLinksBetween(
  userIdA: RecordId,
  userIdB: RecordId,
): Promise<boolean> {
  let wasFriends = false;
  const allKeys = await FriendRequestRepo.getAllKeys();
  for (const key of allKeys) {
    const req = await FriendRequestRepo.get(key);
    const pair =
      (req.fromUserId === userIdA && req.toUserId === userIdB) ||
      (req.fromUserId === userIdB && req.toUserId === userIdA);
    if (pair) {
      if (req.status === "accepted") wasFriends = true;
      await FriendRequestRepo.delete(key);
    }
  }
  return wasFriends;
}

export async function getFriendBlockErrorForViewer(
  viewerUserId: RecordId,
  otherUserId: RecordId,
): Promise<string | null> {
  if (!(await hasBlockBetween(viewerUserId, otherUserId))) return null;
  if (await isDirectedBlock(otherUserId, viewerUserId)) return "This user has blocked you";
  return "You have blocked this user";
}

/**
 * Blocks another user: records the block and removes friendship / pending requests between the two
 */
export async function blockUser(
  blockerUsername: string,
  blockedUsername: string,
): Promise<{ success: true; wasFriends: boolean } | { error: string }> {
  if (blockerUsername === blockedUsername) {
    return { error: "You cannot block yourself" };
  }

  const blocker = await getUserByUsername(blockerUsername);
  const blocked = await getUserByUsername(blockedUsername);
  if (!blocker || !blocked) return { error: "User not found" };

  const key = blockKey(blocker.userId, blocked.userId);
  if ((await BlockRepo.find(key)) !== null) {
    return { success: true, wasFriends: false };
  }

  const wasFriends = await removeAllFriendLinksBetween(blocker.userId, blocked.userId);
  await BlockRepo.set(key, {
    blockerUserId: blocker.userId,
    blockedUserId: blocked.userId,
    createdAt: new Date().toISOString(),
  });
  return { success: true, wasFriends };
}

/**
 * Users the given account has blocked (only when `blockerUsername` is the authenticated user)
 */
export async function getBlockedUsersForUser(blockerUsername: string): Promise<SafeUserInfo[]> {
  const blocker = await getUserByUsername(blockerUsername);
  if (!blocker) return [];

  const prefix = `block:${blocker.userId}:`;
  const allKeys = await BlockRepo.getAllKeys();
  const blockedUserIds: RecordId[] = [];
  for (const key of allKeys) {
    if (key.startsWith(prefix)) {
      const rec = await BlockRepo.find(key);
      if (rec) blockedUserIds.push(rec.blockedUserId);
    }
  }

  const users = await Promise.all(blockedUserIds.map((id) => populateSafeUserInfo(id)));
  return users.toSorted((a, b) =>
    a.display.localeCompare(b.display, undefined, { sensitivity: "base" }),
  );
}

export async function unblockUser(
  blockerUsername: string,
  blockedUsername: string,
): Promise<{ success: true } | { error: string }> {
  const blocker = await getUserByUsername(blockerUsername);
  const blocked = await getUserByUsername(blockedUsername);
  if (!blocker || !blocked) return { error: "User not found" };

  await BlockRepo.delete(blockKey(blocker.userId, blocked.userId));
  return { success: true };
}

export async function assertCanMessagePlayers(
  senderUserId: RecordId,
  playerUserIds: RecordId[],
): Promise<void> {
  for (const pid of playerUserIds) {
    if (pid === senderUserId) continue;
    if (await hasBlockBetween(senderUserId, pid)) {
      throw new Error("cannot send chat message to this user");
    }
  }
}
