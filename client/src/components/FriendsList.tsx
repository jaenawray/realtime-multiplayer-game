import type { SafeUserInfo, UserAuth } from "@gamenite/shared";
import { useEffect, useState } from "react";
import { getFriendsList, removeFriend } from "../services/friendService";

interface FriendsListProps {
  auth: UserAuth;
  canModify?: boolean;
}

export default function FriendsList({ auth, canModify = false }: FriendsListProps) {
  const [friends, setFriends] = useState<SafeUserInfo[]>([]);
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

  return (
    <div>
      <h3>Friends</h3>
      {error && (
        <p className="error-message" style={{ color: "#f00" }}>
          {error}
        </p>
      )}
      {loading && <p>Loading...</p>}
      {!loading && friends.length === 0 && <p className="smallAndGray">No friends yet</p>}
      {!loading && friends.length > 0 && (
        <ul>
          {friends.map((friend) => (
            <li key={friend.username} style={{ marginBottom: "0.5rem" }}>
              <strong>{friend.display}</strong> ({friend.username})
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
