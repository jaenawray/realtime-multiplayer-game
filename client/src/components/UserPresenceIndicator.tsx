import type { SafeUserInfo } from "../../../shared/src/user.types.ts";
import { useEffect, useState } from "react";
import useLoginContext from "../hooks/useLoginContext.ts";

interface UserPresenceIndicatorProps {
  user: SafeUserInfo;
  /** Small dot only, no Online/Offline label */
  compact?: boolean;
}

/** Shows if a user is online or offline; updates when the server or the socket
 * says they connect or leave. */
export default function UserPresenceIndicator({
  user,
  compact = false,
}: UserPresenceIndicatorProps) {
  const { socket } = useLoginContext();

  const [online, setOnline] = useState(() => user.isOnline ?? false);

  const [serverPresence, setServerPresence] = useState(() => ({
    username: user.username,
    isOnline: user.isOnline,
  }));

  if (user.username !== serverPresence.username || user.isOnline !== serverPresence.isOnline) {
    setServerPresence({ username: user.username, isOnline: user.isOnline });
    setOnline(user.isOnline ?? false);
  }

  // Stay in sync when someone connects or disconnects anywhere in the application
  useEffect(() => {
    const handler = (payload: { username: string; isOnline: boolean }) => {
      if (payload.username === user.username) setOnline(payload.isOnline);
    };
    socket.on("userPresenceChanged", handler);
    return () => {
      socket.off("userPresenceChanged", handler);
    };
  }, [socket, user.username]);

  const label = online ? "Online" : "Offline";
  const dotColor = online ? "#2e7d32" : "#9e9e9e";

  if (compact) {
    return (
      <span
        title={label}
        aria-label={label}
        style={{
          display: "inline-block",
          width: "0.5rem",
          height: "0.5rem",
          borderRadius: "50%",
          backgroundColor: dotColor,
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }} title={label}>
      <span
        aria-hidden
        style={{
          width: "0.55rem",
          height: "0.55rem",
          borderRadius: "50%",
          backgroundColor: dotColor,
        }}
      />
      <span className="smallAndGray" style={{ color: online ? "#2e7d32" : "#757575" }}>
        {label}
      </span>
    </span>
  );
}
