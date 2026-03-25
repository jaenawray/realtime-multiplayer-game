/* eslint no-console: "off" */

import express, { Router } from "express";
import { Server } from "socket.io";
import { z } from "zod";
import * as http from "node:http";
import * as chat from "./controllers/chat.controller.ts";
import * as friend from "./controllers/friend.controller.ts";
import * as game from "./controllers/game.controller.ts";
import * as presence from "./controllers/presence.controller.ts";
import * as user from "./controllers/user.controller.ts";
import * as thread from "./controllers/thread.controller.ts";
import { unregisterSocket } from "./services/presence.service.ts";
import { type GameServer } from "./types.ts";

export const app = express();
export const httpServer = http.createServer(app);
const io: GameServer = new Server(httpServer);

app.use(express.json());

app.use(
  "/api",
  Router()
    .use(
      "/game",
      express
        .Router() //
        .post("/create", game.postCreate)
        .get("/list", game.getList)
        .get("/:id", game.getById),
    )
    .use(
      "/thread",
      express
        .Router() //
        .post("/create", thread.postCreate)
        .get("/list", thread.getList)
        .get("/:id", thread.getById)
        .post("/:id/comment", thread.postByIdComment),
    )
    .use(
      "/user",
      Router() // Any concrete routes here should be disallowed as usernames
        .post("/list", user.postList)
        .post("/login", user.postLogin)
        .post("/signup", user.postSignup)
        .post("/friend-request", friend.postFriendRequest(io))
        .post("/friend-requests", friend.getFriendRequests)
        .post("/outgoing-friend-requests", friend.getOutgoingFriendRequests)
        .post("/friend-request/:requestId/accept", friend.postAcceptFriendRequest(io))
        .post("/friend-request/:requestId/decline", friend.postDeclineFriendRequest(io))
        .delete("/friend-request/:requestId", friend.deleteFriendRequest(io))
        .post("/friend-status", friend.postFriendStatus)
        .post("/friends-list", friend.getFriendsListEndpoint)
        .post("/remove-friend", friend.postRemoveFriend(io))
        .post("/:username", user.postByUsername)
        .get("/:username", user.getByUsername),
    ),
);

io.on("connection", (socket) => {
  const socketId = socket.id;
  console.log(`CONN [${socketId}] connected`);

  socket.on("disconnect", () => {
    unregisterSocket(io, socketId);
    console.log(`CONN [${socketId}] disconnected`);
  });

  socket.on("chatJoin", chat.socketJoin(socket, io));
  socket.on("chatLeave", chat.socketLeave(socket, io));
  socket.on("chatSendMessage", chat.socketSendMessage(socket, io));

  socket.on("gameJoinAsPlayer", game.socketJoinAsPlayer(socket, io));
  socket.on("gameMakeMove", game.socketMakeMove(socket, io));
  socket.on("gameStart", game.socketStart(socket, io));
  socket.on("gameWatch", game.socketWatch(socket, io));

  socket.on("presenceRegister", presence.socketPresenceRegister(socket, io));
  socket.on("presenceUnregister", presence.socketPresenceUnregister(socket, io));

  socket.onAny((name, payload) => {
    const zPayload = z.object({ auth: z.object({ username: z.string() }), payload: z.any() });
    const checked = zPayload.safeParse(payload);

    if (checked.error) {
      console.log(`RECV error: ${checked.error.message}`);
    } else {
      console.log(
        `RECV [${socketId}] got ${name}${checked.data.auth.username} ${JSON.stringify(checked.data.payload)}`,
      );
    }
  });
  socket.onAnyOutgoing((name) => {
    console.log(`SEND [${socketId}] gets ${name}`);
  });
});
