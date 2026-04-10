import { createContext } from "react";

export interface DirectMessageNotificationContextType {
  unreadCount: number;
  markAllRead: () => void;
}

export const DirectMessageNotificationContext =
  createContext<DirectMessageNotificationContextType | null>(null);
