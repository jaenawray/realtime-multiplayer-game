import { z } from "zod";

/**
 * Profile visibility options: public (anyone can see) or friends-only
 */
export type ProfileVisibility = "public" | "friends-only";

/**
 * Represents a "safe" user object that excludes sensitive information like
 * the password, suitable for exposing to clients,
 * - `username`: unique username of the user
 * - `display`: A display name
 * - `createdAt`: when this when the user registered.
 * - `avatar`: URL to the user's profile picture, or undefined for default avatar
 * - `bio`: User's bio text (max 500 characters), or undefined if not set
 * - `profileVisibility`: Profile visibility setting (public or friends-only), defaults to public
 */
export interface SafeUserInfo {
  username: string;
  display: string;
  createdAt: Date;
  avatar?: string;
  bio?: string;
  profileVisibility?: ProfileVisibility;
}

/**
 * Aggregate stats for one game type.
 */
export interface GameTypeStats {
  played: number;
  wins: number;
}

/**
 * Aggregate game stats for one user, including totals and per-type stats.
 */
export interface UserGameStats {
  username: string;
  gamesPlayed: number;
  wins: number;
  byType: {
    nim: GameTypeStats;
    guess: GameTypeStats;
    hangman: GameTypeStats;
  };
}

/**
 * One recent completed game for a specific user.
 */
export interface UserRecentGame {
  gameId: string;
  gameType: "nim" | "guess" | "hangman";
  won: boolean;
  playedAt: Date;
  players: { username: string; display: string }[];
}

/**
 * Paginated response for recent game history on a user profile.
 */
export interface UserGameHistoryPage {
  total: number;
  offset: number;
  limit: number;
  entries: UserRecentGame[];
}

/*** TYPES USED IN THE USER API ***/

/**
 * Represents allowed updates to a user.
 */
export type UserUpdateRequest = z.infer<typeof zUserUpdateRequest>;
export const zUserUpdateRequest = z.object({
  password: z.string().optional(),
  display: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  profileVisibility: z.enum(["public", "friends-only"]).optional(),
});
