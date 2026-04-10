import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { app } from "../src/app.ts";

const auth1 = { username: "user1", password: "pwd1111" };
const auth2 = { username: "user2", password: "pwd2222" };

const updatedProfile = {
  display: "Profile Pioneer",
  avatar: "https://example.com/profile-pioneer.png",
  bio: "Cross-feature integration tester.",
  profileVisibility: "friends-only" as const,
};

describe("Profile integration across friend system, games, forums, and chat", () => {
  it("propagates profile updates across friend, game, thread, and direct-message APIs", async () => {
    const updateRes = await supertest(app).post("/api/user/user1").send({
      auth: auth1,
      payload: updatedProfile,
    });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body).toStrictEqual(
      expect.objectContaining({
        username: "user1",
        ...updatedProfile,
      }),
    );

    // Friend system: request + accept + friends list should all show updated profile data.
    const requestRes = await supertest(app)
      .post("/api/user/friend-request")
      .send({
        auth: auth1,
        payload: { targetUsername: "user2" },
      });
    expect(requestRes.status).toBe(200);
    expect(requestRes.body).toStrictEqual(
      expect.objectContaining({
        status: "pending",
        fromUser: expect.objectContaining({ username: "user1", ...updatedProfile }),
      }),
    );

    const acceptRes = await supertest(app)
      .post(`/api/user/friend-request/${requestRes.body.requestId}/accept`)
      .send({ auth: auth2 });
    expect(acceptRes.status).toBe(200);

    const friendsListRes = await supertest(app)
      .post("/api/user/friends-list")
      .send({ auth: auth2 });
    expect(friendsListRes.status).toBe(200);
    expect(friendsListRes.body).toHaveLength(1);
    expect(friendsListRes.body[0]).toStrictEqual(
      expect.objectContaining({
        username: "user1",
        ...updatedProfile,
      }),
    );

    // Games: game creator and first player should reflect updated profile fields.
    const gameRes = await supertest(app).post("/api/game/create").send({
      auth: auth1,
      payload: "nim",
    });
    expect(gameRes.status).toBe(200);
    expect(gameRes.body.createdBy).toStrictEqual(
      expect.objectContaining({ username: "user1", ...updatedProfile }),
    );
    expect(gameRes.body.players[0]).toStrictEqual(
      expect.objectContaining({ username: "user1", ...updatedProfile }),
    );

    // Forums: thread author and comment author should reflect updated profile fields.
    const threadRes = await supertest(app)
      .post("/api/thread/create")
      .send({
        auth: auth1,
        payload: { title: "Integration test thread", text: "Checking profile propagation" },
      });
    expect(threadRes.status).toBe(200);
    expect(threadRes.body.createdBy).toStrictEqual(
      expect.objectContaining({ username: "user1", ...updatedProfile }),
    );

    const commentRes = await supertest(app)
      .post(`/api/thread/${threadRes.body.threadId}/comment`)
      .send({ auth: auth1, payload: "Still me, with updated profile" });
    expect(commentRes.status).toBe(200);
    expect(commentRes.body.comments).toHaveLength(1);
    expect(commentRes.body.comments[0].createdBy).toStrictEqual(
      expect.objectContaining({ username: "user1", ...updatedProfile }),
    );

    // Chat (direct messages): conversation metadata should reflect the updated profile.
    const dmRes = await supertest(app)
      .post("/api/user/direct-message")
      .send({
        auth: auth1,
        payload: { recipientUsername: "user2", text: "Hi from updated profile" },
      });
    expect(dmRes.status).toBe(200);
    expect(dmRes.body).toStrictEqual(
      expect.objectContaining({
        senderUsername: "user1",
        text: "Hi from updated profile",
      }),
    );

    const threadDmRes = await supertest(app)
      .post("/api/user/direct-messages/thread")
      .send({
        auth: auth2,
        payload: { username: "user1" },
      });
    expect(threadDmRes.status).toBe(200);
    expect(threadDmRes.body.otherUser).toStrictEqual(
      expect.objectContaining({
        username: "user1",
        ...updatedProfile,
      }),
    );
    expect(threadDmRes.body.messages).toHaveLength(1);
    expect(threadDmRes.body.messages[0]).toStrictEqual(
      expect.objectContaining({
        senderUsername: "user1",
        text: "Hi from updated profile",
      }),
    );
  });
});
