import { afterEach, describe, expect, it, vi } from "vitest";
import { postDirectMessage } from "../src/controllers/directMessage.controller.ts";
import { registerSocket, unregisterSocket } from "../src/services/presence.service.ts";
import { blockUser } from "../src/services/block.service.ts";
import { acceptFriendRequest, sendFriendRequest } from "../src/services/friend.service.ts";
import type { GameServer } from "../src/types.ts";

const auth1 = { username: "user1", password: "pwd1111" };

function mockResponse() {
  const status = vi.fn().mockReturnThis();
  const send = vi.fn().mockReturnThis();
  return { status, send };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("DirectMessage controller", () => {
  it("returns a specific blocked-user message when sender is blocked", async () => {
    // user2 blocks user1
    const blocked = await blockUser("user2", "user1");
    expect(blocked).toStrictEqual({ success: true, wasFriends: false });

    const io = {
      to: vi.fn(() => ({ emit: vi.fn() })),
      emit: vi.fn(),
    } as unknown as GameServer;

    const req = {
      body: {
        auth: auth1,
        payload: { recipientUsername: "user2", text: "hello" },
      },
    } as { body: unknown };

    const res = mockResponse();

    await postDirectMessage(io)(req as never, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: "user2 has blocked you, unable to send message",
    });
  });

  it("emits direct-message notifications only to recipient sockets", async () => {
    // Make users friends first
    const request = await sendFriendRequest("user1", "user2");
    if ("error" in request) {
      throw new Error(`Failed to create friend request: ${request.error}`);
    }
    const accepted = await acceptFriendRequest(request.requestId, "user2");
    if ("error" in accepted) {
      throw new Error(`Failed to accept friend request: ${accepted.error}`);
    }

    const recipientSocketId = "recipient-socket";
    const senderSocketId = "sender-socket";

    // Presence tracker setup
    const presenceIo = {
      emit: vi.fn(),
    } as unknown as GameServer;
    registerSocket(presenceIo, recipientSocketId, "user2");
    registerSocket(presenceIo, senderSocketId, "user1");

    const emit = vi.fn();
    const io = {
      to: vi.fn(() => ({ emit })),
      emit: vi.fn(),
    } as unknown as GameServer;

    const req = {
      body: {
        auth: auth1,
        payload: { recipientUsername: "user2", text: "hello there" },
      },
    } as { body: unknown };

    const res = mockResponse();

    await postDirectMessage(io)(req as never, res as never);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(io.to).toHaveBeenCalledWith(recipientSocketId);
    expect(io.to).not.toHaveBeenCalledWith(senderSocketId);
    expect(emit).toHaveBeenCalledWith(
      "directMessageReceived",
      expect.objectContaining({
        message: expect.objectContaining({
          senderUsername: "user1",
        }),
      }),
    );

    unregisterSocket(presenceIo, recipientSocketId);
    unregisterSocket(presenceIo, senderSocketId);
  });
});
