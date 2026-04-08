import type { SafeUserInfo, UserAuth } from "@gamenite/shared";
import type { FriendRequestInfo } from "../../../shared/src/friend.types.ts";
import { useEffect, useState } from "react";
import useLoginContext from "../hooks/useLoginContext";
import { getFriendsList, removeFriend } from "../services/friendService";
import UserLink from "./UserLink.tsx";
import UserPresenceIndicator from "./UserPresenceIndicator.tsx";

interface FriendsListProps {
  auth: UserAuth;
  canModify?: boolean;
}

export default function FriendsList({ auth, canModify = false }: FriendsListProps) {
  const { socket } = useLoginContext();
  const [friends, setFriends] = useState<SafeUserInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    // Show loading state after this effect runs (avoids linter warning)
    queueMicrotask(() => setLoading(true));

    getFriendsList(auth)
      .then((response) => {
        if (cancel) return;
        setLoading(false);
        if ("error" in response) {
          setError(response.error);
        } else {
          setFriends(response);
        }
      })
      .catch((err) => {
        if (cancel) return;
        setLoading(false);
        setError(`${err}`);
      });

    return () => {
      cancel = true;
    };
  }, [auth]);

  // Real-time friends list updates
  useEffect(() => {
    const handleAccepted = (payload: FriendRequestInfo) => {
      if (payload.fromUser.username === auth.username) {
        setFriends((prev) => [...prev, payload.toUser]);
      } else if (payload.toUser.username === auth.username) {
        setFriends((prev) => [...prev, payload.fromUser]);
      }
    };

    const handleRemoved = (payload: { username: string; friendUsername: string }) => {
      if (payload.username === auth.username) {
        setFriends((prev) => prev.filter((f) => f.username !== payload.friendUsername));
      } else if (payload.friendUsername === auth.username) {
        setFriends((prev) => prev.filter((f) => f.username !== payload.username));
      }
    };

    socket.on("friendRequestAccepted", handleAccepted);
    socket.on("friendRemoved", handleRemoved);

    return () => {
      socket.off("friendRequestAccepted", handleAccepted);
      socket.off("friendRemoved", handleRemoved);
    };
  }, [auth.username, socket]);

  const handleRemoveFriend = async (friendUsername: string) => {
    setError(null);
    const response = await removeFriend(auth, friendUsername);
    if ("error" in response) {
      setError(response.error);
    } else {
      // Remove friend from list
      setFriends((prev) => prev.filter((f) => f.username !== friendUsername));
    }
  };

  // Filter user's friend list based on search query
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredFriends = friends.filter((friend) => {
    // If no entered search, show all friends in list
    if (!normalizedQuery) return true;
    return (
      friend.username.toLowerCase().includes(normalizedQuery) ||
      friend.display.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <div>
      <h3 style={{ margin: 0 }}>Friends</h3>
      <div style={{ marginTop: "0.5rem", marginBottom: "0.75rem" }}>
        <input
          type="text"
          className="widefill notTooWide"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username or display name"
          aria-label="Search friends"
        />
      </div>
      {error && (
        <p className="error-message" style={{ color: "#f00" }}>
          {error}
        </p>
      )}
      {loading && <p>Loading...</p>}
      {!loading && friends.length === 0 && <p className="smallAndGray">No friends yet</p>}
      {!loading && friends.length > 0 && filteredFriends.length === 0 && (
        <p className="smallAndGray">No friends match your search</p>
      )}
      {!loading && filteredFriends.length > 0 && (
        <ul>
          {filteredFriends.map((friend) => (
            <li
              key={friend.username}
              style={{
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <UserLink user={friend} />
              <span className="smallAndGray">({friend.username})</span>
              <UserPresenceIndicator user={friend} />
              {canModify && (
                <>
                  {" "}
                  <button
                    className="decline narrow"
                    onClick={() => handleRemoveFriend(friend.username)}
                  >
                    Remove
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
