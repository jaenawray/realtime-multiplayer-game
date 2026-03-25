import { GameService } from "./gameServiceManager.ts";
import { type GameLogic } from "./gameLogic.ts";
import {
  type HangmanState,
  type HangmanView,
  type HangmanMove,
  type HangmanCategory,
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
 * Returns -1 during setup phase
 */
function getCurrentPlayer(state: HangmanState): number {
  if (state.phase === "setup") return -1;
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
  if (!state.word) return { wordRevealed: false, lost: false, wrongGuesses: 0 };
  const wordRevealed = isWordRevealed(state.word, state.guessedLetters);
  const wrongGuesses = countWrongGuesses(state.word, state.guessedLetters);
  const lost = wrongGuesses >= MAX_WRONG_GUESSES;
  return { wordRevealed, lost, wrongGuesses };
}

function isHangmanFinished(state: HangmanState): boolean {
  if (state.phase === "setup") return false;
  const { wordRevealed, lost } = hangmanResult(state);
  return wordRevealed || lost;
}

/**
 * Create player order excluding the word picker
 */
function createPlayerOrder(numPlayers: number, wordPickerIndex: number | null): number[] {
  const allPlayers = Array.from({ length: numPlayers }, (_, i) => i);
  const eligiblePlayers = wordPickerIndex !== null 
    ? allPlayers.filter(i => i !== wordPickerIndex)
    : allPlayers;
  return shuffleArray(eligiblePlayers);
}

/**
 * Handle word submission during setup phase
 */
function handleWordSubmission(
  state: HangmanState,
  word: string,
  playerIndex: number
): HangmanState | null {
  // Only player 0 (game creator) can submit a word
  if (playerIndex !== 0) return null;
  if (state.phase !== "setup") return null;

  // Transition to playing phase with custom word
  return {
    phase: "playing",
    numPlayers: state.numPlayers,
    word: word,
    category: "custom",
    guessedLetters: [],
    playerOrder: createPlayerOrder(state.numPlayers, 0), // Exclude the picker
    currentTurnIndex: 0,
    wordPickerIndex: 0,
  };
}

/**
 * Handle using random word during setup phase
 */
function handleUseRandomWord(
  state: HangmanState,
  playerIndex: number,
  category?: HangmanCategory
): HangmanState | null {
  // Only player 0 (game creator) can make this choice
  if (playerIndex !== 0) return null;
  if (state.phase !== "setup") return null;

  // Get random word, optionally filtered by category
  const wordEntry = getRandomWord(category);
  // Transition to playing phase with random word (no picker)
  return {
    phase: "playing",
    numPlayers: state.numPlayers,
    word: wordEntry.word,
    category: wordEntry.category,
    guessedLetters: [],
    playerOrder: createPlayerOrder(state.numPlayers, null), // Everyone plays
    currentTurnIndex: 0,
    wordPickerIndex: null,
  };
}

/**
 * Handle letter guess during playing phase
 */
function handleLetterGuess(
  state: HangmanState,
  letter: string,
  playerIndex: number
): HangmanState | null {
  if (state.phase !== "playing") return null;

  // No more moves after the game is finished (win or lose)
  if (isHangmanFinished(state)) return null;

  // Word picker cannot guess
  if (playerIndex === state.wordPickerIndex) return null;

  // Check if it's this player's turn
  if (playerIndex !== getCurrentPlayer(state)) return null;

  // Check if letter was already guessed
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
    phase: "playing",
    numPlayers: state.numPlayers,
    word: state.word,
    category: state.category,
    guessedLetters: newGuessedLetters,
    playerOrder: state.playerOrder,
    currentTurnIndex: nextTurnIndex,
    wordPickerIndex: state.wordPickerIndex,
  };
}

/**
 * Hangman game logic
 */
export const hangmanLogic: GameLogic<HangmanState, HangmanView> = {
  minPlayers: 2,
  maxPlayers: 6,

  start: (numPlayers) => {
    // Start in setup phase - player 0 will choose whether to pick a word or use random
    return {
      phase: "setup",
      numPlayers,
      word: "",
      category: "custom",
      guessedLetters: [],
      playerOrder: [], // Will be set when word is chosen
      currentTurnIndex: 0,
      wordPickerIndex: null,
    };
  },

  update: (state: HangmanState, payload: unknown, playerIndex: number): HangmanState | null => {
    // Validate move format
    const moveResult = zHangmanMove.safeParse(payload);
    if (moveResult.error) return null;

    const move = moveResult.data as HangmanMove;

    switch (move.type) {
      case "submitWord":
        return handleWordSubmission(state, move.word, playerIndex);
      case "useRandomWord":
        return handleUseRandomWord(state, playerIndex, move.category);
      case "guess":
        return handleLetterGuess(state, move.letter, playerIndex);
    }
  },

  isDone: (state) => isHangmanFinished(state),

  viewAs: (state, playerIndex) => {
    const isWordPicker = state.wordPickerIndex === playerIndex;
    const currentPlayer = getCurrentPlayer(state);
    
    // During setup, no one can guess
    // During playing, only non-pickers on their turn can guess
    const canGuess = state.phase === "playing" 
      && !isWordPicker 
      && currentPlayer === playerIndex
      && !isHangmanFinished(state);

    if (state.phase === "setup") {
      return {
        phase: "setup",
        maskedWord: "",
        category: "custom",
        guessedLetters: [],
        correctLetters: [],
        wrongLetters: [],
        wrongGuesses: 0,
        maxWrongGuesses: MAX_WRONG_GUESSES,
        currentPlayer: -1,
        finished: false,
        wordPickerIndex: null,
        isWordPicker: playerIndex === 0, // Player 0 is the designated picker during setup
        canGuess: false,
      };
    }

    const correctLetters = state.guessedLetters.filter((letter) => state.word.includes(letter));
    const wrongLetters = state.guessedLetters.filter((letter) => !state.word.includes(letter));
    const { wordRevealed, lost, wrongGuesses } = hangmanResult(state);
    const finished = wordRevealed || lost;

    return {
      phase: "playing",
      maskedWord: maskWord(state.word, state.guessedLetters),
      category: state.category,
      guessedLetters: state.guessedLetters,
      correctLetters,
      wrongLetters,
      wrongGuesses,
      maxWrongGuesses: MAX_WRONG_GUESSES,
      currentPlayer,
      finished,
      result: finished ? (wordRevealed ? "win" : "lose") : undefined,
      word: finished ? state.word : undefined,
      wordPickerIndex: state.wordPickerIndex,
      isWordPicker,
      canGuess,
    };
  },

  tagView: (view) => ({ type: "hangman", view }),

  describeMove: (prevState, newState, payload, _playerIndex) => {
    const moveResult = zHangmanMove.safeParse(payload);
    if (moveResult.error) return " made an invalid move";
    
    const move = moveResult.data as HangmanMove;

    switch (move.type) {
      case "submitWord":
        return ` set a custom word (${move.word.length} letters)`;
      case "useRandomWord":
        return move.category 
          ? ` chose a random ${move.category} word`
          : ` chose to use a random word`;
      case "guess": {
        const letter = move.letter;
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
      }
    }
  },
};

export const hangmanGameService = new GameService<HangmanState, HangmanView>(hangmanLogic);
