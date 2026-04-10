import { useContext } from "react";
import { DirectMessageNotificationContext } from "../contexts/DirectMessageNotificationContext.tsx";

export default function useDirectMessageNotification() {
  const context = useContext(DirectMessageNotificationContext);
  if (!context) {
    throw new Error("Direct message notification context is null.");
  }

  return context;
}
