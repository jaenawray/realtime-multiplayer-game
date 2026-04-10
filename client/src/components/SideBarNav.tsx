import "./SideBarNav.css";
import { useState } from "react";
import { NavLink, type NavLinkRenderProps } from "react-router-dom";
import useAuth from "../hooks/useAuth.ts";
import usePendingRequestNotification from "../hooks/usePendingRequestNotification.ts";
import useDirectMessageNotification from "../hooks/useDirectMessageNotification.ts";
import NotificationBadge from "./NotificationBadge.tsx";

/**
 * The SideBarNav component contains the primary naviagation menu. It
 * highlights the currently selected page and triggers navigation when the
 * menu items are clicked.
 */
export default function SideBarNav() {
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const { username } = useAuth();
  const { unreadCount: unreadFriendRequestCount, markAllRead: markAllFriendRequestsRead } =
    usePendingRequestNotification();
  const { unreadCount: unreadDirectMessageCount, markAllRead: markAllDirectMessagesRead } =
    useDirectMessageNotification();

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const navClass = ({ isActive }: NavLinkRenderProps) =>
    `menu_button ${isActive ? "menu_selected" : ""}`;

  return (
    <div className="sideBarNav">
      <NavLink to="/" className={navClass}>
        Home
      </NavLink>
      <NavLink to="/games" className={navClass}>
        Games
      </NavLink>
      <NavLink to="/forum" className={navClass}>
        Forum
      </NavLink>
      <NavLink
        to="/messages"
        className={navClass}
        onClick={() => {
          markAllDirectMessagesRead();
        }}
      >
        Messages
        <NotificationBadge count={unreadDirectMessageCount} />
      </NavLink>
      <NavLink
        to={`/profile/${username}`}
        id="menu_user"
        className={navClass}
        onClick={() => {
          toggleOptions();
          markAllFriendRequestsRead();
        }}
      >
        Profile
        <NotificationBadge count={unreadFriendRequestCount} />
      </NavLink>
    </div>
  );
}
