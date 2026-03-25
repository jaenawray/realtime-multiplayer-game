import { type FriendRequestInfo, type SafeUserInfo, withAuth, zUserAuth } from "@gamenite/shared";
import { type RestAPI, type GameServer } from "../types.ts";
import { z } from "zod";
import { checkAuth } from "../services/auth.service.ts";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getFriendStatus,
  getPendingFriendRequests,
  sendFriendRequest,
  getFriendsList,
  removeFriend,
} from "../services/friend.service.ts";

const zSendFriendRequest = z.object({
  targetUsername: z.string(),
});

/**
 * Send a friend request to another user.
 */
export const postFriendRequest =
  (io: GameServer): RestAPI<FriendRequestInfo> =>
  async (req, res) => {
    const body = withAuth(zSendFriendRequest).safeParse(req.body);
    if (!body.success) {
      res.status(400).send({ error: "Poorly-formed request" });
      return;
    }

    const user = await checkAuth(body.data.auth);
    if (!user) {
      res.status(403).send({ error: "Invalid credentials" });
      return;
    }

    const result = await sendFriendRequest(user.username, body.data.payload.targetUsername);
    if ("error" in result) {
      res.status(400).send({ error: result.error });
      return;
    }

    io.emit("friendRequestReceived", result);
    res.send(result);
  };

/**
 * Get pending friend requests for current user.
 */
export const getFriendRequests: RestAPI<FriendRequestInfo[]> = async (req, res) => {
  const body = z.object({ auth: zUserAuth }).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const requests = await getPendingFriendRequests(user.username);
  res.send(requests);
};

/**
 * Accept a friend request.
 */
export const postAcceptFriendRequest =
  (io: GameServer): RestAPI<FriendRequestInfo, { requestId: string }> =>
  async (req, res) => {
    const body = z.object({ auth: zUserAuth }).safeParse(req.body);
    if (!body.success) {
      res.status(400).send({ error: "Poorly-formed request" });
      return;
    }

    const user = await checkAuth(body.data.auth);
    if (!user) {
      res.status(403).send({ error: "Invalid credentials" });
      return;
    }

    const result = await acceptFriendRequest(req.params.requestId, user.username);
    if ("error" in result) {
      res.status(400).send({ error: result.error });
      return;
    }

    io.emit("friendRequestAccepted", result);
    res.send(result);
  };

/**
 * Decline a friend request.
 */
export const postDeclineFriendRequest =
  (io: GameServer): RestAPI<{ success: true }, { requestId: string }> =>
  async (req, res) => {
    const body = z.object({ auth: zUserAuth }).safeParse(req.body);
    if (!body.success) {
      res.status(400).send({ error: "Poorly-formed request" });
      return;
    }

    const user = await checkAuth(body.data.auth);
    if (!user) {
      res.status(403).send({ error: "Invalid credentials" });
      return;
    }

    const result = await declineFriendRequest(req.params.requestId, user.username);
    if ("error" in result) {
      res.status(400).send({ error: result.error });
      return;
    }

    io.emit("friendRequestDeclined", {
      requestId: req.params.requestId,
      fromUsername: result.fromUsername,
      toUsername: user.username,
    });
    res.send({ success: true });
  };

/**
 * Get friend status between current user and another user (for profile display).
 */
export const postFriendStatus: RestAPI<
  | { status: "none" }
  | { status: "pending_outgoing" }
  | { status: "pending_incoming" }
  | { status: "friends" }
> = async (req, res) => {
  const body = withAuth(z.object({ username: z.string() })).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const result = await getFriendStatus(user.username, body.data.payload.username);
  if ("error" in result) {
    res.status(400).send({ error: result.error });
    return;
  }
  res.send(result);
};
/**
 * Get list of friends for current user.
 */
export const getFriendsListEndpoint: RestAPI<SafeUserInfo[]> = async (req, res) => {
  const body = z.object({ auth: zUserAuth }).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const friends = await getFriendsList(user.username);
  res.send(friends);
};

/**
 * Remove a friend.
 */
export const postRemoveFriend =
  (io: GameServer): RestAPI<{ success: true }> =>
  async (req, res) => {
    const body = withAuth(z.object({ friendUsername: z.string() })).safeParse(req.body);
    if (!body.success) {
      res.status(400).send({ error: "Poorly-formed request" });
      return;
    }

    const user = await checkAuth(body.data.auth);
    if (!user) {
      res.status(403).send({ error: "Invalid credentials" });
      return;
    }

    const result = await removeFriend(user.username, body.data.payload.friendUsername);
    if ("error" in result) {
      res.status(400).send({ error: result.error });
      return;
    }

    io.emit("friendRemoved", {
      username: user.username,
      friendUsername: body.data.payload.friendUsername,
    });
    res.send({ success: true });
  };

/**
 * Cancel an outgoing friend request.
 */
export const deleteFriendRequest =
  (io: GameServer): RestAPI<{ success: true }, { requestId: string }> =>
  async (req, res) => {
    const body = z.object({ auth: zUserAuth }).safeParse(req.body);
    if (!body.success) {
      res.status(400).send({ error: "Poorly-formed request" });
      return;
    }

    const user = await checkAuth(body.data.auth);
    if (!user) {
      res.status(403).send({ error: "Invalid credentials" });
      return;
    }

    const result = await cancelFriendRequest(req.params.requestId, user.username);
    if ("error" in result) {
      res.status(400).send({ error: result.error });
      return;
    }

    io.emit("friendRequestCancelled", {
      requestId: req.params.requestId,
      fromUsername: user.username,
      toUsername: result.toUsername,
    });
    res.send({ success: true });
  };
