import { useCallback, useEffect, useMemo, useState } from "react";
import type { MessageInfo, SafeUserInfo } from "@gamenite/shared";
import useAuth from "../hooks/useAuth.ts";
import useLoginContext from "../hooks/useLoginContext.ts";
import {
  type ConversationPreviewDTO,
  type ConversationThreadDTO,
  type DirectMessageDTO,
  getDirectMessageConversations,
  getDirectMessageThread,
  sendDirectMessage,
} from "../services/directMessageService.ts";
import { getFriendsList } from "../services/friendService.ts";
import useDirectMessageNotification from "../hooks/useDirectMessageNotification.ts";
import MessageCreation from "../components/MessageCreation.tsx";
import MessageList from "../components/MessageList.tsx";
import type { ChatMessage } from "../util/types.ts";
import "./Messages.css";

/**
 * Direct messaging page.
 */
export default function Messages() {
  const auth = useAuth();
  const { user, socket } = useLoginContext();
  const { markAllRead } = useDirectMessageNotification();

  const [friends, setFriends] = useState<SafeUserInfo[]>([]);
  const [conversations, setConversations] = useState<ConversationPreviewDTO[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [thread, setThread] = useState<ConversationThreadDTO | null>(null);
  const [error, setError] = useState<string>("");

  const loadConversations = useCallback(async () => {
    const res = await getDirectMessageConversations(auth);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setError("");
    setConversations(res);
  }, [auth]);

  const loadThread = useCallback(
    async (username: string) => {
      setSelectedUsername(username);
      const res = await getDirectMessageThread(auth, username);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setError("");
      setThread(res);
    },
    [auth],
  );

  useEffect(() => {
    markAllRead();
    let ignore = false;
    void (async () => {
      const [friendsRes, conversationsRes] = await Promise.all([
        getFriendsList(auth),
        getDirectMessageConversations(auth),
      ]);

      if (ignore) return;

      if ("error" in friendsRes) {
        setError(friendsRes.error);
      } else {
        setFriends(friendsRes);
      }

      if ("error" in conversationsRes) {
        setError(conversationsRes.error);
      } else {
        setConversations(conversationsRes);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [auth, markAllRead]);

  useEffect(() => {
    const handleDirectMessage = ({ message }: { message: DirectMessageDTO }) => {
      setThread((currentThread) => {
        if (!currentThread) return currentThread;
        if (currentThread.otherUser.username !== message.senderUsername) return currentThread;
        return {
          ...currentThread,
          messages: [...currentThread.messages, message],
          updatedAt: new Date(message.createdAt),
        };
      });

      if (selectedUsername === message.senderUsername) {
        void loadThread(message.senderUsername);
      }

      void loadConversations();
    };

    socket.on("directMessageReceived", handleDirectMessage);
    return () => {
      socket.off("directMessageReceived", handleDirectMessage);
    };
  }, [loadConversations, loadThread, selectedUsername, socket]);

  const conversationByFriend = useMemo(() => {
    const mapped = new Map<string, ConversationPreviewDTO>();
    for (const conversation of conversations) {
      const otherUsername =
        conversation.user1Username === user.username
          ? conversation.user2Username
          : conversation.user1Username;
      mapped.set(otherUsername, conversation);
    }
    return mapped;
  }, [conversations, user.username]);

  const chatMessages: ChatMessage[] = useMemo(() => {
    if (!thread) return [];
    return thread.messages.map(
      (message): MessageInfo => ({
        messageId: message.messageId,
        text: message.text,
        createdAt: new Date(message.createdAt),
        createdBy: message.senderUsername === user.username ? user : thread.otherUser,
      }),
    );
  }, [thread, user]);

  const onSend = async (text: string) => {
    if (!selectedUsername) {
      setError("Select a friend to message");
      return;
    }

    const res = await sendDirectMessage(auth, selectedUsername, text);
    if ("error" in res) {
      setError(res.error);
      return;
    }

    setError("");

    setThread((currentThread) => {
      if (!currentThread) return currentThread;
      return {
        ...currentThread,
        messages: [...currentThread.messages, res],
        updatedAt: new Date(res.createdAt),
      };
    });

    await loadConversations();
  };

  return (
    <div className="messages-page">
      <h2>Messages</h2>

      {error && <p className="messages-error">{error}</p>}

      <div className="messages-layout">
        <aside className="messages-sidebar">
          <h3>Friends</h3>
          {friends.length === 0 ? (
            <p className="messages-muted">No friends available to message.</p>
          ) : (
            <ul className="messages-list">
              {friends.map((friend) => {
                const preview = conversationByFriend.get(friend.username)?.lastMessage?.text;
                return (
                  <li key={friend.username}>
                    <button
                      className={`messages-conversation ${selectedUsername === friend.username ? "active" : ""}`}
                      onClick={() => void loadThread(friend.username)}
                    >
                      <strong>{friend.display}</strong>
                      <span className="messages-small">@{friend.username}</span>
                      <span>{preview ?? "No messages yet"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="messages-thread">
          <h3>
            {thread
              ? `Chat with ${thread.otherUser.display}`
              : selectedUsername
                ? `Chat with ${selectedUsername}`
                : "Select a friend"}
          </h3>

          {selectedUsername && thread ? (
            <div className="messages-chatpanel">
              <MessageList messages={chatMessages} />
              <MessageCreation handleMessageCreation={(text) => void onSend(text)} />
            </div>
          ) : (
            <p className="messages-muted">Choose a friend to start chatting.</p>
          )}
        </section>
      </div>
    </div>
  );
}
