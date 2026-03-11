import { GameService } from "./gameServiceManager.ts";
import { type GameLogic } from "./gameLogic.ts";
import {
  type HangmanState,
  type HangmanView,
  getRandomWord,
  zHangmanMove,
  MAX_WRONG_GUESSES,
} from "@gamenite/shared";

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

  update: (state, payload, playerIndex) => {
    // Validate move format
    const move = zHangmanMove.safeParse(payload);
    if (move.error) return null;

    // Check if it's this player's turn
    if (playerIndex !== getCurrentPlayer(state)) return null;

    // Check if letter was already guessed
    const letter = move.data;
    if (state.guessedLetters.includes(letter)) return null;

    // Add letter to guessed letters and advance turn
    const newGuessedLetters = [...state.guessedLetters, letter];
    const nextTurnIndex = (state.currentTurnIndex + 1) % state.playerOrder.length;

    return {
      ...state,
      guessedLetters: newGuessedLetters,
      currentTurnIndex: nextTurnIndex,
    };
  },

  isDone: (state) => {
    const wrongGuesses = countWrongGuesses(state.word, state.guessedLetters);
    return isWordRevealed(state.word, state.guessedLetters) || wrongGuesses >= MAX_WRONG_GUESSES;
  },

  viewAs: (state, _playerIndex) => {
    const correctLetters = state.guessedLetters.filter((letter) => state.word.includes(letter));
    const wrongLetters = state.guessedLetters.filter((letter) => !state.word.includes(letter));
    const wrongGuesses = wrongLetters.length;
    const wordRevealed = isWordRevealed(state.word, state.guessedLetters);
    const lost = wrongGuesses >= MAX_WRONG_GUESSES;
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
    const wrongGuesses = countWrongGuesses(newState.word, newState.guessedLetters);
    const wordRevealed = isWordRevealed(newState.word, newState.guessedLetters);

    if (wordRevealed) {
      return ` guessed '${letter}' — correct! 🎉 The word was "${prevState.word}"!`;
    }
    if (wrongGuesses >= MAX_WRONG_GUESSES) {
      return ` guessed '${letter}' — wrong! 💀 Game over! The word was "${prevState.word}"`;
    }
    if (isCorrect) {
      return ` guessed '${letter}' — correct!`;
    }
    return ` guessed '${letter}' — wrong! (${wrongGuesses}/${MAX_WRONG_GUESSES})`;
  },
};

export const hangmanGameService = new GameService<HangmanState, HangmanView>(hangmanLogic);
