import type { APIResponse } from "../util/types.ts";
import { api, exceptionToErrorMsg } from "./api.ts";
import type {
  FriendProfileStatus,
  FriendRequestInfo,
  UserAuth,
  SafeUserInfo,
} from "@gamenite/shared";

const USER_API_URL = `/api/user`;

/**
 * Friend relationship status between the current user and another user.
 * - none: no request exists
 * - pending_outgoing: current user sent a request
 * - pending_incoming: other user sent a request
 * - friends: request was accepted
 * - blocked_by_them: the other user has blocked you
 * - blocked_by_you: you have blocked the other user
 */
export type FriendStatus = FriendProfileStatus;

/**
 * Send a friend request to another user.
 */
export const sendFriendRequest = async (
  auth: UserAuth,
  targetUsername: string,
): APIResponse<FriendRequestInfo> => {
  try {
    const res = await api.post<FriendRequestInfo>(`${USER_API_URL}/friend-request`, {
      auth,
      payload: { targetUsername },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Get pending friend requests for the current user.
 */
export const getPendingFriendRequests = async (
  auth: UserAuth,
): APIResponse<FriendRequestInfo[]> => {
  try {
    const res = await api.post<FriendRequestInfo[]>(`${USER_API_URL}/friend-requests`, {
      auth,
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Get outgoing pending friend requests for the current user.
 */
export const getOutgoingPendingFriendRequests = async (
  auth: UserAuth,
): APIResponse<FriendRequestInfo[]> => {
  try {
    const res = await api.post<FriendRequestInfo[]>(`${USER_API_URL}/outgoing-friend-requests`, {
      auth,
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Accept a friend request.
 */
export const acceptFriendRequest = async (
  auth: UserAuth,
  requestId: string,
): APIResponse<FriendRequestInfo> => {
  try {
    const res = await api.post<FriendRequestInfo>(
      `${USER_API_URL}/friend-request/${requestId}/accept`,
      { auth },
    );
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Decline a friend request.
 */
export const declineFriendRequest = async (
  auth: UserAuth,
  requestId: string,
): APIResponse<{ success: true }> => {
  try {
    const res = await api.post<{ success: true }>(
      `${USER_API_URL}/friend-request/${requestId}/decline`,
      { auth },
    );
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Get friend status between current user and another user.
 */
export const getFriendStatus = async (
  auth: UserAuth,
  username: string,
): APIResponse<FriendStatus> => {
  try {
    const res = await api.post<FriendStatus>(`${USER_API_URL}/friend-status`, {
      auth,
      payload: { username },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};
/**
 * Get list of friends for the current user.
 */
export const getFriendsList = async (auth: UserAuth): APIResponse<SafeUserInfo[]> => {
  try {
    const res = await api.post<SafeUserInfo[]>(`${USER_API_URL}/friends-list`, {
      auth,
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Get mutual friends between the current user and another profile user.
 */
export const fetchMutualFriends = async (
  auth: UserAuth,
  username: string,
): APIResponse<SafeUserInfo[]> => {
  try {
    const res = await api.post<SafeUserInfo[]>(`${USER_API_URL}/mutual-friends`, {
      auth,
      payload: { username },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Users you have blocked (only available for your own account)
 */
export const getBlockedUsersList = async (auth: UserAuth): APIResponse<SafeUserInfo[]> => {
  try {
    const res = await api.post<SafeUserInfo[]>(`${USER_API_URL}/blocked-users`, {
      auth,
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Remove a friend.
 */
export const removeFriend = async (
  auth: UserAuth,
  friendUsername: string,
): APIResponse<{ success: true }> => {
  try {
    const res = await api.post<{ success: true }>(`${USER_API_URL}/remove-friend`, {
      auth,
      payload: { friendUsername },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Cancel an outgoing friend request.
 */
export const cancelFriendRequest = async (
  auth: UserAuth,
  requestId: string,
): APIResponse<{ success: true }> => {
  try {
    const res = await api.delete<{ success: true }>(`${USER_API_URL}/friend-request/${requestId}`, {
      data: { auth },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/** Blocks a user */
export const blockUser = async (
  auth: UserAuth,
  targetUsername: string,
): APIResponse<{ success: true }> => {
  try {
    const res = await api.post<{ success: true }>(`${USER_API_URL}/block`, {
      auth,
      payload: { targetUsername },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/** Removes your block of a user */
export const unblockUser = async (
  auth: UserAuth,
  targetUsername: string,
): APIResponse<{ success: true }> => {
  try {
    const res = await api.post<{ success: true }>(`${USER_API_URL}/unblock`, {
      auth,
      payload: { targetUsername },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};
