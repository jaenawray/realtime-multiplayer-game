import { type FriendRequestInfo, withAuth, zUserAuth } from "@gamenite/shared";
import { type RestAPI } from "../types.ts";
import { z } from "zod";
import { checkAuth } from "../services/auth.service.ts";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendStatus,
  getPendingFriendRequests,
  sendFriendRequest,
} from "../services/friend.service.ts";

const zSendFriendRequest = z.object({
  targetUsername: z.string(),
});

/**
 * Send a friend request to another user.
 */
export const postFriendRequest: RestAPI<FriendRequestInfo> = async (req, res) => {
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
export const postAcceptFriendRequest: RestAPI<FriendRequestInfo, { requestId: string }> = async (
  req,
  res,
) => {
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
  res.send(result);
};

/**
 * Decline a friend request.
 */
export const postDeclineFriendRequest: RestAPI<{ success: true }, { requestId: string }> = async (
  req,
  res,
) => {
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
  res.send(result);
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
