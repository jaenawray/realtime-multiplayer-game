/**
 * Avatar selection options backed by DiceBear's free public HTTP API service.
 * Each URL points to an avatar generated on demand from the `seed` query param,
 * so the same seed always produces the same avatar.
 * source: https://www.dicebear.com/
 */
export const AVATAR_LIBRARY = [
  "https://api.dicebear.com/9.x/bottts/svg?seed=Avatar1",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Avatar2",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Avatar3",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Avatar4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Avatar5",
];

/** The avatar shown by default when a user has not chosen one */
export const DEFAULT_AVATAR = AVATAR_LIBRARY[0];
