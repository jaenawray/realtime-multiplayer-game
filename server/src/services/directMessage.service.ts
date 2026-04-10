import type { ConversationInfo, ConversationThreadInfo, DirectMessageInfo } from "@gamenite/shared";
import { ConversationRepo, DirectMessageRepo } from "../repository.ts";
import { getUserByUsername } from "./auth.service.ts";
import { getFriendStatus } from "./friend.service.ts";
import { populateSafeUserInfo } from "./user.service.ts";

/**
 * Get or create a conversation ID for two users.
 * The conversation ID is deterministic: always use the smaller userID first.
 *
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @returns The conversation ID
 */
function getConversationId(userId1: string, userId2: string): string {
  const [id1, id2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  return `conv_${id1}_${id2}`;
}

/**
 * Validates that two users can exchange direct messages.
 */
async function assertCanMessageEachOther(
  senderUsername: string,
  recipientUsername: string,
): Promise<{ senderId: string; recipientId: string } | { error: string }> {
  if (senderUsername === recipientUsername) {
    return { error: "You cannot message yourself" };
  }

  const sender = await getUserByUsername(senderUsername);
  const recipient = await getUserByUsername(recipientUsername);
  if (!sender || !recipient) {
    return { error: "User not found" };
  }

  const friendStatus = await getFriendStatus(senderUsername, recipientUsername);
  if ("error" in friendStatus) {
    return friendStatus;
  }

  if (friendStatus.status === "blocked_by_them") {
    return { error: `${recipientUsername} has blocked you, unable to send message` };
  }

  if (friendStatus.status === "blocked_by_you") {
    return { error: `You have blocked ${recipientUsername}, unable to send message` };
  }

  if (friendStatus.status !== "friends") {
    return { error: "You can only message friends" };
  }

  return { senderId: sender.userId, recipientId: recipient.userId };
}

/**
 * Expand a stored direct message to include sender info
 *
 * @param messageId - Valid direct message ID
 * @returns The expanded direct message info object
 */
async function populateDirectMessageInfo(messageId: string): Promise<DirectMessageInfo> {
  const message = await DirectMessageRepo.get(messageId);
  const sender = await populateSafeUserInfo(message.senderId);
  return {
    messageId,
    text: message.text,
    senderId: message.senderId,
    senderUsername: sender.username,
    receiverId: message.receiverId,
    createdAt: new Date(message.createdAt),
  };
}

/**
 * Send a direct message between two users.
 * Validates that:
 * 1. Both users exist
 * 2. The users are friends
 * 3. Neither user has blocked the other
 *
 * @param senderUsername - Username of the sending user
 * @param recipientUsername - Username of the receiving user
 * @param text - Message text
 * @returns The created direct message info, or an error message
 */
export async function sendDirectMessage(
  senderUsername: string,
  recipientUsername: string,
  text: string,
): Promise<DirectMessageInfo | { error: string }> {
  const normalized = text.trim();
  if (!normalized) {
    return { error: "Message text cannot be empty" };
  }

  const canMessage = await assertCanMessageEachOther(senderUsername, recipientUsername);
  if ("error" in canMessage) {
    return canMessage;
  }

  // Create and store the message
  const messageId = await DirectMessageRepo.add({
    senderId: canMessage.senderId,
    receiverId: canMessage.recipientId,
    text: normalized,
    createdAt: new Date().toISOString(),
  });

  // Get or create conversation
  const conversationId = getConversationId(canMessage.senderId, canMessage.recipientId);
  const conversation = await ConversationRepo.find(conversationId);

  if (conversation) {
    // Update existing conversation
    await ConversationRepo.set(conversationId, {
      ...conversation,
      messages: [...conversation.messages, messageId],
      updatedAt: new Date().toISOString(),
    });
  } else {
    // Create new conversation
    const [user1Id, user2Id] =
      canMessage.senderId < canMessage.recipientId
        ? [canMessage.senderId, canMessage.recipientId]
        : [canMessage.recipientId, canMessage.senderId];
    await ConversationRepo.set(conversationId, {
      user1Id,
      user2Id,
      messages: [messageId],
      updatedAt: new Date().toISOString(),
    });
  }

  return populateDirectMessageInfo(messageId);
}

/**
 * Get a single conversation between two users.
 * Validates that the requesting user is one of the conversation participants.
 *
 * @param requesterUsername - Username of the user requesting the conversation
 * @param otherUsername - Username of the other participant
 * @returns The conversation info, or an error message
 */
export async function getConversation(
  requesterUsername: string,
  otherUsername: string,
): Promise<ConversationThreadInfo | { error: string }> {
  const canMessage = await assertCanMessageEachOther(requesterUsername, otherUsername);
  if ("error" in canMessage) {
    return canMessage;
  }

  const conversationId = getConversationId(canMessage.senderId, canMessage.recipientId);
  const conversation = await ConversationRepo.find(conversationId);

  if (!conversation) {
    const otherUser = await getUserByUsername(otherUsername);
    if (!otherUser) {
      return { error: "User not found" };
    }
    return {
      conversationId,
      otherUser: await populateSafeUserInfo(otherUser.userId),
      messages: [],
      updatedAt: new Date(0),
    };
  }

  // Get all messages in the conversation
  const messages = await Promise.all(conversation.messages.map(populateDirectMessageInfo));
  const otherUserId =
    conversation.user1Id === canMessage.senderId ? conversation.user2Id : conversation.user1Id;

  return {
    conversationId,
    otherUser: await populateSafeUserInfo(otherUserId),
    messages,
    updatedAt: new Date(conversation.updatedAt),
  };
}

/**
 * Get all conversations for a user.
 * Only returns conversations with friends (validates friend status and blocks).
 *
 * @param username - Username of the user
 * @returns Array of conversation info objects, sorted by most recent first
 */
export async function getConversations(username: string): Promise<ConversationInfo[]> {
  const user = await getUserByUsername(username);
  if (!user) return [];

  const allKeys = await ConversationRepo.getAllKeys();
  const results: ConversationInfo[] = [];

  for (const key of allKeys) {
    const conversation = await ConversationRepo.get(key);

    // Check if this user is a participant
    if (conversation.user1Id !== user.userId && conversation.user2Id !== user.userId) {
      continue;
    }

    // Determine the other participant
    const otherUserId =
      conversation.user1Id === user.userId ? conversation.user2Id : conversation.user1Id;

    // Get the other user's info
    const otherUserInfo = await populateSafeUserInfo(otherUserId);

    // Verify they are still friends and not blocked
    const friendStatus = await getFriendStatus(username, otherUserInfo.username);
    if ("error" in friendStatus || friendStatus.status !== "friends") {
      continue;
    }

    // Get user info for both participants
    const user1Info = await populateSafeUserInfo(conversation.user1Id);
    const user2Info = await populateSafeUserInfo(conversation.user2Id);

    // Get all messages
    const messages = await Promise.all(conversation.messages.map(populateDirectMessageInfo));

    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    results.push({
      conversationId: key,
      user1Id: conversation.user1Id,
      user1Username: user1Info.username,
      user2Id: conversation.user2Id,
      user2Username: user2Info.username,
      lastMessage,
      updatedAt: new Date(conversation.updatedAt),
    });
  }

  // Sort by most recent first
  return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}
