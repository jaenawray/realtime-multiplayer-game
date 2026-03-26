import { useEffect, useState } from "react";
import { getUserStats } from "../services/userService";
import "./UserStatsPanel.css";

interface UserStatsPanelProps {
  username: string;
}

type PerGameStats = { played: number; wins: number };
type UserGameStats = {
  gamesPlayed: number;
  wins: number;
  byType: {
    nim: PerGameStats;
    guess: PerGameStats;
    hangman: PerGameStats;
  };
};
type UserStatsResponse = UserGameStats | { error: string };
const getUserStatsSafe = getUserStats as unknown as (
  username: string,
) => Promise<UserStatsResponse>;

/**
 * Shows aggregate game statistics for a user.
 */
export default function UserStatsPanel({ username }: UserStatsPanelProps) {
  const [state, setState] = useState<
    { type: "loading" } | { type: "error"; msg: string } | { type: "ready"; stats: UserGameStats }
  >({ type: "loading" });

  useEffect(() => {
    let cancel = false;
    queueMicrotask(() => setState({ type: "loading" }));

    (async () => {
      try {
        const response = await getUserStatsSafe(username);
        if (cancel) return;

        if ("error" in response) {
          setState({ type: "error", msg: response.error });
        } else {
          setState({ type: "ready", stats: response });
        }
      } catch (err) {
        if (cancel) return;
        setState({ type: "error", msg: String(err) });
      }
    })();

    return () => {
      cancel = true;
    };
  }, [username]);

  if (state.type === "loading") return <p>Loading game stats...</p>;
  if (state.type === "error") return <p className="error-message">{state.msg}</p>;

  const { stats } = state;
  const winRate = stats.gamesPlayed === 0 ? 0 : Math.round((100 * stats.wins) / stats.gamesPlayed);
  const gameTypes: Array<keyof UserGameStats["byType"]> = ["nim", "guess", "hangman"];

  return (
    <div className="userStatsPanel">
      <h3>Game statistics</h3>
      <ul>
        <li>Games played: {stats.gamesPlayed}</li>
        <li>Total wins: {stats.wins}</li>
        <li>Overall win rate: {winRate}%</li>
      </ul>

      <table className="userStatsTable">
        <thead>
          <tr>
            <th>Game type</th>
            <th>Played</th>
            <th>Wins</th>
          </tr>
        </thead>
        <tbody>
          {gameTypes.map((type) => (
            <tr key={type}>
              <td>{type}</td>
              <td>{stats.byType[type].played}</td>
              <td>{stats.byType[type].wins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
