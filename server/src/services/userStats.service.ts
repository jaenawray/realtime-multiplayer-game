import type { GuessState, HangmanState, NimState, UserGameStats } from "@gamenite/shared";
import type { GameRecord, UserStatsRecord } from "../models.ts";
import { GameRepo, UserStatsRepo } from "../repository.ts";
import { getUserByUsername } from "./auth.service.ts";

function emptyStatsByType() {
  return {
    nim: { played: 0, wins: 0 },
    guess: { played: 0, wins: 0 },
    hangman: { played: 0, wins: 0 },
  };
}

async function getAllStatsRows(): Promise<UserStatsRecord[]> {
  const keys = await UserStatsRepo.getAllKeys();
  return Promise.all(keys.map((id) => UserStatsRepo.get(id)));
}

async function gameAlreadyRecorded(gameId: string): Promise<boolean> {
  const rows = await getAllStatsRows();
  return rows.some((row) => row.gameId === gameId);
}

function isWordRevealed(word: string, guessedLetters: string[]): boolean {
  return word.split("").every((letter) => guessedLetters.includes(letter));
}

function getWinningPlayers(game: GameRecord): string[] {
  if (!game.state || !game.done) return [];

  switch (game.type) {
    case "nim": {
      const state = game.state as NimState;
      if (state.remaining !== 0) return [];
      return game.players[state.nextPlayer] ? [game.players[state.nextPlayer]] : [];
    }

    case "guess": {
      const state = game.state as GuessState;
      if (!state.guesses.every((guess): guess is number => guess !== null)) {
        return [];
      }
      const distances = state.guesses.map((guess) => Math.abs(guess - state.secret));
      const minDistance = Math.min(...distances);
      const winners = new Set(
        distances
          .map((distance, index) => (distance === minDistance ? game.players[index] : null))
          .filter((userId): userId is string => userId !== null),
      );
      return [...winners];
    }

    case "hangman": {
      const state = game.state as HangmanState;
      return isWordRevealed(state.word, state.guessedLetters) ? [...game.players] : [];
    }
  }
}

/**
 * Persist user_stats rows for a completed game. If rows already exist for
 * that game, this operation is a no-op.
 */
export async function recordCompletedGame(gameId: string, game: GameRecord): Promise<void> {
  if (!game.done || !game.state) return;
  if (await gameAlreadyRecorded(gameId)) return;

  const winners = new Set(getWinningPlayers(game));
  await Promise.all(
    game.players.map((userId) =>
      UserStatsRepo.add({
        userId,
        gameId,
        gameType: game.type,
        won: winners.has(userId),
        playedAt: new Date().toISOString(),
      }),
    ),
  );
}

/**
 * Recompute user_stats rows from all completed games.
 */
export async function rebuildUserStatsFromGames(): Promise<void> {
  await UserStatsRepo.clear();

  const gameIds = await GameRepo.getAllKeys();
  const games = await Promise.all(
    gameIds.map(async (gameId) => ({ gameId, game: await GameRepo.get(gameId) })),
  );

  await Promise.all(
    games
      .filter(({ game }) => game.done && game.state)
      .map(({ gameId, game }) => recordCompletedGame(gameId, game)),
  );
}

/**
 * Retrieve aggregate game stats for one username.
 */
export async function getUserGameStats(username: string): Promise<UserGameStats | null> {
  const user = await getUserByUsername(username);
  if (!user) return null;

  const rows = (await getAllStatsRows()).filter((row) => row.userId === user.userId);
  const byType = emptyStatsByType();

  for (const row of rows) {
    byType[row.gameType].played += 1;
    if (row.won) {
      byType[row.gameType].wins += 1;
    }
  }

  const gameKeys = ["nim", "guess", "hangman"] as const;
  const gamesPlayed = gameKeys.reduce((sum, key) => sum + byType[key].played, 0);
  const wins = gameKeys.reduce((sum, key) => sum + byType[key].wins, 0);

  return {
    username,
    gamesPlayed,
    wins,
    byType,
  };
}
