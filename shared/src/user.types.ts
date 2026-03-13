import { z } from "zod";

/**
 * Represents a "safe" user object that excludes sensitive information like
 * the password, suitable for exposing to clients,
 * - `username`: unique username of the user
 * - `display`: A display name
 * - `createdAt`: when this when the user registered.
 * - `avatar`: URL to the user's profile picture, or undefined for default avatar
 * - `bio`: User's bio text (max 500 characters), or undefined if not set
 */
export interface SafeUserInfo {
  username: string;
  display: string;
  createdAt: Date;
  avatar?: string;
  bio?: string;
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
});
