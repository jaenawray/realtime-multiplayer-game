import "./NotificationBadge.css";

interface NotificationBadgeProps {
  count: number;
}

export default function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count <= 0) return null;

  return <span className="notificationBadge">{count > 99 ? "99+" : count}</span>;
}
