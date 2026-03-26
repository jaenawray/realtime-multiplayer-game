import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import supertest, { type Response } from "supertest";
import { app } from "../src/app.ts";

let response: Response;
const auth1 = { username: "user1", password: "pwd1111" };
const user1 = { username: "user1", display: "Yāo", isOnline: false, profileVisibility: "public" };
const auth2 = { username: "user2", password: "pwd2222" };
const user2 = {
  username: "user2",
  display: "Sénior Dos",
  isOnline: false,
  profileVisibility: "public",
};

describe("GET /api/user/:id", () => {
  it("should 404 for nonexistent users", async () => {
    response = await supertest(app).get(`/api/user/${randomUUID().toString()}`);
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ error: "User not found" });
  });

  it("should return existing users", async () => {
    response = await supertest(app).get(`/api/user/user1`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ ...user1, createdAt: expect.anything() });

    response = await supertest(app).get(`/api/user/user2`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ ...user2, createdAt: expect.anything() });
  });
});

describe("GET /api/user/:id/stats", () => {
  it("should 404 for nonexistent users", async () => {
    response = await supertest(app).get(`/api/user/${randomUUID().toString()}/stats`);
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ error: "User not found" });
  });

  it("should return aggregated stats with games played and wins by type", async () => {
    response = await supertest(app).get(`/api/user/user2/stats`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      username: "user2",
      gamesPlayed: 1,
      wins: 0,
      byType: {
        nim: { played: 1, wins: 0 },
        guess: { played: 0, wins: 0 },
        hangman: { played: 0, wins: 0 },
      },
    });

    response = await supertest(app).get(`/api/user/user3/stats`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      username: "user3",
      gamesPlayed: 1,
      wins: 1,
      byType: {
        nim: { played: 1, wins: 1 },
        guess: { played: 0, wins: 0 },
        hangman: { played: 0, wins: 0 },
      },
    });
  });
});

describe("GET /api/user/:id/history", () => {
  it("should 404 for nonexistent users", async () => {
    response = await supertest(app).get(`/api/user/${randomUUID().toString()}/history`);
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ error: "User not found" });
  });

  it("should 400 for malformed pagination query", async () => {
    response = await supertest(app).get(`/api/user/user2/history?offset=-1&limit=5`);
    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({ error: "Poorly-formed request" });
  });

  it("should return paginated recent game history", async () => {
    response = await supertest(app).get(`/api/user/user2/history?offset=0&limit=1`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      total: 1,
      offset: 0,
      limit: 1,
      entries: [
        {
          gameId: expect.any(String),
          gameType: "nim",
          won: false,
          playedAt: expect.anything(),
          players: [
            { username: "user2", display: "Sénior Dos" },
            { username: "user3", display: "Frau Drei" },
          ],
        },
      ],
    });

    response = await supertest(app).get(`/api/user/user2/history?offset=1&limit=1`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      total: 1,
      offset: 1,
      limit: 1,
      entries: [],
    });
  });
});

describe("POST /api/user/login", () => {
  it("should return 400 on ill-formed payload", async () => {
    response = await supertest(app)
      .post("/api/user/login")
      .send({ ...auth1, password: 3 });
    expect(response.status).toBe(400);
  });

  it("should return the same response if user does not exist or if user exists and password is wrong", async () => {
    const expectedResponse = { error: "Invalid username or password" };

    // Incorrect password for existing user
    response = await supertest(app)
      .post("/api/user/login")
      .send({ ...auth1, password: "no" });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(expectedResponse);

    // Nonexistent username
    response = await supertest(app)
      .post("/api/user/login")
      .send({ ...auth1, username: randomUUID().toString() });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(expectedResponse);
  });

  it("should accept a correct username/password combination", async () => {
    response = await supertest(app).post("/api/user/login").send(auth1);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ ...user1, createdAt: expect.anything() });
  });
});

describe("POST/api/user/:username", () => {
  it("should return 400 on ill-formed payloads", async () => {
    response = await supertest(app).post("/api/user/user1").send({ auth: auth1, payload: 4 });
    expect(response.status).toBe(400);
  });

  it("should reject invalid authorization", async () => {
    response = await supertest(app)
      .post("/api/user/user1")
      .send({ auth: { ...auth1, password: "wrong" }, payload: { display: "New User 1 Display?" } });
    expect(response.status).toBe(403);
  });

  it("requires the authorization to match the route", async () => {
    response = await supertest(app)
      .post("/api/user/user1")
      .send({ auth: auth2, payload: { display: "New User 1 Display!" } });
    expect(response.status).toBe(403);
  });

  it("should update individual parts of a user correctly", async () => {
    // Change the username
    response = await supertest(app)
      .post("/api/user/user1")
      .send({ auth: auth1, payload: { display: "New User 1 Display" } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      display: "New User 1 Display",
      createdAt: expect.anything(),
    });

    // We have changed the username, which should be reflected
    response = await supertest(app)
      .post("/api/user/user1")
      .send({ auth: auth1, payload: { display: "New User 1 Display" } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      display: "New User 1 Display",
      createdAt: expect.anything(),
    });

    // Change the password
    response = await supertest(app)
      .post("/api/user/user1")
      .send({ auth: auth1, payload: { password: "new_password_1" } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      display: "New User 1 Display",
      createdAt: expect.anything(),
    });

    // We have changed the password, so auth shouldn't work
    response = await supertest(app)
      .post("/api/user/user1")
      .send({ auth: auth1, payload: { password: "new_password_1" } });
    expect(response.status).toBe(403);

    // But the new password should allow changes
    response = await supertest(app)
      .post("/api/user/user1")
      .send({
        auth: { ...auth1, password: "new_password_1" },
        payload: { display: "Newer User 1 Display" },
      });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      display: "Newer User 1 Display",
      createdAt: expect.anything(),
    });
  }, 15_000);
});

describe("POST /api/user/signup", () => {
  const password = "pwd";

  it("should create a user given valid arguments", async () => {
    const username = randomUUID().toString();
    response = await supertest(app).post("/api/user/signup").send({ username, password });
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^application.json/);
    expect(response.body).toStrictEqual({
      username,
      display: username,
      createdAt: expect.anything(),
      isOnline: false,
    });
  });

  it("should return 400 on ill-formed payload", async () => {
    const username = randomUUID().toString();
    response = await supertest(app).post("/api/user/signup").send({ username });
    expect(response.status).toBe(400);
  });

  it("should return error if trying to make an existing user", async () => {
    const username = randomUUID().toString();
    response = await supertest(app).post("/api/user/signup").send({ username, password });
    expect(response.status).toBe(200);
    response = await supertest(app).post("/api/user/signup").send({ username, password });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ error: "User already exists" });
  });

  it("should not allow a username that conflicts with created paths", async () => {
    const expectedResponse = { error: "That is not a permitted username" };

    response = await supertest(app).post("/api/user/signup").send({ username: "signup", password });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(expectedResponse);

    response = await supertest(app).post("/api/user/signup").send({ username: "login", password });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(expectedResponse);
  });
});

describe("POST /api/user/list", () => {
  it("should return 400 on ill-formed payload", async () => {
    response = await supertest(app).post("/api/user/list").send(auth1);
    expect(response.status).toBe(400);
  });

  it("should indicate an error if usernames do not exist", async () => {
    response = await supertest(app).post("/api/user/list").send(["user1", randomUUID().toString()]);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ error: "Usernames do not all exist" });
  });

  it("accepts the empty list", async () => {
    response = await supertest(app).post("/api/user/list").send([]);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([]);
  });

  it("accepts valid usernames and returns appropriate responses", async () => {
    response = await supertest(app).post("/api/user/list").send(["user2", "user1"]);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      { ...user2, createdAt: expect.anything() },
      { ...user1, createdAt: expect.anything() },
    ]);
  });

  it("accepts duplicates and returns users in the order provided", async () => {
    response = await supertest(app).post("/api/user/list").send(["user1", "user2", "user1"]);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      { ...user1, createdAt: expect.anything() },
      { ...user2, createdAt: expect.anything() },
      { ...user1, createdAt: expect.anything() },
    ]);
  });
});
