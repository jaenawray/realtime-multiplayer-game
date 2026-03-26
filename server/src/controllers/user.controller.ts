import {
  type UserGameHistoryPage,
  type SafeUserInfo,
  type UserGameStats,
  withAuth,
  zUserAuth,
  zUserUpdateRequest,
} from "@gamenite/shared";
import {
  createUser,
  getUsersByUsername,
  populateSafeUserInfo,
  updateUser,
} from "../services/user.service.ts";
import { type RestAPI } from "../types.ts";
import { z } from "zod";
import { checkAuth, getUserByUsername } from "../services/auth.service.ts";
import { getUserGameHistory, getUserGameStats } from "../services/userStats.service.ts";

/**
 * Handles user login by validating credentials.
 * @param req The request containing username and password in the body.
 * @param res The response, either returning the user or an error.
 */
export const postLogin: RestAPI<SafeUserInfo> = async (req, res) => {
  const userAuth = zUserAuth.safeParse(req.body);
  if (!userAuth.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(userAuth.data);
  if (!user) {
    res.send({ error: "Invalid username or password" });
    return;
  }

  res.send(await populateSafeUserInfo(user.userId));
};

/**
 * Update a user's information
 * @param req A request containing a new password
 * @param res The response, either returning the updated user or an error
 */
export const postByUsername: RestAPI<SafeUserInfo, { username: string }> = async (req, res) => {
  const body = withAuth(zUserUpdateRequest).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user || user.username !== req.params.username) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  try {
    res.send(await updateUser(req.params.username, body.data.payload));
  } catch {
    res.status(500).send({ error: "Update failed" });
  }
};

/**
 * Handles the creation of a new user account.
 * @param req The request containing username and password in the body.
 * @param res The response, either returning the created user or an error.
 * @returns A promise resolving to void.
 */
export const postSignup: RestAPI<SafeUserInfo> = async (req, res) => {
  const userAuth = zUserAuth.safeParse(req.body);
  if (!userAuth.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  res.send(await createUser(userAuth.data.username, userAuth.data.password, new Date()));
};

/**
 * Retrieves a user by their username.
 * @param req The request containing the username as a route parameter.
 * @param res The response, either returning the user (200) or an error.
 */
export const getByUsername: RestAPI<SafeUserInfo, { username: string }> = async (req, res) => {
  const user = await getUserByUsername(req.params.username);
  if (!user) {
    res.status(404).send({ error: "User not found" });
    return;
  }
  res.send(await populateSafeUserInfo(user.userId));
};

/**
 * Retrieves aggregate game stats by username.
 */
export const getStatsByUsername: RestAPI<UserGameStats, { username: string }> = async (
  req,
  res,
) => {
  const stats = await getUserGameStats(req.params.username);
  if (!stats) {
    res.status(404).send({ error: "User not found" });
    return;
  }
  res.send(stats);
};

/**
 * Retrieves paginated recent completed-game history by username.
 */
export const getHistoryByUsername: RestAPI<UserGameHistoryPage, { username: string }> = async (
  req,
  res,
) => {
  const query = z
    .object({
      offset: z.coerce.number().int().min(0).default(0),
      limit: z.coerce.number().int().min(1).max(50).default(5),
    })
    .safeParse(req.query);

  if (!query.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const history = await getUserGameHistory(
    req.params.username,
    query.data.offset,
    query.data.limit,
  );
  if (!history) {
    res.status(404).send({ error: "User not found" });
    return;
  }

  res.send(history);
};

/**
 * Returns the user information for a list of users
 */
export const postList: RestAPI<SafeUserInfo[]> = async (req, res) => {
  const usernames = z.array(z.string()).safeParse(req.body);
  if (!usernames.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  let users: SafeUserInfo[];
  try {
    users = await getUsersByUsername(usernames.data);
  } catch {
    res.send({ error: "Usernames do not all exist" });
    return;
  }

  res.send(users);
};
