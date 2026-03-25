import { z } from "zod";
import { type HangmanCategory } from "./hangman.words.ts";

/**
 * Maximum number of wrong guesses before the game is lost
 */
export const MAX_WRONG_GUESSES = 6;

/**
 * Zod schema for validating HangmanCategory
 */
export const zHangmanCategory = z.enum([
  "programming",
  "animals",
  "countries",
  "movies",
  "sports",
  "food",
  "science",
  "music",
]);

/**
 * Game phase: setup (picker entering word) or playing (guessing letters)
 */
export type HangmanPhase = "setup" | "playing";

/**
 * Extended category type that includes "custom" for picker-chosen words
 */
export type HangmanCategoryWithCustom = HangmanCategory | "custom";

/**
 * The internal state of a Hangman game stored on the server.
 */
export interface HangmanState {
  /** Current game phase */
  phase: HangmanPhase;
  /** Total number of players in the game */
  numPlayers: number;
  /** The secret word to guess (uppercase A-Z), empty during setup */
  word: string;
  /** The category of the word */
  category: HangmanCategoryWithCustom;
  /** Letters that have been guessed so far */
  guessedLetters: string[];
  /** Shuffled player order (array of player indices, excludes picker if custom) */
  playerOrder: number[];
  /** Current position in playerOrder array */
  currentTurnIndex: number;
  /** Index of the word picker (null if using random word) */
  wordPickerIndex: number | null;
}

/**
 * The player's view of a Hangman game.
 */
export interface HangmanView {
  /** Current game phase */
  phase: HangmanPhase;
  /** Word with unguessed letters as underscores, e.g., "H_NGM_N" (empty during setup) */
  maskedWord: string;
  /** The category of the word (hint for players) */
  category: HangmanCategoryWithCustom;
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
  /** Index of player whose turn it is (-1 during setup) */
  currentPlayer: number;
  /** Whether the game has ended */
  finished: boolean;
  /** Game result (only set when finished) */
  result?: "win" | "lose";
  /** The revealed word (only shown when finished) */
  word?: string;
  /** Index of the word picker (null if using random word) */
  wordPickerIndex: number | null;
  /** Whether this player is the word picker */
  isWordPicker: boolean;
  /** Whether this player can make a guess (their turn and not the picker) */
  canGuess: boolean;
}

/**
 * A letter guess move (A-Z).
 */
export const zHangmanLetterGuess = z.object({
  type: z.literal("guess"),
  letter: z
    .string()
    .length(1)
    .regex(/^[A-Z]$/, "Must be a single uppercase letter A-Z"),
});
export type HangmanLetterGuess = z.infer<typeof zHangmanLetterGuess>;

/**
 * A word submission move from the picker during setup phase.
 * Word must be 3-20 uppercase letters (A-Z only).
 */
export const zHangmanWordSubmission = z.object({
  type: z.literal("submitWord"),
  word: z
    .string()
    .min(3, "Word must be at least 3 letters")
    .max(20, "Word must be at most 20 letters")
    .regex(/^[A-Z]+$/, "Word must contain only uppercase letters A-Z"),
});
export type HangmanWordSubmission = z.infer<typeof zHangmanWordSubmission>;

/**
 * A move to skip custom word and use a random word instead.
 * Optionally specify a category to pick from.
 */
export const zHangmanUseRandomWord = z.object({
  type: z.literal("useRandomWord"),
  category: zHangmanCategory.optional(),
});
export type HangmanUseRandomWord = z.infer<typeof zHangmanUseRandomWord>;

/**
 * All possible moves in Hangman.
 */
export const zHangmanMove = z.union([
  zHangmanLetterGuess,
  zHangmanWordSubmission,
  zHangmanUseRandomWord,
]);
export type HangmanMove = z.infer<typeof zHangmanMove>;
