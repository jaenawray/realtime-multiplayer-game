import { describe, it, expect } from "vitest";
import { hangmanLogic } from "./hangman.ts";
import { MAX_WRONG_GUESSES } from "@gamenite/shared";

describe("hangmanLogic", () => {
  it("starts in setup with no word", () => {
    const s = hangmanLogic.start(2);
    expect(s.phase).toBe("setup");
    expect(s.word).toBe("");
    expect(hangmanLogic.isDone(s)).toBe(false);
  });

  it("rejects custom word submission from non-host", () => {
    const s = hangmanLogic.start(2);
    const next = hangmanLogic.update(s, { type: "submitWord", word: "CAT" }, 1);
    expect(next).toBeNull();
  });

  it("accepts custom word from host and excludes picker from guess order", () => {
    const s = hangmanLogic.start(2);
    const playing = hangmanLogic.update(s, { type: "submitWord", word: "CAT" }, 0);
    expect(playing).not.toBeNull();
    expect(playing!.phase).toBe("playing");
    expect(playing!.word).toBe("CAT");
    expect(playing!.wordPickerIndex).toBe(0);
    expect(playing!.playerOrder).toEqual([1]);
  });

  it("does not allow the word picker to guess", () => {
    const s = hangmanLogic.start(2);
    const state = hangmanLogic.update(s, { type: "submitWord", word: "CAT" }, 0)!;
    const illegal = hangmanLogic.update(state, { type: "guess", letter: "C" }, 0);
  });

  it("does not allow guessing out of turn", () => {
    const s = hangmanLogic.start(3);
    const state = hangmanLogic.update(s, { type: "submitWord", word: "CAT" }, 0)!;
    const current = state.playerOrder[state.currentTurnIndex];
    const wrongPlayer = [0, 1, 2].find((i) => i !== current && i !== 0)!;
    const illegal = hangmanLogic.update(state, { type: "guess", letter: "C" }, wrongPlayer);
    expect(illegal).toBeNull();
  });

  it("rejects duplicate letter guesses", () => {
    const s = hangmanLogic.start(2);
    let state = hangmanLogic.update(s, { type: "submitWord", word: "CAT" }, 0)!;
    state = hangmanLogic.update(state, { type: "guess", letter: "C" }, 1)!;
    const dup = hangmanLogic.update(state, { type: "guess", letter: "C" }, 1);
    expect(dup).toBeNull();
  });

  it("ends in a win when the word is fully guessed", () => {
    const s = hangmanLogic.start(2);
    let state = hangmanLogic.update(s, { type: "submitWord", word: "CAT" }, 0)!;
    for (const letter of ["C", "A", "T"] as const) {
      state = hangmanLogic.update(state, { type: "guess", letter }, 1)!;
    }
    expect(hangmanLogic.isDone(state)).toBe(true);
    const guesserView = hangmanLogic.viewAs(state, 1);
    expect(guesserView.finished).toBe(true);
    expect(guesserView.result).toBe("win");
    expect(guesserView.word).toBe("CAT");
    const pickerView = hangmanLogic.viewAs(state, 0);
    expect(pickerView.result).toBe("win");
    expect(pickerView.isWordPicker).toBe(true);
  });

  it("ends in a loss after max wrong guesses", () => {
    const s = hangmanLogic.start(2);
    let state = hangmanLogic.update(s, { type: "submitWord", word: "HEY" }, 0)!;
    const wrong = ["B", "C", "D", "F", "G", "J"];
    for (const letter of wrong) {
      state = hangmanLogic.update(state, { type: "guess", letter }, 1)!;
    }
    expect(hangmanLogic.isDone(state)).toBe(true);
    const view = hangmanLogic.viewAs(state, 1);
    expect(view.result).toBe("lose");
    expect(view.wrongGuesses).toBe(MAX_WRONG_GUESSES);
  });

  it("advances from setup via random word with everyone eligible to guess", () => {
    const s = hangmanLogic.start(2);
    const state = hangmanLogic.update(s, { type: "useRandomWord" }, 0);
    expect(state).not.toBeNull();
    expect(state!.phase).toBe("playing");
    expect(state!.wordPickerIndex).toBeNull();
    expect(state!.playerOrder.sort()).toEqual([0, 1]);
    expect(state!.word.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects moves after the game is finished", () => {
    const s = hangmanLogic.start(2);
    let state = hangmanLogic.update(s, { type: "submitWord", word: "CAT" }, 0)!;
    state = hangmanLogic.update(state, { type: "guess", letter: "C" }, 1)!;
    state = hangmanLogic.update(state, { type: "guess", letter: "A" }, 1)!;
    state = hangmanLogic.update(state, { type: "guess", letter: "T" }, 1)!;
    const late = hangmanLogic.update(state, { type: "guess", letter: "Z" }, 1);
    expect(late).toBeNull();
  });

  it("rejects malformed payloads", () => {
    const s = hangmanLogic.start(2);
    expect(hangmanLogic.update(s, { type: "guess", letter: "@" }, 1)).toBeNull();
    expect(hangmanLogic.update(s, { type: "submitWord", word: "NO" }, 0)).toBeNull();
    expect(hangmanLogic.update(s, "not-a-move", 0)).toBeNull();
  });

  it("viewAs during setup only marks the host as the word picker", () => {
    const s = hangmanLogic.start(3);
    const host = hangmanLogic.viewAs(s, 0);
    const guest = hangmanLogic.viewAs(s, 1);
    expect(host.phase).toBe("setup");
    expect(host.isWordPicker).toBe(true);
    expect(host.wordPickerIndex).toBeNull();
    expect(host.currentPlayer).toBe(-1);
    expect(host.canGuess).toBe(false);
    expect(guest.isWordPicker).toBe(false);
  });

  it("viewAs during play hides result and word until the game finishes", () => {
    const s = hangmanLogic.start(2);
    const mid = hangmanLogic.update(s, { type: "submitWord", word: "CAT" }, 0)!;
    const afterOne = hangmanLogic.update(mid, { type: "guess", letter: "C" }, 1)!;
    const v = hangmanLogic.viewAs(afterOne, 1);
    expect(v.finished).toBe(false);
    expect(v.result).toBeUndefined();
    expect(v.word).toBeUndefined();
    expect(v.maskedWord).toMatch(/^C/);
  });

  it("rejects letter guesses while still in setup", () => {
    expect(
      hangmanLogic.update(hangmanLogic.start(2), { type: "guess", letter: "A" }, 0),
    ).toBeNull();
  });

  it("rejects useRandomWord from a non-host player", () => {
    const s = hangmanLogic.start(2);
    expect(hangmanLogic.update(s, { type: "useRandomWord" }, 1)).toBeNull();
  });

  it("rejects setup-phase moves after the game has started", () => {
    let s = hangmanLogic.start(2);
    s = hangmanLogic.update(s, { type: "submitWord", word: "CAT" }, 0)!;
    expect(hangmanLogic.update(s, { type: "useRandomWord" }, 0)).toBeNull();
    expect(hangmanLogic.update(s, { type: "submitWord", word: "DOG" }, 0)).toBeNull();
  });

  it("useRandomWord with a category keeps an entry from that category", () => {
    const s = hangmanLogic.start(2);
    const playing = hangmanLogic.update(s, { type: "useRandomWord", category: "animals" }, 0)!;
    expect(playing.category).toBe("animals");
  });

  it("advances to the next guesser after a non-finishing wrong guess", () => {
    const s = hangmanLogic.start(3);
    let state = hangmanLogic.update(s, { type: "submitWord", word: "AAA" }, 0)!;
    const first = state.playerOrder[state.currentTurnIndex];
    const secondIdx = (state.currentTurnIndex + 1) % state.playerOrder.length;
    const second = state.playerOrder[secondIdx];
    state = hangmanLogic.update(state, { type: "guess", letter: "B" }, first)!;
    expect(state.currentTurnIndex).toBe(1);
    expect(hangmanLogic.viewAs(state, first).canGuess).toBe(false);
    expect(hangmanLogic.viewAs(state, second).canGuess).toBe(true);
  });

  it("describeMove covers submitWord, random word with and without category, and invalid payload", () => {
    const setup = hangmanLogic.start(2);
    const playingCustom = hangmanLogic.update(setup, { type: "submitWord", word: "DOG" }, 0)!;
    expect(
      hangmanLogic.describeMove(setup, playingCustom, { type: "submitWord", word: "DOG" }, 0),
    ).toContain("custom word");

    const playingRand = hangmanLogic.update(setup, { type: "useRandomWord" }, 0)!;
    expect(hangmanLogic.describeMove(setup, playingRand, { type: "useRandomWord" }, 0)).toContain(
      "random word",
    );

    const playingAnimals = hangmanLogic.update(
      setup,
      { type: "useRandomWord", category: "animals" },
      0,
    )!;
    expect(
      hangmanLogic.describeMove(
        setup,
        playingAnimals,
        { type: "useRandomWord", category: "animals" },
        0,
      ),
    ).toContain("animals");

    expect(hangmanLogic.describeMove(setup, setup, { not: "a-move" } as unknown, 0)).toContain(
      "invalid",
    );
  });

  it("describeMove for guesses: correct, wrong non-terminal, win, and loss", () => {
    let prev = hangmanLogic.start(2);
    prev = hangmanLogic.update(prev, { type: "submitWord", word: "CAT" }, 0)!;
    let next = hangmanLogic.update(prev, { type: "guess", letter: "B" }, 1)!;
    expect(hangmanLogic.describeMove(prev, next, { type: "guess", letter: "B" }, 1)).toMatch(
      /wrong! \(1\/6\)/,
    );

    prev = next;
    next = hangmanLogic.update(prev, { type: "guess", letter: "C" }, 1)!;
    expect(hangmanLogic.describeMove(prev, next, { type: "guess", letter: "C" }, 1)).toContain(
      "correct!",
    );
    expect(hangmanLogic.describeMove(prev, next, { type: "guess", letter: "C" }, 1)).not.toContain(
      "The word was",
    );

    prev = next;
    prev = hangmanLogic.update(prev, { type: "guess", letter: "A" }, 1)!;
    next = hangmanLogic.update(prev, { type: "guess", letter: "T" }, 1)!;
    expect(hangmanLogic.describeMove(prev, next, { type: "guess", letter: "T" }, 1)).toContain(
      'The word was "CAT"',
    );

    prev = hangmanLogic.start(2);
    prev = hangmanLogic.update(prev, { type: "submitWord", word: "HEY" }, 0)!;
    const wrong = ["B", "C", "D", "F", "G"];
    for (const letter of wrong) {
      prev = hangmanLogic.update(prev, { type: "guess", letter }, 1)!;
    }
    next = hangmanLogic.update(prev, { type: "guess", letter: "J" }, 1)!;
    expect(hangmanLogic.describeMove(prev, next, { type: "guess", letter: "J" }, 1)).toContain(
      "Game over!",
    );
  });

  it("tagView wraps the view with the hangman game key", () => {
    const s = hangmanLogic.start(2);
    const v = hangmanLogic.viewAs(s, 0);
    expect(hangmanLogic.tagView(v)).toEqual({ type: "hangman", view: v });
  });

  it("viewAs treats an empty secret word as unfinished (hangmanResult early exit)", () => {
    const emptyWordPlaying = {
      phase: "playing" as const,
      numPlayers: 2,
      word: "",
      category: "custom" as const,
      guessedLetters: [] as string[],
      playerOrder: [0, 1],
      currentTurnIndex: 0,
      wordPickerIndex: null as number | null,
    };
    const v = hangmanLogic.viewAs(emptyWordPlaying, 0);
    expect(v.wrongGuesses).toBe(0);
    expect(v.finished).toBe(false);
    expect(v.result).toBeUndefined();
    expect(v.maskedWord).toBe("");
  });
});
