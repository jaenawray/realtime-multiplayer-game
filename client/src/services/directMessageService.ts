import type { SafeUserInfo, UserAuth } from "@gamenite/shared";
import type { APIResponse } from "../util/types.ts";
import { api, exceptionToErrorMsg } from "./api.ts";
import axios from "axios";

const USER_API_URL = "/api/user";

export interface DirectMessageDTO {
  messageId: string;
  text: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  createdAt: Date | string;
}

export interface ConversationPreviewDTO {
  conversationId: string;
  user1Id: string;
  user1Username: string;
  user2Id: string;
  user2Username: string;
  lastMessage: DirectMessageDTO | null;
  updatedAt: Date | string;
}

export interface ConversationThreadDTO {
  conversationId: string;
  otherUser: SafeUserInfo;
  messages: DirectMessageDTO[];
  updatedAt: Date | string;
}

function toDirectMessageError(error: unknown): { error: string } {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { error?: unknown } | undefined;
    if (payload && typeof payload.error === "string") {
      return { error: payload.error };
    }
  }
  return exceptionToErrorMsg(error);
}

/**
 * Send a direct message to another user.
 */
export async function sendDirectMessage(
  auth: UserAuth,
  recipientUsername: string,
  text: string,
): APIResponse<DirectMessageDTO> {
  try {
    const res = await api.post<DirectMessageDTO>(`${USER_API_URL}/direct-message`, {
      auth,
      payload: { recipientUsername, text },
    });
    return res.data;
  } catch (error) {
    return toDirectMessageError(error);
  }
}

/**
 * Get all conversations for the current user.
 */
export async function getDirectMessageConversations(
  auth: UserAuth,
): APIResponse<ConversationPreviewDTO[]> {
  try {
    const res = await api.post<ConversationPreviewDTO[]>(`${USER_API_URL}/direct-messages`, {
      auth,
    });
    return [...res.data];
  } catch (error) {
    return toDirectMessageError(error);
  }
}

/**
 * Get full direct-message thread with another user.
 */
export async function getDirectMessageThread(
  auth: UserAuth,
  username: string,
): APIResponse<ConversationThreadDTO> {
  try {
    const res = await api.post<ConversationThreadDTO>(`${USER_API_URL}/direct-messages/thread`, {
      auth,
      payload: { username },
    });
    return res.data;
  } catch (error) {
    return toDirectMessageError(error);
  }
}
