import type { SafeUserInfo } from "@gamenite/shared";
import type { FriendRequestInfo } from "../../../shared/src/friend.types.ts";
import { useCallback, useEffect, useState } from "react";
import useLoginContext from "../hooks/useLoginContext";
import useTimeSince from "../hooks/useTimeSince";
import useEditProfileForm from "../hooks/useEditProfileForm";
import FriendsList from "../components/FriendsList";
import AvatarGallery from "../components/AvatarGallery";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getBlockedUsersList,
  getOutgoingPendingFriendRequests,
  getPendingFriendRequests,
  unblockUser,
} from "../services/friendService";
import usePendingRequestNotification from "../hooks/usePendingRequestNotification.ts";
import UserLink from "../components/UserLink.tsx";
import UserPresenceIndicator from "../components/UserPresenceIndicator.tsx";

/**
 * User's own profile page: edit display name, password, and manage friend requests.
 * Displays pending incoming requests with Accept (green) and Decline (red) buttons.
 */
export default function UpdateProfile() {
  const { user, pass, socket } = useLoginContext();
  const { markAllRead } = usePendingRequestNotification();
  const timeSince = useTimeSince();
  const [showPass, setShowPass] = useState(false);
  const {
    display,
    setDisplay,
    password,
    setPassword,
    confirm,
    setConfirm,
    avatar,
    setAvatar,
    bio,
    setBio,
    bioMaxLength,
    err,
    handleSubmit,
  } = useEditProfileForm();

  const [pendingRequests, setPendingRequests] = useState<FriendRequestInfo[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestInfo[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [outgoingRequestsLoading, setOutgoingRequestsLoading] = useState(true);
  const [requestActionError, setRequestActionError] = useState<string | null>(null);
  const fetchOutgoingPendingRequests = getOutgoingPendingFriendRequests as (auth: {
    username: string;
    password: string;
  }) => Promise<FriendRequestInfo[] | { error: string }>;

  const [blockedUsers, setBlockedUsers] = useState<SafeUserInfo[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [blockedListError, setBlockedListError] = useState<string | null>(null);

  // Refetch blocked-user list
  const refreshBlockedUsers = useCallback(async () => {
    const response = await getBlockedUsersList({ username: user.username, password: pass });
    if ("error" in response) {
      setBlockedListError(response.error);
    } else {
      setBlockedListError(null);
      setBlockedUsers(response);
    }
  }, [user.username, pass]);

  // Initial load of who you have blocked (only runs on this profile page for the logged-in user)
  useEffect(() => {
    let cancel = false;
    queueMicrotask(() => setBlockedLoading(true));
    getBlockedUsersList({ username: user.username, password: pass })
      .then((response) => {
        if (cancel) return;
        setBlockedLoading(false);
        if ("error" in response) {
          setBlockedListError(response.error);
        } else {
          setBlockedListError(null);
          setBlockedUsers(response);
        }
      })
      .catch((err) => {
        if (cancel) return;
        setBlockedLoading(false);
        setBlockedListError(`${err}`);
      });
    return () => {
      cancel = true;
    };
  }, [user.username, pass]);

  useEffect(() => {
    let cancel = false;
    queueMicrotask(() => setRequestsLoading(true));

    getPendingFriendRequests({ username: user.username, password: pass })
      .then((response) => {
        if (cancel) return;
        setRequestsLoading(false);
        if ("error" in response) {
          setRequestActionError(response.error);
        } else {
          setPendingRequests(response);
        }
      })
      .catch((err) => {
        if (cancel) return;
        setRequestsLoading(false);
        setRequestActionError(`${err}`);
      });

    return () => {
      cancel = true;
    };
  }, [user.username, pass]);

  useEffect(() => {
    let cancel = false;
    queueMicrotask(() => setOutgoingRequestsLoading(true));

    fetchOutgoingPendingRequests({ username: user.username, password: pass })
      .then((response) => {
        if (cancel) return;
        setOutgoingRequestsLoading(false);
        if ("error" in response) {
          setRequestActionError(response.error);
        } else {
          setOutgoingRequests(response);
        }
      })
      .catch((err) => {
        if (cancel) return;
        setOutgoingRequestsLoading(false);
        setRequestActionError(`${err}`);
      });

    return () => {
      cancel = true;
    };
  }, [user.username, pass, fetchOutgoingPendingRequests]);

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  // Real-time pending request updates
  useEffect(() => {
    const handleReceived = (payload: FriendRequestInfo) => {
      if (payload.toUser.username === user.username) {
        setPendingRequests((prev) => [payload, ...prev]);
      }
      if (payload.fromUser.username === user.username) {
        setOutgoingRequests((prev) => [payload, ...prev]);
      }
    };

    const handleCancelled = (payload: {
      requestId: string;
      fromUsername: string;
      toUsername: string;
    }) => {
      if (payload.toUsername === user.username) {
        setPendingRequests((prev) => prev.filter((r) => r.requestId !== payload.requestId));
      }
      if (payload.fromUsername === user.username) {
        setOutgoingRequests((prev) => prev.filter((r) => r.requestId !== payload.requestId));
      }
    };

    const handleAccepted = (payload: FriendRequestInfo) => {
      if (payload.toUser.username === user.username) {
        setPendingRequests((prev) => prev.filter((r) => r.requestId !== payload.requestId));
      }
      if (payload.fromUser.username === user.username) {
        setOutgoingRequests((prev) => prev.filter((r) => r.requestId !== payload.requestId));
      }
    };

    const handleDeclined = (payload: {
      requestId: string;
      fromUsername: string;
      toUsername: string;
    }) => {
      if (payload.toUsername === user.username) {
        setPendingRequests((prev) => prev.filter((r) => r.requestId !== payload.requestId));
      }
      if (payload.fromUsername === user.username) {
        setOutgoingRequests((prev) => prev.filter((r) => r.requestId !== payload.requestId));
      }
    };

    socket.on("friendRequestReceived", handleReceived);
    socket.on("friendRequestCancelled", handleCancelled);
    socket.on("friendRequestAccepted", handleAccepted);
    socket.on("friendRequestDeclined", handleDeclined);

    const handleUserBlocked = (payload: { blockerUsername: string; blockedUsername: string }) => {
      if (payload.blockerUsername === user.username) void refreshBlockedUsers();
    };
    const handleUserUnblocked = (payload: { blockerUsername: string; blockedUsername: string }) => {
      if (payload.blockerUsername === user.username) void refreshBlockedUsers();
    };
    socket.on("userBlocked", handleUserBlocked);
    socket.on("userUnblocked", handleUserUnblocked);

    return () => {
      socket.off("friendRequestReceived", handleReceived);
      socket.off("friendRequestCancelled", handleCancelled);
      socket.off("friendRequestAccepted", handleAccepted);
      socket.off("friendRequestDeclined", handleDeclined);
      socket.off("userBlocked", handleUserBlocked);
      socket.off("userUnblocked", handleUserUnblocked);
    };
  }, [user.username, socket, refreshBlockedUsers]);

  const staleRequestErrors = [
    "This request has already been responded to",
    "Friend request not found",
  ];

  async function handleAccept(requestId: string) {
    setRequestActionError(null);
    const response = (await acceptFriendRequest(
      { username: user.username, password: pass },
      requestId,
    )) as FriendRequestInfo | { error: string };
    if ("error" in response) {
      if (staleRequestErrors.includes(response.error)) {
        setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
        setRequestActionError("This request is no longer available (it may have been cancelled).");
      } else {
        setRequestActionError(response.error);
      }
    } else {
      setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    }
  }

  async function handleDecline(requestId: string) {
    setRequestActionError(null);
    const response = (await declineFriendRequest(
      { username: user.username, password: pass },
      requestId,
    )) as { success: true } | { error: string };
    if ("error" in response) {
      if (staleRequestErrors.includes(response.error)) {
        setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
        setRequestActionError("This request is no longer available (it may have been cancelled).");
      } else {
        setRequestActionError(response.error);
      }
    } else {
      setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    }
  }

  async function handleUnblockFromList(targetUsername: string) {
    setBlockedListError(null);
    const response = await unblockUser({ username: user.username, password: pass }, targetUsername);
    if ("error" in response) {
      setBlockedListError(response.error);
    } else {
      setBlockedUsers((prev) => prev.filter((u) => u.username !== targetUsername));
    }
  }

  async function handleCancelOutgoing(requestId: string) {
    setRequestActionError(null);
    const response = (await cancelFriendRequest(
      { username: user.username, password: pass },
      requestId,
    )) as { success: true } | { error: string };

    if ("error" in response) {
      if (staleRequestErrors.includes(response.error)) {
        setOutgoingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
        setRequestActionError("This request is no longer available.");
      } else {
        setRequestActionError(response.error);
      }
    } else {
      setOutgoingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    }
  }

  return (
    <form className="content spacedSection" onSubmit={handleSubmit}>
      <h2>Profile</h2>
      <div>
        <h3>General information</h3>
        <ul>
          <li>Username: {user.username}</li>
          <li>Account created {timeSince(user.createdAt)}</li>
        </ul>
      </div>
      <hr />
      <div className="spacedSection">
        <h3>Display name</h3>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
          <input
            className="widefill notTooWide"
            value={display}
            onChange={(e) => setDisplay(e.target.value)}
          />
          <button
            className="secondary narrow"
            onClick={(e) => {
              e.preventDefault(); // Don't submit form
              setDisplay(user.display);
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <hr />
      <div className="spacedSection">
        <h3>Bio</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <textarea
            className="widefill notTooWide"
            placeholder="Tell us about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={bioMaxLength}
            rows={4}
            style={{ resize: "vertical" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              className="smallAndGray"
              style={{ color: bio.length > bioMaxLength ? "#f00" : undefined }}
            >
              {bio.length}/{bioMaxLength} characters
            </span>
            <button
              className="secondary narrow"
              onClick={(e) => {
                e.preventDefault(); // Don't submit form
                setBio(user.bio ?? "");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      <hr />
      <div className="spacedSection">
        <h3>Profile picture</h3>
        <AvatarGallery onSelect={setAvatar} selectedAvatar={avatar ?? undefined} />
      </div>
      <hr />
      <div className="spacedSection">
        <h3>Reset password</h3>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
          <input
            type={showPass ? "input" : "password"}
            className="widefill notTooWide"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="secondary narrow"
            onClick={(e) => {
              e.preventDefault(); // Don't submit form
              setPassword("");
              setConfirm("");
            }}
          >
            Reset
          </button>
          <button
            className="secondary narrow"
            aria-label="Toggle show password"
            onClick={(e) => {
              e.preventDefault(); // Don't submit form
              setShowPass((v) => !v);
            }}
          >
            {showPass ? "Hide" : "Reveal"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem" }}>
          <input
            type={showPass ? "input" : "password"}
            className="widefill notTooWide"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>
      <hr />
      <div className="spacedSection">
        <FriendsList auth={{ username: user.username, password: pass }} canModify={true} />
      </div>
      <hr />
      <div className="spacedSection">
        <h3>Blocked users</h3>
        <p className="smallAndGray" style={{ marginTop: 0 }}>
          Only you can see this list. These people cannot friend or message you in games until you
          unblock them.
        </p>
        {blockedListError && (
          <p className="error-message" style={{ color: "#f00" }}>
            {blockedListError}
          </p>
        )}
        {blockedLoading && <p>Loading...</p>}
        {!blockedLoading && blockedUsers.length === 0 && (
          <p className="smallAndGray">You have not blocked anyone.</p>
        )}
        {!blockedLoading && blockedUsers.length > 0 && (
          <ul>
            {blockedUsers.map((bu) => (
              <li
                key={bu.username}
                style={{
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <UserLink user={bu} />
                <span className="smallAndGray">({bu.username})</span>
                <UserPresenceIndicator user={bu} />
                <button
                  type="button"
                  className="primary narrow friendStatusBlue"
                  onClick={() => void handleUnblockFromList(bu.username)}
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <hr />
      <div className="spacedSection">
        <h3>Pending friend requests</h3>
        {requestActionError && (
          <p className="error-message" style={{ color: "#f00" }}>
            {requestActionError}
          </p>
        )}
        {requestsLoading && <p>Loading...</p>}
        {!requestsLoading && pendingRequests.length === 0 && (
          <p className="smallAndGray">No pending friend requests</p>
        )}
        {!requestsLoading && pendingRequests.length > 0 && (
          <ul>
            {pendingRequests.map((req) => (
              <li
                key={req.requestId}
                style={{
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <strong>{req.fromUser.display}</strong>
                <span className="smallAndGray">({req.fromUser.username})</span>
                <UserPresenceIndicator user={req.fromUser} />
                <button className="accept narrow" onClick={() => handleAccept(req.requestId)}>
                  Accept
                </button>
                <button className="decline narrow" onClick={() => handleDecline(req.requestId)}>
                  Decline
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <hr />
      <div className="spacedSection">
        <h3>Outgoing friend requests</h3>
        {outgoingRequestsLoading && <p>Loading...</p>}
        {!outgoingRequestsLoading && outgoingRequests.length === 0 && (
          <p className="smallAndGray">No outgoing pending requests</p>
        )}
        {!outgoingRequestsLoading && outgoingRequests.length > 0 && (
          <ul>
            {outgoingRequests.map((req) => (
              <li
                key={req.requestId}
                style={{
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <strong>{req.toUser.display}</strong>
                <span className="smallAndGray">({req.toUser.username})</span>
                <UserPresenceIndicator user={req.toUser} />
                <button
                  className="decline narrow"
                  onClick={() => handleCancelOutgoing(req.requestId)}
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <hr />
      {err && <p className="error-message">{err}</p>}
      <div>
        <button className="primary narrow">Submit</button>
      </div>
      <div className="smallAndGray">After updating your profile, you will be logged out</div>
    </form>
  );
}
