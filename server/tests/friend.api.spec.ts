import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { app } from "../src/app.ts";

const auth1 = { username: "user1", password: "pwd1111" };
const auth2 = { username: "user2", password: "pwd2222" };
const auth3 = { username: "user3", password: "pwd3333" };

describe("Friend system API", () => {
  it("sends request, lists pending received, and accepts request", async () => {
    const sendRes = await supertest(app)
      .post("/api/user/friend-request")
      .send({
        auth: auth1,
        payload: { targetUsername: "user2" },
      });
    expect(sendRes.status).toBe(200);
    expect(sendRes.body).toStrictEqual({
      requestId: expect.any(String),
      fromUser: expect.objectContaining({ username: "user1" }),
      toUser: expect.objectContaining({ username: "user2" }),
      status: "pending",
      createdAt: expect.anything(),
    });

    const pendingRes = await supertest(app).post("/api/user/friend-requests").send({ auth: auth2 });
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body).toHaveLength(1);
    expect(pendingRes.body[0]).toStrictEqual(
      expect.objectContaining({
        requestId: sendRes.body.requestId,
        status: "pending",
      }),
    );

    const acceptRes = await supertest(app)
      .post(`/api/user/friend-request/${sendRes.body.requestId}/accept`)
      .send({ auth: auth2 });
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body).toStrictEqual(
      expect.objectContaining({
        requestId: sendRes.body.requestId,
        status: "accepted",
      }),
    );
  });

  it("declines a pending request and prevents responding twice", async () => {
    const sendRes = await supertest(app)
      .post("/api/user/friend-request")
      .send({
        auth: auth1,
        payload: { targetUsername: "user2" },
      });
    expect(sendRes.status).toBe(200);

    const declineRes = await supertest(app)
      .post(`/api/user/friend-request/${sendRes.body.requestId}/decline`)
      .send({ auth: auth2 });
    expect(declineRes.status).toBe(200);
    expect(declineRes.body).toStrictEqual({ success: true });

    const secondResponse = await supertest(app)
      .post(`/api/user/friend-request/${sendRes.body.requestId}/accept`)
      .send({ auth: auth2 });
    expect(secondResponse.status).toBe(400);
    expect(secondResponse.body).toStrictEqual({
      error: "This request has already been responded to",
    });
  });

  it("enforces blocking when sending friend requests and reports blocked status", async () => {
    const blockRes = await supertest(app)
      .post("/api/user/block")
      .send({
        auth: auth2,
        payload: { targetUsername: "user1" },
      });
    expect(blockRes.status).toBe(200);
    expect(blockRes.body).toStrictEqual({ success: true });

    const blockedSend = await supertest(app)
      .post("/api/user/friend-request")
      .send({
        auth: auth1,
        payload: { targetUsername: "user2" },
      });
    expect(blockedSend.status).toBe(400);
    expect(blockedSend.body).toStrictEqual({ error: "This user has blocked you" });
  });

  it("returns mutual friends between viewer and profile user", async () => {
    const req13 = await supertest(app)
      .post("/api/user/friend-request")
      .send({
        auth: auth1,
        payload: { targetUsername: "user3" },
      });
    await supertest(app)
      .post(`/api/user/friend-request/${req13.body.requestId}/accept`)
      .send({ auth: auth3 });

    const req23 = await supertest(app)
      .post("/api/user/friend-request")
      .send({
        auth: auth2,
        payload: { targetUsername: "user3" },
      });
    await supertest(app)
      .post(`/api/user/friend-request/${req23.body.requestId}/accept`)
      .send({ auth: auth3 });

    const mutualRes = await supertest(app)
      .post("/api/user/mutual-friends")
      .send({
        auth: auth1,
        payload: { username: "user2" },
      });
    expect(mutualRes.status).toBe(200);
    expect(mutualRes.body).toHaveLength(1);
    expect(mutualRes.body[0]).toStrictEqual(expect.objectContaining({ username: "user3" }));
  });
});
