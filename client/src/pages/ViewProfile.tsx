import type { SafeUserInfo } from "../../../shared/src/user.types.ts";
import { useEffect, useState } from "react";
import useLoginContext from "../hooks/useLoginContext";
import useTimeSince from "../hooks/useTimeSince";
import { getFriendStatus, sendFriendRequest } from "../services/friendService";
import { getUserById } from "../services/userService";
import ProfilePictureDisplay from "../components/ProfilePictureDisplay";
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
  const { user, pass } = useLoginContext();
  const [componentState, setComponentState] = useState<
    { type: "waiting" } | { type: "error"; msg: string } | { type: "profile"; user: SafeUserInfo }
  >({ type: "waiting" });
  const [friendStatus, setFriendStatus] = useState<
    | { type: "loading" }
    | { type: "none" }
    | { type: "pending_outgoing" }
    | { type: "pending_incoming" }
    | { type: "friends" }
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
      setFriendStatus({ type: "pending_outgoing" });
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
            <h2>Profile for {profileUser.display}</h2>
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
                <button className="primary narrow friendStatusGrey" disabled>
                  Friend request pending
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
            </div>
          </div>
        </div>
      );
    }
  }
}
