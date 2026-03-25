import { useContext } from "react";
import { PendingRequestNotificationContext } from "../contexts/PendingRequestNotificationContext.tsx";

export default function usePendingRequestNotification() {
  const context = useContext(PendingRequestNotificationContext);
  if (!context) {
    throw new Error("Pending request notification context is null.");
  }

  return context;
}
