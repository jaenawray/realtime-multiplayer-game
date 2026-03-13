import type { FriendRequestInfo } from "../../../shared/src/friend.types.ts";
import { useEffect, useState } from "react";
import useLoginContext from "../hooks/useLoginContext";
import useTimeSince from "../hooks/useTimeSince";
import useEditProfileForm from "../hooks/useEditProfileForm";
import FriendsList from "../components/FriendsList";
import AvatarGallery from "../components/AvatarGallery";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getPendingFriendRequests,
} from "../services/friendService";

/**
 * User's own profile page: edit display name, password, and manage friend requests.
 * Displays pending incoming requests with Accept (green) and Decline (red) buttons.
 */
export default function UpdateProfile() {
  const { user, pass } = useLoginContext();
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
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestActionError, setRequestActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    // Show loading state after this effect runs (avoids linter warning)
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

  async function handleAccept(requestId: string) {
    setRequestActionError(null);
    const response = (await acceptFriendRequest(
      { username: user.username, password: pass },
      requestId,
    )) as FriendRequestInfo | { error: string };
    if ("error" in response) {
      setRequestActionError(response.error);
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
      setRequestActionError(response.error);
    } else {
      setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
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
              <li key={req.requestId} style={{ marginBottom: "0.5rem" }}>
                <strong>{req.fromUser.display}</strong> ({req.fromUser.username}){" "}
                <button className="accept narrow" onClick={() => handleAccept(req.requestId)}>
                  Accept
                </button>{" "}
                <button className="decline narrow" onClick={() => handleDecline(req.requestId)}>
                  Decline
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
