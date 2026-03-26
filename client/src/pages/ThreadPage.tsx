import "./ThreadPage.css";
import { useParams } from "react-router-dom";
import useThreadInfo from "../hooks/useThreadInfo.ts";
import NewForumComment from "../components/NewForumComment.tsx";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "../components/UserLink.tsx";
import ProfilePictureDisplay from "../components/ProfilePictureDisplay.tsx";

export default function ThreadPage() {
  const formatTimeSince = useTimeSince();
  const { threadId } = useParams();

  // non-nullish assertion is okay here given that Thread is only called in a
  // route with `:threadId` on the path
  const { threadInfo, setThread } = useThreadInfo(threadId!);

  return (
    <div className="content">
      {"message" in threadInfo ? (
        threadInfo.message
      ) : (
        <div className="spacedSection">
          <h2>{threadInfo.title}</h2>
          <div className="notTooWide">{threadInfo.text}</div>
          <div
            className="smallAndGray"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <ProfilePictureDisplay
              avatarUrl={threadInfo.createdBy.avatar}
              displayName={threadInfo.createdBy.display}
              size="small"
            />
            Posted by <UserLink user={threadInfo.createdBy} />{" "}
            {formatTimeSince(threadInfo.createdAt)}
          </div>
          <div className="dottedList" role="list">
            {threadInfo.comments.map(({ commentId, text, createdBy, createdAt, editedAt }) => (
              <div className="dottedListItem" role="listitem" key={commentId}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <ProfilePictureDisplay
                    avatarUrl={createdBy.avatar}
                    displayName={createdBy.display}
                    size="small"
                  />
                  <div>
                    <div>{text}</div>
                    <div className="smallAndGray">
                      Reply by <UserLink user={createdBy} />
                      {createdBy.username === threadInfo.createdBy.username && (
                        <span className="opBlue"> OP</span>
                      )}{" "}
                      {formatTimeSince(createdAt)}
                      {editedAt && ` (last edited ${formatTimeSince(editedAt)})`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <NewForumComment
            firstPost={threadInfo.comments.length === 0}
            threadId={threadInfo.threadId.toString()}
            setThread={setThread}
          />
        </div>
      )}
    </div>
  );
}
