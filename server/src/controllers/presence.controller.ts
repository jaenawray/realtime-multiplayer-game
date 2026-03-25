import { withAuth } from "@gamenite/shared";
import { z } from "zod";
import { type SocketAPI } from "../types.ts";
import { logSocketError } from "./socket.controller.ts";
import { checkAuth } from "../services/auth.service.ts";
import { registerSocket, unregisterSocket } from "../services/presence.service.ts";

const zEmptyPayload = z.object({});

/**
 * Associate the connection with the authenticated user for online status.
 */
export const socketPresenceRegister: SocketAPI = (socket, io) => async (body) => {
  try {
    const { auth } = withAuth(zEmptyPayload).parse(body);
    const user = await checkAuth(auth);
    if (!user) {
      return;
    }
    registerSocket(io, socket.id, user.username);
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Remove this connection from presence (logout while the socket stays open).
 */
export const socketPresenceUnregister: SocketAPI = (socket, io) => (body) => {
  try {
    withAuth(zEmptyPayload).parse(body);
    unregisterSocket(io, socket.id);
  } catch (err) {
    logSocketError(socket, err);
  }
  return Promise.resolve();
};
