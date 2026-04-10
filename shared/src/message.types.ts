import { z } from "zod";
import { type SafeUserInfo } from "./user.types.ts";

/**
 * Represents a chat message as exposed to the client
 * - `messageId`: database key
 * - `text`: message contents
 * - `createdBy`: message sender
 * - `createdAt`: when the message was sent
 */
export interface MessageInfo {
  messageId: string;
  text: string;
  createdBy: SafeUserInfo;
  createdAt: Date;
}

/**
 * Represents a direct message between two users
 * - `messageId`: database key
 * - `text`: message contents
 * - `senderId`: user ID of the sender
 * - `senderUsername`: username of the sender
 * - `receiverId`: user ID of the receiver
 * - `createdAt`: when the message was sent
 */
export interface DirectMessageInfo {
  messageId: string;
  text: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  createdAt: Date;
}

/**
 * Represents a conversation between two users
 * - `conversationId`: database key
 * - `user1Id`: ID of the first user
 * - `user1Username`: username of the first user
 * - `user2Id`: ID of the second user
 * - `user2Username`: username of the second user
 * - `lastMessage`: the most recent message in the conversation (or null)
 * - `updatedAt`: when the conversation was last updated
 */
export interface ConversationInfo {
  conversationId: string;
  user1Id: string;
  user1Username: string;
  user2Id: string;
  user2Username: string;
  lastMessage: DirectMessageInfo | null;
  updatedAt: Date;
}

/**
 * Represents the full message thread between two users.
 */
export interface ConversationThreadInfo {
  conversationId: string;
  otherUser: SafeUserInfo;
  messages: DirectMessageInfo[];
  updatedAt: Date;
}

/**
 * Socket payload for a newly received direct message.
 */
export interface DirectMessageReceivedPayload {
  message: DirectMessageInfo;
}

/*** TYPES USED IN THE MESSAGE API ***/

/**
 * Relevant information for creating a new message
 */
export type NewMessagePayload = z.infer<typeof zNewMessageRequest>;
export const zNewMessageRequest = z.object({
  chatId: z.string(),
  text: z.string(),
});

/**
 * Relevant information for sending a direct message
 */
export type SendDirectMessagePayload = z.infer<typeof zSendDirectMessageRequest>;
export const zSendDirectMessageRequest = z.object({
  recipientUsername: z.string(),
  text: z.string(),
});

/**
 * Relevant information for loading a direct-message thread.
 */
export type GetConversationPayload = z.infer<typeof zGetConversationRequest>;
export const zGetConversationRequest = z.object({
  username: z.string(),
});
