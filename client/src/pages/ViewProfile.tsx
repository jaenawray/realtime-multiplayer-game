import type { SafeUserInfo } from "@gamenite/shared";
import { useEffect, useState } from "react";
import useTimeSince from "../hooks/useTimeSince";
import { getUserById } from "../services/userService";
import ProfilePictureDisplay from "../components/ProfilePictureDisplay";

interface ViewProfileProps {
  username: string;
}
export default function ViewProfile({ username }: ViewProfileProps) {
  const [componentState, setComponentState] = useState<
    { type: "waiting" } | { type: "error"; msg: string } | { type: "profile"; user: SafeUserInfo }
  >({ type: "waiting" });
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

  switch (componentState.type) {
    case "error":
      return <div style={{ color: "#f00" }}>{componentState.msg}</div>;
    case "waiting":
      return <div>Loading...</div>;
    case "profile": {
      const user = componentState.user;
      return (
        <>
          <h2>Profile for {user.display}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <ProfilePictureDisplay
              avatarUrl={user.avatar}
              displayName={user.display}
              size="medium"
            />
            <div>
              <ul>
                <li>Username: {user.username}</li>
                <li>Account created {timeSince(user.createdAt)}</li>
              </ul>
              {user.bio && (
                <div style={{ marginTop: "0.5rem" }}>
                  <strong>Bio</strong>
                  <p style={{ whiteSpace: "pre-wrap", margin: "0.25rem 0 0 0" }}>{user.bio}</p>
                </div>
              )}
            </div>
          </div>
        </>
      );
    }
  }
}
