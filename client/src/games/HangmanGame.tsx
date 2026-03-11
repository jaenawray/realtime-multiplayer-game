import type { HangmanMove, HangmanView } from "@gamenite/shared";
import type { GameProps } from "../util/types.ts";
import { useState } from "react";

export default function HangmanGame({
  view,
  players,
  userPlayerIndex,
  makeMove,
}: GameProps<HangmanView, HangmanMove>) {
  const [letterInput, setLetterInput] = useState("");

  const isMyTurn = view.currentPlayer === userPlayerIndex && !view.finished;
  const currentPlayerName =
    view.currentPlayer === userPlayerIndex ? "your" : `${players[view.currentPlayer]?.display}'s`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (letterInput.length === 1) {
      makeMove(letterInput.toUpperCase());
      setLetterInput("");
    }
  }

  return (
    <div className="content">
      <h2>Hangman</h2>
      <p>Category: {view.category}</p>
      <p style={{ fontSize: "2rem", letterSpacing: "0.5rem", fontFamily: "monospace" }}>
        {view.finished ? view.word : view.maskedWord}
      </p>
      <p>
        Wrong guesses:{" "}
        <strong style={{ color: view.wrongGuesses > 0 ? "red" : undefined }}>
          {view.wrongGuesses}/{view.maxWrongGuesses}
        </strong>
      </p>
      <p>
        Correct: <span style={{ color: "green" }}>{view.correctLetters.join(", ") || "none"}</span>
      </p>
      <p>
        Wrong: <span style={{ color: "red" }}>{view.wrongLetters.join(", ") || "none"}</span>
      </p>

      {view.finished && view.result === "win" && (
        <p style={{ color: "green", fontSize: "1.5rem" }}>🎉 You won! The word was "{view.word}"</p>
      )}
      {view.finished && view.result === "lose" && (
        <p style={{ color: "red", fontSize: "1.5rem" }}>💀 Game over! The word was "{view.word}"</p>
      )}

      {!view.finished && (
        <>
          <p>
            It is <strong>{currentPlayerName}</strong> turn
          </p>
          {isMyTurn && (
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
          {!isMyTurn && userPlayerIndex >= 0 && <p>Waiting for {currentPlayerName} turn...</p>}
        </>
      )}
    </div>
  );
}
