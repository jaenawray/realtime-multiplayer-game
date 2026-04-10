import type { GameKey } from "@gamenite/shared";

/**
 * Record identifiers used to look up keys in a database. This type
 * abbreviation is intended to suggest that the key should be a randomly
 * generated unique ID.
 */
export type RecordId = string;

/**
 * Actual JavaScript Date objects can't necessarily be stored in a database;
 * this type indicates that the string should be the result of taking a Date
 * object and turning it to a string with the Date.toISOString() method.
 */
export type DateISO = string;

/**
 * Represents a user's authorization record in the database.
 * - `user`: the user ID of the corresponding User model
 * - `password`: the password for this user
 */
export interface AuthRecord {
  userId: RecordId; // References User models
  password: string;
}

/**
 * Represents a chat document in the database.
 * - `messages`: the ordered list of messages in the chat
 * - `moveLog`: the ordered list of move log entries for this chat
 * - `createdAt`: when the chat was created
 */
export interface ChatRecord {
  messages: RecordId[]; // References Message models
  moveLog: MoveLogEntry[];
  createdAt: DateISO;
}

/**
 * Represents a game move log entry stored in a chat.
 * - `moveDescription`: human-readable description of the move
 * - `userId`: the user who made the move
 * - `createdAt`: when the move was made
 */
export interface MoveLogEntry {
  moveDescription: string;
  userId: RecordId;
  createdAt: DateISO;
}

/**
 * Represents a comment in the database.
 * - `text`: comment contents
 * - `createdBy`: username of the commenter
 * - `createdAt`: when the comment was made
 * - `editedAt`: when the comment was last modified
 */
export interface CommentRecord {
  text: string;
  createdBy: RecordId; // References User records
  createdAt: DateISO;
  editedAt?: DateISO;
}

/**
 * Represents a game document in the database.
 * - `type`: picks which game this is
 * - `state`: absent if the game hasn't started, or the id for the game's state
 * - `chat`: id for the game's chat
 * - `players`: active players for the game
 * - `createdAt`: when the game was created
 * - `createdBy`: username of the person who created the game
 */
export interface GameRecord {
  type: GameKey;
  state?: unknown;
  done: boolean;
  chat: RecordId; // References Chat records
  players: RecordId[]; // References User records
  createdAt: DateISO;
  createdBy: RecordId; // References User records
}

/**
 * Represents a message in the database.
 * - `text`: message contents
 * - `createdBy`: username of message sender
 * - `createdAt`: when the message was sent
 */
export interface MessageRecord {
  text: string;
  createdBy: RecordId; // References User records
  createdAt: DateISO;
}

/**
 * Represents a forum post as it's stored in the database.
 * - `title`: post title
 * - `text`: post contents
 * - `createdAt`: when the thread was posted
 * - `createdBy`: username of OP
 * - `comments`: replies to the post
 */
export interface ThreadRecord {
  title: string;
  text: string;
  createdAt: DateISO;
  createdBy: RecordId; // References User records
  comments: RecordId[]; // References Comment records
}

/**
 * Represents a user document in the database.
 * - `username`: the unique username
 * - `display`: A display name
 * - `createdAt`: when this user registered.
 * - `avatar`: URL to the user's profile picture, or undefined for default avatar
 * - `bio`: User's bio text (max 500 characters), or undefined if not set
 * - `profileVisibility`: Profile visibility setting (public or friends-only), defaults to public
 * - `socialTwitter`, `socialInstagram`, `socialDiscord`: optional https URLs for external profiles
 */
export interface UserRecord {
  username: string; // References Auth records
  display: string;
  createdAt: DateISO;
  avatar?: string;
  bio?: string;
  profileVisibility?: "public" | "friends-only";
  socialTwitter?: string;
  socialInstagram?: string;
  socialDiscord?: string;
}

/**
 * Represents one row in the user_stats table, tracking a user's result in a
 * completed game.
 */
export interface UserStatsRecord {
  userId: RecordId; // References User records
  gameId: RecordId; // References Game records
  gameType: GameKey;
  won: boolean;
  playedAt: DateISO;
}

/**
 * Status of a friend request: pending, accepted, or declined.
 */
export type FriendRequestStatus = "pending" | "accepted" | "declined";

/**
 * Represents a friend request in the database.
 * - `fromUserId`: the user who sent the request
 * - `toUserId`: the user who received the request
 * - `status`: current status of the request
 * - `createdAt`: when the request was sent
 */
export interface FriendRequestRecord {
  fromUserId: RecordId;
  toUserId: RecordId;
  status: FriendRequestStatus;
  createdAt: DateISO;
}

/**
 * Records that `blockerUserId` has blocked `blockedUserId`.
 */
export interface BlockRecord {
  blockerUserId: RecordId;
  blockedUserId: RecordId;
  createdAt: DateISO;
}
/**
 * Represents a direct message between two users in the database.
 * - `senderId`: user ID of the sender
 * - `receiverId`: user ID of the receiver
 * - `text`: message contents
 * - `createdAt`: when the message was sent
 */
export interface DirectMessageRecord {
  senderId: RecordId; // References User records
  receiverId: RecordId; // References User records
  text: string;
  createdAt: DateISO;
}

/**
 * Represents a conversation between two users in the database.
 * - `user1Id`: ID of the first user
 * - `user2Id`: ID of the second user
 * - `messages`: ordered list of message IDs in this conversation
 * - `updatedAt`: when the conversation was last updated
 */
export interface ConversationRecord {
  user1Id: RecordId; // References User records
  user2Id: RecordId; // References User records
  messages: RecordId[]; // References DirectMessage records
  updatedAt: DateISO;
}
