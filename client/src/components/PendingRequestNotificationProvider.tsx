import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FriendRequestInfo } from "@gamenite/shared";
import useLoginContext from "../hooks/useLoginContext.ts";
import { getPendingFriendRequests } from "../services/friendService.ts";
import { PendingRequestNotificationContext } from "../contexts/PendingRequestNotificationContext.tsx";

interface PendingRequestNotificationProviderProps {
  children: ReactNode;
}

/**
 * Tracks unread pending friend requests globally for the logged-in user.
 */
export default function PendingRequestNotificationProvider({
  children,
}: PendingRequestNotificationProviderProps) {
  const { user, pass, socket } = useLoginContext();
  const [unreadRequestIds, setUnreadRequestIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancel = false;
    getPendingFriendRequests({ username: user.username, password: pass }).then((response) => {
      if (cancel || "error" in response) return;
      setUnreadRequestIds(new Set(response.map((r) => r.requestId)));
    });

    return () => {
      cancel = true;
    };
  }, [user.username, pass]);

  useEffect(() => {
    const handleReceived = (payload: FriendRequestInfo) => {
      if (payload.toUser.username !== user.username) return;
      setUnreadRequestIds((prev) => new Set(prev).add(payload.requestId));
    };

    const removeUnread = (requestId: string) => {
      setUnreadRequestIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    };

    const handleCancelled = (payload: {
      requestId: string;
      fromUsername: string;
      toUsername: string;
    }) => {
      if (payload.toUsername !== user.username) return;
      removeUnread(payload.requestId);
    };

    const handleAccepted = (payload: FriendRequestInfo) => {
      if (payload.toUser.username !== user.username) return;
      removeUnread(payload.requestId);
    };

    const handleDeclined = (payload: {
      requestId: string;
      fromUsername: string;
      toUsername: string;
    }) => {
      if (payload.toUsername !== user.username) return;
      removeUnread(payload.requestId);
    };

    socket.on("friendRequestReceived", handleReceived);
    socket.on("friendRequestCancelled", handleCancelled);
    socket.on("friendRequestAccepted", handleAccepted);
    socket.on("friendRequestDeclined", handleDeclined);

    return () => {
      socket.off("friendRequestReceived", handleReceived);
      socket.off("friendRequestCancelled", handleCancelled);
      socket.off("friendRequestAccepted", handleAccepted);
      socket.off("friendRequestDeclined", handleDeclined);
    };
  }, [user.username, socket]);

  const markAllRead = useCallback(() => {
    setUnreadRequestIds(new Set());
  }, []);

  const markAsRead = useCallback((requestId: string) => {
    setUnreadRequestIds((prev) => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      unreadCount: unreadRequestIds.size,
      markAllRead,
      markAsRead,
    }),
    [unreadRequestIds, markAllRead, markAsRead],
  );

  return (
    <PendingRequestNotificationContext.Provider value={value}>
      {children}
    </PendingRequestNotificationContext.Provider>
  );
}
