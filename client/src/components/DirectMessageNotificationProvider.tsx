import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import useLoginContext from "../hooks/useLoginContext.ts";
import { DirectMessageNotificationContext } from "../contexts/DirectMessageNotificationContext.tsx";

interface DirectMessageNotificationProviderProps {
  children: ReactNode;
}

/**
 * Tracks unread direct messages globally for the logged-in user.
 */
export default function DirectMessageNotificationProvider({
  children,
}: DirectMessageNotificationProviderProps) {
  const { user, socket } = useLoginContext();
  const [unreadMessageIds, setUnreadMessageIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleDirectMessageReceived = (payload: {
      message: { messageId: string; senderUsername: string };
    }) => {
      if (payload.message.senderUsername === user.username) return;
      setUnreadMessageIds((prev) => new Set(prev).add(payload.message.messageId));
    };

    socket.on("directMessageReceived", handleDirectMessageReceived);
    return () => {
      socket.off("directMessageReceived", handleDirectMessageReceived);
    };
  }, [socket, user.username]);

  const markAllRead = useCallback(() => {
    setUnreadMessageIds(new Set());
  }, []);

  const value = useMemo(
    () => ({
      unreadCount: unreadMessageIds.size,
      markAllRead,
    }),
    [unreadMessageIds, markAllRead],
  );

  return (
    <DirectMessageNotificationContext.Provider value={value}>
      {children}
    </DirectMessageNotificationContext.Provider>
  );
}
