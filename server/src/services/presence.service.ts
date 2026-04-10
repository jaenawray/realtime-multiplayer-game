import type { SafeUserInfo } from "@gamenite/shared";
import type { GameServer } from "../types.ts";

const socketToUsername = new Map<string, string>();
const usernameRefCount = new Map<string, number>();

/**
 * Registers a socket as an active session for `username` and emits an online
 * event when this is the first active session for that user.
 */
export function registerSocket(io: GameServer, socketId: string, username: string): void {
  if (socketToUsername.has(socketId)) {
    const prev = socketToUsername.get(socketId)!;
    if (prev === username) {
      return;
    }
    unregisterSocket(io, socketId);
  }
  socketToUsername.set(socketId, username);
  const count = usernameRefCount.get(username) ?? 0;
  usernameRefCount.set(username, count + 1);
  if (count === 0) {
    io.emit("userPresenceChanged", { username, isOnline: true });
  }
}

/**
 * Removes a socket from presence and emits offline when that user has no
 * remaining registered sockets.
 */
export function unregisterSocket(io: GameServer, socketId: string): void {
  const username = socketToUsername.get(socketId);
  if (!username) {
    return;
  }
  socketToUsername.delete(socketId);
  const count = usernameRefCount.get(username) ?? 1;
  const next = count - 1;
  if (next <= 0) {
    usernameRefCount.delete(username);
    io.emit("userPresenceChanged", { username, isOnline: false });
  } else {
    usernameRefCount.set(username, next);
  }
}

export function isUserOnline(username: string): boolean {
  return (usernameRefCount.get(username) ?? 0) > 0;
}

export function attachPresence(user: SafeUserInfo): SafeUserInfo {
  return { ...user, isOnline: isUserOnline(user.username) };
}

export function attachPresenceToUsers(users: SafeUserInfo[]): SafeUserInfo[] {
  return users.map(attachPresence);
}

/**
 * Returns all currently connected socket IDs for a username.
 */
export function getSocketIdsForUsername(username: string): string[] {
  const socketIds: string[] = [];
  for (const [socketId, mappedUsername] of socketToUsername.entries()) {
    if (mappedUsername === username) {
      socketIds.push(socketId);
    }
  }
  return socketIds;
}
