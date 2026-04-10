import {
  type ConversationInfo,
  type ConversationThreadInfo,
  type DirectMessageInfo,
  withAuth,
  zGetConversationRequest,
  zUserAuth,
  zSendDirectMessageRequest,
} from "@gamenite/shared";
import { z } from "zod";
import { type GameServer, type RestAPI } from "../types.ts";
import { checkAuth } from "../services/auth.service.ts";
import {
  getConversation,
  getConversations,
  sendDirectMessage,
} from "../services/directMessage.service.ts";
import { getSocketIdsForUsername } from "../services/presence.service.ts";

/**
 * Send a direct message to another user.
 */
export const postDirectMessage =
  (io: GameServer): RestAPI<DirectMessageInfo> =>
  async (req, res) => {
    const body = withAuth(zSendDirectMessageRequest).safeParse(req.body);
    if (!body.success) {
      res.status(400).send({ error: "Poorly-formed request" });
      return;
    }

    const user = await checkAuth(body.data.auth);
    if (!user) {
      res.status(403).send({ error: "Invalid credentials" });
      return;
    }

    const { recipientUsername, text } = body.data.payload;
    const result = await sendDirectMessage(user.username, recipientUsername, text);
    if ("error" in result) {
      res.status(400).send({ error: result.error });
      return;
    }

    // Notify only the recipient's active sockets.
    for (const socketId of getSocketIdsForUsername(recipientUsername)) {
      io.to(socketId).emit("directMessageReceived", { message: result });
    }

    res.send(result);
  };

/**
 * Get all direct-message conversations for the current user.
 */
export const getDirectMessageConversations: RestAPI<ConversationInfo[]> = async (req, res) => {
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

  const conversations = await getConversations(user.username);
  res.send(conversations);
};

/**
 * Get the full direct-message thread between the current user and another user.
 */
export const postDirectMessageThread: RestAPI<ConversationThreadInfo> = async (req, res) => {
  const body = withAuth(zGetConversationRequest).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const result = await getConversation(user.username, body.data.payload.username);
  if ("error" in result) {
    res.status(400).send({ error: result.error });
    return;
  }

  res.send(result);
};
