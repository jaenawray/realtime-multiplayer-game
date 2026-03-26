import { withAuth } from "@gamenite/shared";
import { type RestAPI, type GameServer } from "../types.ts";
import { z } from "zod";
import { checkAuth } from "../services/auth.service.ts";
import { blockUser, unblockUser } from "../services/block.service.ts";

const zTargetUsername = z.object({
  targetUsername: z.string(),
});

/**
 * Block another user (removes friendship and pending requests between users)
 */
export const postBlockUser =
  (io: GameServer): RestAPI<{ success: true }> =>
  async (req, res) => {
    const body = withAuth(zTargetUsername).safeParse(req.body);
    if (!body.success) {
      res.status(400).send({ error: "Poorly-formed request" });
      return;
    }

    const user = await checkAuth(body.data.auth);
    if (!user) {
      res.status(403).send({ error: "Invalid credentials" });
      return;
    }

    const target = body.data.payload.targetUsername;
    const result = await blockUser(user.username, target);
    if ("error" in result) {
      res.status(400).send({ error: result.error });
      return;
    }

    if (result.wasFriends) {
      io.emit("friendRemoved", {
        username: user.username,
        friendUsername: target,
      });
    }
    io.emit("userBlocked", { blockerUsername: user.username, blockedUsername: target });
    res.send({ success: true });
  };

/**
 * Remove a block created by the current user
 */
export const postUnblockUser =
  (io: GameServer): RestAPI<{ success: true }> =>
  async (req, res) => {
    const body = withAuth(zTargetUsername).safeParse(req.body);
    if (!body.success) {
      res.status(400).send({ error: "Poorly-formed request" });
      return;
    }

    const user = await checkAuth(body.data.auth);
    if (!user) {
      res.status(403).send({ error: "Invalid credentials" });
      return;
    }

    const target = body.data.payload.targetUsername;
    const result = await unblockUser(user.username, target);
    if ("error" in result) {
      res.status(400).send({ error: result.error });
      return;
    }

    io.emit("userUnblocked", { blockerUsername: user.username, blockedUsername: target });
    res.send({ success: true });
  };
