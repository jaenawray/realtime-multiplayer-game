import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { createAndLoadGame } from "./testUtils.ts";

/** Narrow queries to the game panel only */
function gameFrame(page: Page) {
  return page.locator(".gameFrame");
}

let userContext1: BrowserContext;
let userContext2: BrowserContext;
let page1: Page;
let page2: Page;

test.beforeEach(async ({ browser }) => {
  userContext1 = await browser.newContext();
  userContext2 = await browser.newContext();
  page1 = await userContext1.newPage();
  page2 = await userContext2.newPage();
});

test.afterEach(async () => {
  await userContext1.close();
  await userContext2.close();
});

test.describe("The game selection infrastructure", () => {
  test("should support creating a new Hangman game and having a second user join it", async () => {
    await createAndLoadGame(page1, page2, "hangman", false, true);
  });
});

test.describe("The game of Hangman", () => {
  test.beforeEach(async () => {
    await createAndLoadGame(page1, page2, "hangman", false, false);
    await expect(
      gameFrame(page1).getByRole("heading", { name: "Hangman - Word Picker" }),
    ).toBeVisible();
  });

  test("should show the word picker setup to host and a waiting state to the guest", async () => {
    await expect(
      gameFrame(page1).getByRole("heading", { name: "Hangman - Word Picker" }),
    ).toBeVisible();
    await expect(gameFrame(page1).getByRole("button", { name: "Use This Word" })).toBeVisible();
    await expect(gameFrame(page1).getByRole("button", { name: "Use Random Word" })).toBeVisible();

    await expect(gameFrame(page2).getByRole("heading", { name: "Hangman" })).toBeVisible();
    await expect(gameFrame(page2).getByText(/Waiting for .+ to choose a word/)).toBeVisible();
  });

  test("should reject a custom word shorter than three letters on the picker UI", async () => {
    await gameFrame(page1).getByPlaceholder("Enter a word (3-20 letters)").fill("NO");
    await gameFrame(page1).getByRole("button", { name: "Use This Word" }).click();
    await expect(gameFrame(page1).getByText("Word must be at least 3 letters")).toBeVisible();
    await expect(gameFrame(page2).getByText(/Waiting for/)).toBeVisible();
  });

  test("should complete a custom word game with the guesser winning", async () => {
    await gameFrame(page1).getByPlaceholder("Enter a word (3-20 letters)").fill("CAT");
    await gameFrame(page1).getByRole("button", { name: "Use This Word" }).click();

    await expect(
      gameFrame(page1).getByText(/You picked the word! Watch as others try to guess it/),
    ).toBeVisible();
    await expect(gameFrame(page1).getByPlaceholder("Enter a letter")).toHaveCount(0);

    await expect(gameFrame(page2).getByText("Wrong guesses:")).toBeVisible();
    await expect(gameFrame(page2).getByText("___")).toBeVisible();

    for (const letter of ["C", "A", "T"]) {
      await gameFrame(page2).getByPlaceholder("Enter a letter").fill(letter);
      await gameFrame(page2).getByRole("button", { name: "Guess" }).click();
    }

    await expect(gameFrame(page1).getByText(/Guessed! The word was/)).toBeVisible();
    await expect(gameFrame(page1).getByText('"CAT"')).toBeVisible();
    await expect(gameFrame(page2).getByText(/You won!/)).toBeVisible();
    await expect(gameFrame(page2).getByText('"CAT"')).toBeVisible();
  });

  test("should end in a loss after six wrong guesses", async () => {
    await gameFrame(page1).getByPlaceholder("Enter a word (3-20 letters)").fill("HEY");
    await gameFrame(page1).getByRole("button", { name: "Use This Word" }).click();

    const wrongLetters = ["B", "C", "D", "F", "G", "J"];
    for (const letter of wrongLetters) {
      await gameFrame(page2).getByPlaceholder("Enter a letter").fill(letter);
      await gameFrame(page2).getByRole("button", { name: "Guess" }).click();
    }

    await expect(gameFrame(page2).getByText(/Game over!/)).toBeVisible();
    await expect(gameFrame(page2).getByText('"HEY"')).toBeVisible();
    await expect(gameFrame(page1).getByText(/Game over!/)).toBeVisible();
    await expect(gameFrame(page1).getByText('"HEY"')).toBeVisible();
  });

  test("should enter playing phase with a random word and alternate turns between two players", async () => {
    await gameFrame(page1).getByRole("button", { name: "Use Random Word" }).click();

    await expect(gameFrame(page1).getByText("Category:")).toBeVisible();
    await expect(gameFrame(page2).getByText("Category:")).toBeVisible();
    await expect(gameFrame(page1).getByText(/Wrong guesses:/)).toBeVisible();
    await expect(gameFrame(page2).getByText(/Wrong guesses:/)).toBeVisible();

    const guessBtn1 = gameFrame(page1).getByRole("button", { name: "Guess" });
    const guessBtn2 = gameFrame(page2).getByRole("button", { name: "Guess" });
    await expect
      .poll(async () => (await guessBtn1.isVisible()) || (await guessBtn2.isVisible()), {
        timeout: 15_000,
      })
      .toBe(true);

    if (await guessBtn1.isVisible()) {
      await gameFrame(page1).getByPlaceholder("Enter a letter").fill("X");
      await guessBtn1.click();
      await expect(guessBtn2).toBeVisible();
    } else {
      await gameFrame(page2).getByPlaceholder("Enter a letter").fill("X");
      await guessBtn2.click();
      await expect(guessBtn1).toBeVisible();
    }
  });
});
