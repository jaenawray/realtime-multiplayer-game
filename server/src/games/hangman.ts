import { GameService } from "./gameServiceManager.ts";
import { type GameLogic } from "./gameLogic.ts";
import {
  type HangmanState,
  type HangmanView,
  getRandomWord,
  zHangmanMove,
  MAX_WRONG_GUESSES,
} from "../../../shared/src/index.ts";

/**
 * Mask the word by replacing unguessed letters with underscores
 */
function maskWord(word: string, guessedLetters: string[]): string {
  return word
    .split("")
    .map((letter) => (guessedLetters.includes(letter) ? letter : "_"))
    .join("");
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get the current player index from the shuffled order
 */
function getCurrentPlayer(state: HangmanState): number {
  return state.playerOrder[state.currentTurnIndex];
}

/**
 * Check if the word has been fully revealed
 */
function isWordRevealed(word: string, guessedLetters: string[]): boolean {
  return word.split("").every((letter) => guessedLetters.includes(letter));
}

/**
 * Count wrong guesses
 */
function countWrongGuesses(word: string, guessedLetters: string[]): number {
  return guessedLetters.filter((letter) => !word.includes(letter)).length;
}

/**
 * Win: every letter of the given word was guessed
 * Lose: number of wrong guesses reached the limit (6)
 */
function hangmanResult(state: Pick<HangmanState, "word" | "guessedLetters">): {
  wordRevealed: boolean;
  lost: boolean;
  wrongGuesses: number;
} {
  const wordRevealed = isWordRevealed(state.word, state.guessedLetters);
  const wrongGuesses = countWrongGuesses(state.word, state.guessedLetters);
  const lost = wrongGuesses >= MAX_WRONG_GUESSES;
  return { wordRevealed, lost, wrongGuesses };
}

function isHangmanFinished(state: Pick<HangmanState, "word" | "guessedLetters">): boolean {
  const { wordRevealed, lost } = hangmanResult(state);
  return wordRevealed || lost;
}

/**
 * Hangman game logic
 */
export const hangmanLogic: GameLogic<HangmanState, HangmanView> = {
  minPlayers: 2,
  maxPlayers: 6,

  start: (numPlayers) => {
    const wordEntry = getRandomWord();
    // Create shuffled player order [0, 1, 2, ...] -> shuffled
    const playerOrder = shuffleArray(Array.from({ length: numPlayers }, (_, i) => i));
    return {
      word: wordEntry.word,
      category: wordEntry.category,
      guessedLetters: [],
      playerOrder,
      currentTurnIndex: 0,
    };
  },

  update: (state: HangmanState, payload: unknown, playerIndex: number): HangmanState | null => {
    // Validate move format
    const move = zHangmanMove.safeParse(payload);
    if (move.error) return null;

    // No more moves after the game is finished (win or lose)
    if (isHangmanFinished(state)) return null;

    // Check if it's this player's turn
    if (playerIndex !== getCurrentPlayer(state)) return null;

    // Check if letter was already guessed
    const letter = move.data;
    if (state.guessedLetters.includes(letter)) return null;

    // Add letter to list of guessed letters
    const newGuessedLetters = [...state.guessedLetters, letter];
    const { wordRevealed, lost } = hangmanResult({
      word: state.word,
      guessedLetters: newGuessedLetters,
    });
    // Don't rotate turns after final guess
    const moveEndsGame = wordRevealed || lost;
    const nextTurnIndex = moveEndsGame
      ? state.currentTurnIndex
      : (state.currentTurnIndex + 1) % state.playerOrder.length;

    return {
      word: state.word,
      category: state.category,
      guessedLetters: newGuessedLetters,
      playerOrder: state.playerOrder,
      currentTurnIndex: nextTurnIndex,
    };
  },

  isDone: (state) => isHangmanFinished(state),

  viewAs: (state, _playerIndex) => {
    const correctLetters = state.guessedLetters.filter((letter) => state.word.includes(letter));
    const wrongLetters = state.guessedLetters.filter((letter) => !state.word.includes(letter));
    const { wordRevealed, lost, wrongGuesses } = hangmanResult(state);
    const finished = wordRevealed || lost;

    return {
      maskedWord: maskWord(state.word, state.guessedLetters),
      category: state.category,
      guessedLetters: state.guessedLetters,
      correctLetters,
      wrongLetters,
      wrongGuesses,
      maxWrongGuesses: MAX_WRONG_GUESSES,
      currentPlayer: getCurrentPlayer(state),
      finished,
      result: finished ? (wordRevealed ? "win" : "lose") : undefined,
      word: finished ? state.word : undefined,
    };
  },

  tagView: (view) => ({ type: "hangman", view }),

  describeMove: (prevState, newState, payload, _playerIndex) => {
    const letter = zHangmanMove.parse(payload);
    const isCorrect = prevState.word.includes(letter);
    const { wordRevealed, lost, wrongGuesses } = hangmanResult(newState);

    if (wordRevealed) {
      return ` guessed '${letter}' — correct! 🎉 The word was "${prevState.word}"!`;
    }
    if (lost) {
      return ` guessed '${letter}' — wrong! 💀 Game over! The word was "${prevState.word}"`;
    }
    if (isCorrect) {
      return ` guessed '${letter}' — correct!`;
    }
    return ` guessed '${letter}' — wrong! (${wrongGuesses}/${MAX_WRONG_GUESSES})`;
  },
};

export const hangmanGameService = new GameService<HangmanState, HangmanView>(hangmanLogic);
