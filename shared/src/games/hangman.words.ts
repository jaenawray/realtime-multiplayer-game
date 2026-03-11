/**
 * Hangman Word Bank
 * ~250 words organized by category with auto-calculated difficulty
 */

/**
 * Available word categories for Hangman
 */
export type HangmanCategory =
  | "programming"
  | "animals"
  | "countries"
  | "movies"
  | "sports"
  | "food"
  | "science"
  | "music";

/**
 * Difficulty levels based on word length
 * - easy: 4-5 letters
 * - medium: 6-8 letters
 * - hard: 9+ letters
 */
export type HangmanDifficulty = "easy" | "medium" | "hard";

/**
 * Category display configuration
 */
export const categoryConfig: Record<HangmanCategory, { displayName: string; icon: string }> = {
  programming: { displayName: "Programming", icon: "💻" },
  animals: { displayName: "Animals", icon: "🐾" },
  countries: { displayName: "Countries", icon: "🌍" },
  movies: { displayName: "Movies", icon: "🎬" },
  sports: { displayName: "Sports", icon: "⚽" },
  food: { displayName: "Food & Drink", icon: "🍕" },
  science: { displayName: "Science", icon: "🔬" },
  music: { displayName: "Music", icon: "🎵" },
};

/**
 * Word entry with category metadata
 */
export interface WordEntry {
  word: string;
  category: HangmanCategory;
}

/**
 * Calculate difficulty based on word length
 */
export function getDifficulty(word: string): HangmanDifficulty {
  if (word.length <= 5) return "easy";
  if (word.length <= 8) return "medium";
  return "hard";
}

/**
 * Master word list (~250 words)
 * All words are uppercase, A-Z only
 */
export const HANGMAN_WORDS: WordEntry[] = [
  // ============================================
  // PROGRAMMING (~35 words)
  // ============================================
  // Easy (4-5 letters)
  { word: "CODE", category: "programming" },
  { word: "JAVA", category: "programming" },
  { word: "NODE", category: "programming" },
  { word: "RUBY", category: "programming" },
  { word: "BASH", category: "programming" },
  { word: "HTML", category: "programming" },
  { word: "LOOP", category: "programming" },
  { word: "ARRAY", category: "programming" },
  { word: "CLASS", category: "programming" },
  // Medium (6-8 letters)
  { word: "PYTHON", category: "programming" },
  { word: "GITHUB", category: "programming" },
  { word: "REACT", category: "programming" },
  { word: "DOCKER", category: "programming" },
  { word: "SERVER", category: "programming" },
  { word: "CLIENT", category: "programming" },
  { word: "OBJECT", category: "programming" },
  { word: "STRING", category: "programming" },
  { word: "BOOLEAN", category: "programming" },
  { word: "FUNCTION", category: "programming" },
  { word: "VARIABLE", category: "programming" },
  { word: "DATABASE", category: "programming" },
  { word: "FRONTEND", category: "programming" },
  { word: "BACKEND", category: "programming" },
  // Hard (9+ letters)
  { word: "JAVASCRIPT", category: "programming" },
  { word: "TYPESCRIPT", category: "programming" },
  { word: "ALGORITHM", category: "programming" },
  { word: "COMPONENT", category: "programming" },
  { word: "INTERFACE", category: "programming" },
  { word: "RECURSION", category: "programming" },
  { word: "FRAMEWORK", category: "programming" },
  { word: "DEBUGGING", category: "programming" },
  { word: "DEPLOYMENT", category: "programming" },
  { word: "REPOSITORY", category: "programming" },
  { word: "MIDDLEWARE", category: "programming" },

  // ============================================
  // ANIMALS (~35 words)
  // ============================================
  // Easy
  { word: "CAT", category: "animals" },
  { word: "DOG", category: "animals" },
  { word: "BEAR", category: "animals" },
  { word: "LION", category: "animals" },
  { word: "WOLF", category: "animals" },
  { word: "DEER", category: "animals" },
  { word: "FROG", category: "animals" },
  { word: "DUCK", category: "animals" },
  { word: "FISH", category: "animals" },
  { word: "BIRD", category: "animals" },
  { word: "EAGLE", category: "animals" },
  { word: "SHARK", category: "animals" },
  { word: "SNAKE", category: "animals" },
  // Medium
  { word: "TIGER", category: "animals" },
  { word: "ZEBRA", category: "animals" },
  { word: "HORSE", category: "animals" },
  { word: "MONKEY", category: "animals" },
  { word: "RABBIT", category: "animals" },
  { word: "TURTLE", category: "animals" },
  { word: "DOLPHIN", category: "animals" },
  { word: "PENGUIN", category: "animals" },
  { word: "GIRAFFE", category: "animals" },
  { word: "GORILLA", category: "animals" },
  { word: "PANTHER", category: "animals" },
  { word: "CHEETAH", category: "animals" },
  // Hard
  { word: "ELEPHANT", category: "animals" },
  { word: "KANGAROO", category: "animals" },
  { word: "CROCODILE", category: "animals" },
  { word: "ALLIGATOR", category: "animals" },
  { word: "BUTTERFLY", category: "animals" },
  { word: "ORANGUTAN", category: "animals" },
  { word: "PORCUPINE", category: "animals" },
  { word: "ARMADILLO", category: "animals" },
  { word: "CHAMELEON", category: "animals" },

  // ============================================
  // COUNTRIES (~30 words)
  // ============================================
  // Easy
  { word: "PERU", category: "countries" },
  { word: "CUBA", category: "countries" },
  { word: "IRAN", category: "countries" },
  { word: "IRAQ", category: "countries" },
  { word: "CHILE", category: "countries" },
  { word: "CHINA", category: "countries" },
  { word: "EGYPT", category: "countries" },
  { word: "INDIA", category: "countries" },
  { word: "ITALY", category: "countries" },
  { word: "JAPAN", category: "countries" },
  { word: "KENYA", category: "countries" },
  { word: "KOREA", category: "countries" },
  { word: "SPAIN", category: "countries" },
  // Medium
  { word: "BRAZIL", category: "countries" },
  { word: "CANADA", category: "countries" },
  { word: "FRANCE", category: "countries" },
  { word: "GERMANY", category: "countries" },
  { word: "GREECE", category: "countries" },
  { word: "MEXICO", category: "countries" },
  { word: "NORWAY", category: "countries" },
  { word: "POLAND", category: "countries" },
  { word: "RUSSIA", category: "countries" },
  { word: "SWEDEN", category: "countries" },
  { word: "TURKEY", category: "countries" },
  // Hard
  { word: "ARGENTINA", category: "countries" },
  { word: "AUSTRALIA", category: "countries" },
  { word: "INDONESIA", category: "countries" },
  { word: "SINGAPORE", category: "countries" },
  { word: "PORTUGAL", category: "countries" },
  { word: "SWITZERLAND", category: "countries" },

  // ============================================
  // MOVIES (~30 words)
  // ============================================
  // Easy
  { word: "JAWS", category: "movies" },
  { word: "DUNE", category: "movies" },
  { word: "ALIEN", category: "movies" },
  { word: "ROCKY", category: "movies" },
  { word: "SHREK", category: "movies" },
  { word: "JOKER", category: "movies" },
  // Medium
  { word: "AVATAR", category: "movies" },
  { word: "BATMAN", category: "movies" },
  { word: "FROZEN", category: "movies" },
  { word: "MATRIX", category: "movies" },
  { word: "PSYCHO", category: "movies" },
  { word: "SCREAM", category: "movies" },
  { word: "GREASE", category: "movies" },
  { word: "TROLLS", category: "movies" },
  { word: "WONDER", category: "movies" },
  { word: "MULAN", category: "movies" },
  { word: "COCO", category: "movies" },
  // Hard
  { word: "GLADIATOR", category: "movies" },
  { word: "INCEPTION", category: "movies" },
  { word: "SUPERBAD", category: "movies" },
  { word: "SPIDERMAN", category: "movies" },
  { word: "MOONLIGHT", category: "movies" },
  { word: "RATATOUILLE", category: "movies" },
  { word: "INTERSTELLAR", category: "movies" },
  { word: "BRAVEHEART", category: "movies" },
  { word: "GODFATHER", category: "movies" },
  { word: "CASABLANCA", category: "movies" },
  { word: "GOODFELLAS", category: "movies" },
  { word: "WHIPLASH", category: "movies" },

  // ============================================
  // SPORTS (~30 words)
  // ============================================
  // Easy
  { word: "GOLF", category: "sports" },
  { word: "SURF", category: "sports" },
  { word: "SWIM", category: "sports" },
  { word: "YOGA", category: "sports" },
  { word: "BALL", category: "sports" },
  { word: "GOAL", category: "sports" },
  { word: "RACE", category: "sports" },
  { word: "TEAM", category: "sports" },
  // Medium
  { word: "BOXING", category: "sports" },
  { word: "SOCCER", category: "sports" },
  { word: "TENNIS", category: "sports" },
  { word: "HOCKEY", category: "sports" },
  { word: "ROWING", category: "sports" },
  { word: "DIVING", category: "sports" },
  { word: "SKIING", category: "sports" },
  { word: "KARATE", category: "sports" },
  { word: "CRICKET", category: "sports" },
  { word: "CYCLING", category: "sports" },
  { word: "ARCHERY", category: "sports" },
  { word: "FENCING", category: "sports" },
  // Hard
  { word: "BASEBALL", category: "sports" },
  { word: "BASKETBALL", category: "sports" },
  { word: "FOOTBALL", category: "sports" },
  { word: "VOLLEYBALL", category: "sports" },
  { word: "BADMINTON", category: "sports" },
  { word: "GYMNASTICS", category: "sports" },
  { word: "WRESTLING", category: "sports" },
  { word: "SNOWBOARD", category: "sports" },
  { word: "TRIATHLON", category: "sports" },
  { word: "MARATHON", category: "sports" },

  // ============================================
  // FOOD & DRINK (~30 words)
  // ============================================
  // Easy
  { word: "RICE", category: "food" },
  { word: "BEEF", category: "food" },
  { word: "PORK", category: "food" },
  { word: "CAKE", category: "food" },
  { word: "SOUP", category: "food" },
  { word: "TACO", category: "food" },
  { word: "SUSHI", category: "food" },
  { word: "PIZZA", category: "food" },
  { word: "PASTA", category: "food" },
  { word: "BREAD", category: "food" },
  { word: "SALAD", category: "food" },
  // Medium
  { word: "BURGER", category: "food" },
  { word: "CHEESE", category: "food" },
  { word: "COFFEE", category: "food" },
  { word: "COOKIE", category: "food" },
  { word: "SALMON", category: "food" },
  { word: "WAFFLE", category: "food" },
  { word: "YOGURT", category: "food" },
  { word: "NOODLES", category: "food" },
  { word: "BURRITO", category: "food" },
  { word: "PANCAKE", category: "food" },
  // Hard
  { word: "CHOCOLATE", category: "food" },
  { word: "CROISSANT", category: "food" },
  { word: "ENCHILADA", category: "food" },
  { word: "SPAGHETTI", category: "food" },
  { word: "HAMBURGER", category: "food" },
  { word: "CHEESECAKE", category: "food" },
  { word: "MILKSHAKE", category: "food" },
  { word: "GUACAMOLE", category: "food" },
  { word: "PEPPERONI", category: "food" },

  // ============================================
  // SCIENCE (~30 words)
  // ============================================
  // Easy
  { word: "ATOM", category: "science" },
  { word: "CELL", category: "science" },
  { word: "GENE", category: "science" },
  { word: "MASS", category: "science" },
  { word: "WAVE", category: "science" },
  { word: "ACID", category: "science" },
  { word: "ORBIT", category: "science" },
  { word: "FORCE", category: "science" },
  { word: "LIGHT", category: "science" },
  // Medium
  { word: "ENERGY", category: "science" },
  { word: "PLANET", category: "science" },
  { word: "PROTON", category: "science" },
  { word: "NEURON", category: "science" },
  { word: "CARBON", category: "science" },
  { word: "OXYGEN", category: "science" },
  { word: "GALAXY", category: "science" },
  { word: "PLASMA", category: "science" },
  { word: "THEORY", category: "science" },
  { word: "NUCLEUS", category: "science" },
  { word: "ELEMENT", category: "science" },
  // Hard
  { word: "ELECTRON", category: "science" },
  { word: "MOLECULE", category: "science" },
  { word: "BACTERIA", category: "science" },
  { word: "CHROMOSOME", category: "science" },
  { word: "EVOLUTION", category: "science" },
  { word: "RADIATION", category: "science" },
  { word: "MAGNETISM", category: "science" },
  { word: "ASTRONOMY", category: "science" },
  { word: "CHEMISTRY", category: "science" },
  { word: "PHOTOSYNTHESIS", category: "science" },

  // ============================================
  // MUSIC (~30 words)
  // ============================================
  // Easy
  { word: "BAND", category: "music" },
  { word: "BASS", category: "music" },
  { word: "BEAT", category: "music" },
  { word: "DRUM", category: "music" },
  { word: "JAZZ", category: "music" },
  { word: "NOTE", category: "music" },
  { word: "ROCK", category: "music" },
  { word: "SONG", category: "music" },
  { word: "TUNE", category: "music" },
  { word: "CHOIR", category: "music" },
  { word: "CHORD", category: "music" },
  { word: "FLUTE", category: "music" },
  { word: "PIANO", category: "music" },
  // Medium
  { word: "ALBUM", category: "music" },
  { word: "GUITAR", category: "music" },
  { word: "VIOLIN", category: "music" },
  { word: "MELODY", category: "music" },
  { word: "RHYTHM", category: "music" },
  { word: "SINGER", category: "music" },
  { word: "CONCERT", category: "music" },
  { word: "TRUMPET", category: "music" },
  { word: "HARMONY", category: "music" },
  // Hard
  { word: "ORCHESTRA", category: "music" },
  { word: "SAXOPHONE", category: "music" },
  { word: "SYMPHONY", category: "music" },
  { word: "COMPOSER", category: "music" },
  { word: "ACOUSTIC", category: "music" },
  { word: "CLASSICAL", category: "music" },
  { word: "MICROPHONE", category: "music" },
  { word: "PERCUSSION", category: "music" },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all words in a specific category
 */
export function getWordsByCategory(category: HangmanCategory): WordEntry[] {
  return HANGMAN_WORDS.filter((w) => w.category === category);
}

/**
 * Get all words of a specific difficulty
 */
export function getWordsByDifficulty(difficulty: HangmanDifficulty): WordEntry[] {
  return HANGMAN_WORDS.filter((w) => getDifficulty(w.word) === difficulty);
}

/**
 * Get words filtered by both category and difficulty
 */
export function getWordsFiltered(
  category?: HangmanCategory,
  difficulty?: HangmanDifficulty,
): WordEntry[] {
  let filtered = HANGMAN_WORDS;
  if (category) {
    filtered = filtered.filter((w) => w.category === category);
  }
  if (difficulty) {
    filtered = filtered.filter((w) => getDifficulty(w.word) === difficulty);
  }
  return filtered;
}

/**
 * Get a random word, optionally filtered by category and/or difficulty
 */
export function getRandomWord(
  category?: HangmanCategory,
  difficulty?: HangmanDifficulty,
): WordEntry {
  const filtered = getWordsFiltered(category, difficulty);
  if (filtered.length === 0) {
    // Fallback to any word if no matches
    return HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];
  }
  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Get all available categories
 */
export function getAllCategories(): HangmanCategory[] {
  return Object.keys(categoryConfig) as HangmanCategory[];
}

/**
 * Get word count statistics
 */
export function getWordStats(): {
  total: number;
  byCategory: Record<HangmanCategory, number>;
  byDifficulty: Record<HangmanDifficulty, number>;
} {
  const byCategory = {} as Record<HangmanCategory, number>;
  const byDifficulty: Record<HangmanDifficulty, number> = { easy: 0, medium: 0, hard: 0 };

  for (const category of getAllCategories()) {
    byCategory[category] = 0;
  }

  for (const entry of HANGMAN_WORDS) {
    byCategory[entry.category]++;
    byDifficulty[getDifficulty(entry.word)]++;
  }

  return {
    total: HANGMAN_WORDS.length,
    byCategory,
    byDifficulty,
  };
}
