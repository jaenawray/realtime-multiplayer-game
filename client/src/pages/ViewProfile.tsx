import type { SafeUserInfo } from "../../../shared/src/user.types.ts";
import type { FriendRequestInfo } from "../../../shared/src/friend.types.ts";
import { useEffect, useState } from "react";
import useLoginContext from "../hooks/useLoginContext";
import useTimeSince from "../hooks/useTimeSince";
import {
  blockUser,
  cancelFriendRequest,
  getFriendStatus,
  sendFriendRequest,
  unblockUser,
} from "../services/friendService";
import { getUserById } from "../services/userService";
import ProfilePictureDisplay from "../components/ProfilePictureDisplay";
import UserPresenceIndicator from "../components/UserPresenceIndicator.tsx";
import UserStatsPanel from "../components/UserStatsPanel";
import UserGameHistoryPanel from "../components/UserGameHistoryPanel";

interface ViewProfileProps {
  username: string;
}

/**
 * Displays another user's profile with friend request actions.
 * Shows Send Friend Request (blue), pending status (grey), or You are friends (green)
 * based on the relationship between the viewer and profile user.
 */
export default function ViewProfile({ username }: ViewProfileProps) {
  const { user, pass, socket } = useLoginContext();
  const [componentState, setComponentState] = useState<
    { type: "waiting" } | { type: "error"; msg: string } | { type: "profile"; user: SafeUserInfo }
  >({ type: "waiting" });
  const [friendStatus, setFriendStatus] = useState<
    | { type: "loading" }
    | { type: "none" }
    | { type: "pending_outgoing"; requestId: string }
    | { type: "pending_incoming" }
    | { type: "friends" }
    | { type: "blocked_by_them" }
    | { type: "blocked_by_you" }
    | { type: "error"; msg: string }
  >({ type: "loading" });
  const [friendActionError, setFriendActionError] = useState<string | null>(null);
  const timeSince = useTimeSince();

  useEffect(() => {
    let cancel = false;

    getUserById(username)
      .then((response) => {
        if (cancel) return;
        if ("error" in response) {
          setComponentState({ type: "error", msg: response.error });
        } else {
          setComponentState({ type: "profile", user: response });
        }
      })
      .catch((err) => {
        if (cancel) return;
        setComponentState({ type: "error", msg: `${err}` });
      });

    return () => {
      cancel = true;
    };
  }, [username]);

  useEffect(() => {
    if (componentState.type !== "profile") return;
    let cancel = false;
    // Show loading state after this effect runs (avoids linter warning)
    queueMicrotask(() => setFriendStatus({ type: "loading" }));

    getFriendStatus({ username: user.username, password: pass }, username)
      .then((response) => {
        if (cancel) return;
        if ("error" in response) {
          setFriendStatus({ type: "error", msg: response.error });
        } else if (response.status === "pending_outgoing") {
          setFriendStatus({ type: "pending_outgoing", requestId: response.requestId });
        } else {
          setFriendStatus({ type: response.status });
        }
      })
      .catch((err) => {
        if (cancel) return;
        setFriendStatus({ type: "error", msg: `${err}` });
      });

    return () => {
      cancel = true;
    };
  }, [componentState.type, username, user.username, pass]);

  // Real-time friend status updates
  useEffect(() => {
    if (componentState.type !== "profile") return;

    const handleReceived = (payload: FriendRequestInfo) => {
      if (payload.fromUser.username === username && payload.toUser.username === user.username) {
        setFriendStatus({ type: "pending_incoming" });
      }
    };

    const handleCancelled = (payload: {
      requestId: string;
      fromUsername: string;
      toUsername: string;
    }) => {
      if (payload.fromUsername === username && payload.toUsername === user.username) {
        setFriendStatus({ type: "none" });
      }
    };

    const handleAccepted = (payload: FriendRequestInfo) => {
      const bothInvolved =
        (payload.fromUser.username === user.username && payload.toUser.username === username) ||
        (payload.toUser.username === user.username && payload.fromUser.username === username);
      if (bothInvolved) setFriendStatus({ type: "friends" });
    };

    const handleDeclined = (payload: {
      requestId: string;
      fromUsername: string;
      toUsername: string;
    }) => {
      if (payload.fromUsername === user.username && payload.toUsername === username) {
        setFriendStatus({ type: "none" });
      }
    };

    const handleRemoved = (payload: { username: string; friendUsername: string }) => {
      const bothInvolved =
        (payload.username === user.username && payload.friendUsername === username) ||
        (payload.username === username && payload.friendUsername === user.username);
      if (bothInvolved) setFriendStatus({ type: "none" });
    };

    socket.on("friendRequestReceived", handleReceived);
    socket.on("friendRequestCancelled", handleCancelled);
    socket.on("friendRequestAccepted", handleAccepted);
    socket.on("friendRequestDeclined", handleDeclined);
    socket.on("friendRemoved", handleRemoved);

    // Updates the friend status if the user is blocked
    const handleUserBlocked = (payload: { blockerUsername: string; blockedUsername: string }) => {
      const involves =
        (payload.blockerUsername === user.username && payload.blockedUsername === username) ||
        (payload.blockerUsername === username && payload.blockedUsername === user.username);
      if (!involves) return;
      if (payload.blockerUsername === user.username) {
        setFriendStatus({ type: "blocked_by_you" });
      } else {
        setFriendStatus({ type: "blocked_by_them" });
      }
    };

    const handleUserUnblocked = (payload: { blockerUsername: string; blockedUsername: string }) => {
      const involves =
        payload.blockerUsername === user.username && payload.blockedUsername === username;
      if (!involves) return;
      setFriendStatus({ type: "none" });
    };

    socket.on("userBlocked", handleUserBlocked);
    socket.on("userUnblocked", handleUserUnblocked);

    return () => {
      socket.off("friendRequestReceived", handleReceived);
      socket.off("friendRequestCancelled", handleCancelled);
      socket.off("friendRequestAccepted", handleAccepted);
      socket.off("friendRequestDeclined", handleDeclined);
      socket.off("friendRemoved", handleRemoved);
      socket.off("userBlocked", handleUserBlocked);
      socket.off("userUnblocked", handleUserUnblocked);
    };
  }, [componentState.type, username, user.username, socket]);

  /** Sends a friend request to the profile user. */
  async function handleSendFriendRequest() {
    setFriendActionError(null);
    const response = (await sendFriendRequest(
      { username: user.username, password: pass },
      username,
    )) as { requestId: string } | { error: string };
    if ("error" in response) {
      setFriendActionError(response.error);
    } else {
      setFriendStatus({ type: "pending_outgoing", requestId: response.requestId });
    }
  }

  /** Blocks this profile user */
  async function handleBlockUser() {
    setFriendActionError(null);
    const response = await blockUser({ username: user.username, password: pass }, username);
    if ("error" in response) {
      setFriendActionError(response.error);
    } else {
      setFriendStatus({ type: "blocked_by_you" });
    }
  }

  /** Removes your block of this user */
  async function handleUnblockUser() {
    setFriendActionError(null);
    const response = await unblockUser({ username: user.username, password: pass }, username);
    if ("error" in response) {
      setFriendActionError(response.error);
    } else {
      setFriendStatus({ type: "none" });
    }
  }

  /** Cancels an outgoing friend request. */
  async function handleCancelFriendRequest(requestId: string) {
    setFriendActionError(null);
    const response = (await cancelFriendRequest(
      { username: user.username, password: pass },
      requestId,
    )) as { success: true } | { error: string };
    if ("error" in response) {
      setFriendActionError(response.error);
    } else {
      setFriendStatus({ type: "none" });
    }
  }

  switch (componentState.type) {
    case "error":
      return <div style={{ color: "#f00" }}>{componentState.msg}</div>;
    case "waiting":
      return <div>Loading...</div>;
    case "profile": {
      const profileUser = componentState.user;
      // Check if profile is visible: public profiles always visible, friends-only requires being friends
      const isPublic = profileUser.profileVisibility !== "friends-only";
      const isFriend = friendStatus.type === "friends";
      const canViewPrivateInfo = isPublic || isFriend;

      return (
        <div className="content">
          <div className="spacedSection">
            <h2
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              Profile for {profileUser.display}
              <UserPresenceIndicator user={profileUser} />
            </h2>
            <div
              style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}
            >
              {canViewPrivateInfo ? (
                <ProfilePictureDisplay
                  avatarUrl={profileUser.avatar}
                  displayName={profileUser.display}
                  size="medium"
                />
              ) : (
                <ProfilePictureDisplay
                  avatarUrl={undefined}
                  displayName={profileUser.display}
                  size="medium"
                />
              )}
              <div>
                <ul>
                  <li>Username: {profileUser.username}</li>
                  <li>Account created {timeSince(profileUser.createdAt)}</li>
                </ul>
                {canViewPrivateInfo && profileUser.bio && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <strong>Bio</strong>
                    <p style={{ whiteSpace: "pre-wrap", margin: "0.25rem 0 0 0" }}>
                      {profileUser.bio}
                    </p>
                  </div>
                )}
                {!canViewPrivateInfo && (
                  <p className="smallAndGray" style={{ marginTop: "0.5rem", fontStyle: "italic" }}>
                    This profile is set to friends-only. Add them as a friend to see more details.
                  </p>
                )}
                {canViewPrivateInfo && (
                  <div style={{ marginTop: "1rem" }}>
                    <UserStatsPanel username={profileUser.username} />
                    <UserGameHistoryPanel username={profileUser.username} />
                  </div>
                )}
              </div>
            </div>
            {friendActionError && (
              <p className="error-message" style={{ color: "#f00" }}>
                {friendActionError}
              </p>
            )}
            <div>
              {friendStatus.type === "blocked_by_them" && (
                <p className="friendStatusGrey" style={{ margin: "0 0 0.75rem 0" }}>
                  This user has blocked you. You cannot send them a friend request or message them
                  in games.
                </p>
              )}
              {friendStatus.type === "blocked_by_you" && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <p className="friendStatusGrey" style={{ margin: "0 0 0.5rem 0" }}>
                    You have blocked this user.
                  </p>
                  <button
                    type="button"
                    className="primary narrow friendStatusBlue"
                    onClick={handleUnblockUser}
                  >
                    Unblock
                  </button>
                </div>
              )}
              {friendStatus.type === "error" && (
                <p className="error-message" style={{ color: "#f00" }}>
                  {friendStatus.msg}
                </p>
              )}
              {friendStatus.type !== "blocked_by_them" &&
                friendStatus.type !== "blocked_by_you" &&
                friendStatus.type !== "error" && (
                  <>
                    {friendStatus.type === "loading" && (
                      <button className="primary narrow friendStatusGrey" disabled>
                        Loading...
                      </button>
                    )}
                    {friendStatus.type === "none" && (
                      <button
                        className="primary narrow friendStatusBlue"
                        onClick={handleSendFriendRequest}
                      >
                        Send Friend Request
                      </button>
                    )}
                    {friendStatus.type === "pending_outgoing" && (
                      <button
                        className="primary narrow friendStatusGrey"
                        onClick={() => handleCancelFriendRequest(friendStatus.requestId)}
                      >
                        Cancel Request
                      </button>
                    )}
                    {friendStatus.type === "pending_incoming" && (
                      <button className="primary narrow friendStatusGrey" disabled>
                        They sent you a request
                      </button>
                    )}
                    {friendStatus.type === "friends" && (
                      <button className="primary narrow friendStatusGreen" disabled>
                        You are friends
                      </button>
                    )}
                    {(friendStatus.type === "none" ||
                      friendStatus.type === "pending_outgoing" ||
                      friendStatus.type === "pending_incoming" ||
                      friendStatus.type === "friends") && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <button
                          type="button"
                          className="primary narrow"
                          style={{
                            background: "#8b2942",
                            borderColor: "#6e1f33",
                          }}
                          onClick={handleBlockUser}
                        >
                          Block user
                        </button>
                      </div>
                    )}
                  </>
                )}
            </div>
          </div>
        </div>
      );
    }
  }
}
