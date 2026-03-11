import { z } from "zod";
import { type HangmanCategory } from "./hangman.words.ts";

/**
 * Maximum number of wrong guesses before the game is lost
 */
export const MAX_WRONG_GUESSES = 6;

/**
 * The internal state of a Hangman game stored on the server.
 */
export interface HangmanState {
  /** The secret word to guess (uppercase A-Z) */
  word: string;
  /** The category of the word */
  category: HangmanCategory;
  /** Letters that have been guessed so far */
  guessedLetters: string[];
  /** Shuffled player order (array of player indices) */
  playerOrder: number[];
  /** Current position in playerOrder array */
  currentTurnIndex: number;
  // TODO: Add wrong guess tracking
}

/**
 * The player's view of a Hangman game.
 */
export interface HangmanView {
  /** Word with unguessed letters as underscores, e.g., "H_NGM_N" */
  maskedWord: string;
  /** The category of the word (hint for players) */
  category: HangmanCategory;
  /** All letters guessed so far */
  guessedLetters: string[];
  /** Letters that were correct (in the word) */
  correctLetters: string[];
  /** Letters that were wrong (not in the word) */
  wrongLetters: string[];
  /** Number of wrong guesses made */
  wrongGuesses: number;
  /** Maximum wrong guesses allowed */
  maxWrongGuesses: number;
  /** Index of player whose turn it is */
  currentPlayer: number;
  /** Whether the game has ended */
  finished: boolean;
  /** Game result (only set when finished) */
  result?: "win" | "lose";
  /** The revealed word (only shown when finished) */
  word?: string;
}

/**
 * A move in Hangman is a single uppercase letter guess (A-Z).
 */
export type HangmanMove = z.infer<typeof zHangmanMove>;
export const zHangmanMove = z
  .string()
  .length(1)
  .regex(/^[A-Z]$/, "Must be a single uppercase letter A-Z");
