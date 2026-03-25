import type { HangmanMove, HangmanView, HangmanCategory } from "@gamenite/shared";
import { categoryConfig } from "@gamenite/shared";
import type { GameProps } from "../util/types.ts";
import { useState } from "react";

// All available categories for the dropdown
const ALL_CATEGORIES: HangmanCategory[] = [
  "programming",
  "animals",
  "countries",
  "movies",
  "sports",
  "food",
  "science",
  "music",
];

/**
 * Hangman Figure (SVG): base is always drawn; the figure gains one body part per wrong guess (max 6).
 * Part order: head, body, left arm, right arm, left leg, right leg.
 */
function HangmanFigure({ wrongGuesses }: { wrongGuesses: number }) {
  const n = Math.min(Math.max(wrongGuesses, 0), 6);
  const show = (step: number) => n >= step;

  return (
    <svg
      viewBox="0 0 200 260"
      width={200}
      height={260}
      role="img"
      aria-label={`Hangman drawing: ${n} of 6 wrong guesses`}
      style={{ color: "var(--text-primary, #2c2c2c)", flexShrink: 0 }}
    >
      <g
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <line x1="15" y1="248" x2="105" y2="248" />
        <line x1="60" y1="248" x2="60" y2="24" />
        <line x1="60" y1="24" x2="148" y2="24" />
        <line x1="148" y1="24" x2="148" y2="52" />
        {show(1) && <circle cx="148" cy="71" r="18" />}
        {show(2) && <line x1="148" y1="89" x2="148" y2="168" />}
        {show(3) && <line x1="148" y1="108" x2="112" y2="142" />}
        {show(4) && <line x1="148" y1="108" x2="184" y2="142" />}
        {show(5) && <line x1="148" y1="168" x2="118" y2="218" />}
        {show(6) && <line x1="148" y1="168" x2="178" y2="218" />}
      </g>
    </svg>
  );
}

export default function HangmanGame({
  view,
  players,
  userPlayerIndex,
  makeMove,
}: GameProps<HangmanView, HangmanMove>) {
  const [letterInput, setLetterInput] = useState("");
  const [customWord, setCustomWord] = useState("");
  const [wordError, setWordError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HangmanCategory | "">("");

  // Setup phase - word picker chooses word or uses random
  if (view.phase === "setup") {
    const isDesignatedPicker = userPlayerIndex === 0;

    if (isDesignatedPicker) {
      const handleSubmitWord = (e: React.FormEvent) => {
        e.preventDefault();
        const word = customWord.toUpperCase().trim();

        // Validate word
        if (word.length < 3) {
          setWordError("Word must be at least 3 letters");
          return;
        }
        if (word.length > 20) {
          setWordError("Word must be at most 20 letters");
          return;
        }
        if (!/^[A-Z]+$/.test(word)) {
          setWordError("Word must contain only letters A-Z");
          return;
        }

        setWordError("");
        makeMove({ type: "submitWord", word });
      };

      const handleUseRandomWord = () => {
        if (selectedCategory) {
          makeMove({ type: "useRandomWord", category: selectedCategory });
        } else {
          makeMove({ type: "useRandomWord" });
        }
      };

      return (
        <div className="content">
          <h2>Hangman - Word Picker</h2>
          <p style={{ marginBottom: "1.5rem" }}>
            You are the <strong>Word Picker</strong>! Choose a word for others to guess, or use a
            random word to play along.
          </p>

          <div
            style={{
              background: "var(--surface-2, #f5f5f5)",
              padding: "1.5rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Option 1: Pick a Custom Word</h3>
            <form onSubmit={handleSubmitWord}>
              <input
                type="text"
                value={customWord}
                onChange={(e) => {
                  setCustomWord(e.target.value.toUpperCase());
                  setWordError("");
                }}
                placeholder="Enter a word (3-20 letters)"
                style={{
                  width: "100%",
                  maxWidth: "300px",
                  padding: "0.75rem",
                  fontSize: "1.1rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1rem",
                }}
              />
              {wordError && <p style={{ color: "red", margin: "0.5rem 0" }}>{wordError}</p>}
              <div style={{ marginTop: "1rem" }}>
                <button type="submit" className="primary narrow">
                  Use This Word
                </button>
              </div>
              <p style={{ fontSize: "0.9rem", color: "gray", marginTop: "0.5rem" }}>
                ⚠️ You won't be able to guess if you pick a custom word
              </p>
            </form>
          </div>

          <div
            style={{
              background: "var(--surface-2, #f5f5f5)",
              padding: "1.5rem",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Option 2: Use a Random Word</h3>
            <p style={{ marginBottom: "1rem" }}>
              Let the game pick a random word so everyone (including you) can guess!
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="category-select"
                style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}
              >
                Select a Category (optional):
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as HangmanCategory | "")}
                style={{
                  padding: "0.75rem",
                  fontSize: "1rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  minWidth: "200px",
                  cursor: "pointer",
                }}
              >
                <option value="">🎲 Any Category</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryConfig[cat].icon} {categoryConfig[cat].displayName}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={handleUseRandomWord} className="primary narrow">
              {selectedCategory
                ? `Use Random ${categoryConfig[selectedCategory].displayName} Word`
                : "Use Random Word"}
            </button>
          </div>
        </div>
      );
    }

    // Non-picker players wait during setup
    return (
      <div className="content">
        <h2>Hangman</h2>
        <p style={{ fontSize: "1.2rem" }}>
          Waiting for <strong>{players[0]?.display || "the host"}</strong> to choose a word...
        </p>
        <p style={{ color: "gray" }}>
          They can pick a custom word or choose a category for a random word.
        </p>
      </div>
    );
  }

  // Playing phase
  const currentPlayerName =
    view.currentPlayer === userPlayerIndex ? "your" : `${players[view.currentPlayer]?.display}'s`;

  // Get category display info
  const getCategoryDisplay = () => {
    if (view.category === "custom") {
      return "Custom Word";
    }
    const config = categoryConfig[view.category];
    return config ? `${config.icon} ${config.displayName}` : view.category;
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (letterInput.length === 1) {
      makeMove({ type: "guess", letter: letterInput.toUpperCase() });
      setLetterInput("");
    }
  }

  return (
    <div className="content">
      <h2>Hangman</h2>
      <p>
        Category: <strong>{getCategoryDisplay()}</strong>
        {view.wordPickerIndex !== null && (
          <span style={{ marginLeft: "0.5rem", color: "gray" }}>
            (picked by {players[view.wordPickerIndex]?.display || "player"})
          </span>
        )}
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
          alignItems: "flex-start",
          marginBottom: "0.5rem",
        }}
      >
        <HangmanFigure wrongGuesses={view.wrongGuesses} />
        <div style={{ flex: "1", minWidth: "min(100%, 220px)" }}>
          <p
            style={{
              fontSize: "2rem",
              letterSpacing: "0.5rem",
              fontFamily: "monospace",
              marginTop: 0,
            }}
          >
            {view.finished ? view.word : view.maskedWord}
          </p>
          <p>
            Wrong guesses:{" "}
            <strong style={{ color: view.wrongGuesses > 0 ? "red" : undefined }}>
              {view.wrongGuesses}/{view.maxWrongGuesses}
            </strong>
          </p>
          <p>
            Correct:{" "}
            <span style={{ color: "green" }}>{view.correctLetters.join(", ") || "none"}</span>
          </p>
          <p>
            Wrong: <span style={{ color: "red" }}>{view.wrongLetters.join(", ") || "none"}</span>
          </p>
        </div>
      </div>

      {view.finished && view.result === "win" && (
        <p style={{ color: "green", fontSize: "1.5rem" }}>🎉 You won! The word was "{view.word}"</p>
      )}
      {view.finished && view.result === "lose" && (
        <p style={{ color: "red", fontSize: "1.5rem" }}>💀 Game over! The word was "{view.word}"</p>
      )}

      {!view.finished && (
        <>
          {view.isWordPicker ? (
            <p
              style={{
                padding: "1rem",
                background: "var(--surface-2, #f0f0f0)",
                borderRadius: "8px",
                marginTop: "1rem",
              }}
            >
              👀 You picked the word! Watch as others try to guess it.
            </p>
          ) : (
            <>
              <p>
                It is <strong>{currentPlayerName}</strong> turn
              </p>
              {view.canGuess && (
                <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
                  <input
                    type="text"
                    maxLength={1}
                    value={letterInput}
                    onChange={(e) => setLetterInput(e.target.value.toUpperCase())}
                    placeholder="Enter a letter"
                    style={{ width: "8rem", textAlign: "center", fontSize: "1.2rem" }}
                  />
                  <button type="submit" className="primary narrow" style={{ marginLeft: "0.5rem" }}>
                    Guess
                  </button>
                </form>
              )}
              {!view.canGuess && userPlayerIndex >= 0 && (
                <p>Waiting for {currentPlayerName} turn...</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
