import { createContext } from "react";

export interface PendingRequestNotificationContextType {
  unreadCount: number;
  markAllRead: () => void;
  markAsRead: (requestId: string) => void;
}

export const PendingRequestNotificationContext =
  createContext<PendingRequestNotificationContextType | null>(null);
