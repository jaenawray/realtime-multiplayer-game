import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { gameNames } from "../util/consts.ts";
import useTimeSince from "../hooks/useTimeSince.ts";
import { getUserGameHistory } from "../services/userService";
import "./UserGameHistoryPanel.css";

interface UserGameHistoryPanelProps {
  username: string;
}

type UserRecentGame = {
  gameId: string;
  gameType: "nim" | "guess" | "hangman";
  won: boolean;
  playedAt: string | Date;
  players: { username: string; display: string }[];
};

type UserGameHistoryPage = {
  total: number;
  offset: number;
  limit: number;
  entries: UserRecentGame[];
};

type UserGameHistoryResponse = UserGameHistoryPage | { error: string };
const getUserGameHistorySafe = getUserGameHistory as unknown as (
  username: string,
  offset?: number,
  limit?: number,
) => Promise<UserGameHistoryResponse>;

const PAGE_SIZE = 5;

/**
 * Shows paginated recent completed games for a user.
 */
export default function UserGameHistoryPanel({ username }: UserGameHistoryPanelProps) {
  const timeSince = useTimeSince();
  const [offset, setOffset] = useState(0);
  const [state, setState] = useState<
    | { type: "loading" }
    | { type: "error"; msg: string }
    | { type: "ready"; page: UserGameHistoryPage }
  >({ type: "loading" });

  useEffect(() => {
    queueMicrotask(() => setOffset(0));
  }, [username]);

  useEffect(() => {
    let cancel = false;
    queueMicrotask(() => setState({ type: "loading" }));

    (async () => {
      try {
        const response = await getUserGameHistorySafe(username, offset, PAGE_SIZE);
        if (cancel) return;

        if ("error" in response) {
          setState({ type: "error", msg: response.error });
        } else {
          setState({ type: "ready", page: response });
        }
      } catch (err) {
        if (cancel) return;
        setState({ type: "error", msg: String(err) });
      }
    })();

    return () => {
      cancel = true;
    };
  }, [username, offset]);

  if (state.type === "loading") return <p>Loading recent games...</p>;
  if (state.type === "error") return <p className="error-message">{state.msg}</p>;

  const { page } = state;
  const hasPrevious = page.offset > 0;
  const hasNext = page.offset + page.entries.length < page.total;

  return (
    <div className="userGameHistoryPanel spacedSection">
      <h3>Recent game history</h3>
      {page.total === 0 ? (
        <p className="smallAndGray">No completed games yet.</p>
      ) : (
        <>
          <div className="dottedList" role="list">
            {page.entries.map((entry) => {
              const opponentNames = entry.players
                .filter((player) => player.username !== username)
                .map((player) => player.display);
              return (
                <div
                  className="dottedListItem userGameHistoryRow"
                  role="listitem"
                  key={entry.gameId}
                >
                  <div className="resultCell">{entry.won ? "Win" : "Loss"}</div>
                  <div className="detailsCell">
                    <NavLink to={`/game/${entry.gameId}`}>
                      A game of {gameNames[entry.gameType]}
                    </NavLink>
                    <div className="smallAndGray">
                      {opponentNames.length > 0
                        ? `vs ${opponentNames.join(", ")} · ${timeSince(entry.playedAt)}`
                        : `${timeSince(entry.playedAt)}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="historyPager">
            <button
              className="secondary narrow"
              disabled={!hasPrevious}
              onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
            >
              Previous
            </button>
            <span className="smallAndGray">
              Showing {page.offset + 1}-{Math.min(page.offset + page.entries.length, page.total)} of{" "}
              {page.total}
            </span>
            <button
              className="secondary narrow"
              disabled={!hasNext}
              onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
