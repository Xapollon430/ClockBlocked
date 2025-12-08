export const STORY_TEXTS = [
  "",
  // // Step 1: Hugo's Problem
  // "In 1830, Victor Hugo was hopelessly behind on his novel. Deadlines loomed, but he kept procrastinating.",
  // // Step 2: The Commitment Device
  // "Desperate, Hugo instructed his servant to lock him in a freezing cold room with no clothes. No way out—if he didn't write, he stayed trapped in the bitter cold.",
  // // Step 3: The Result & Bridge to Product
  // "With real consequences, Hugo finished The Hunchback of Notre Dame ahead of schedule. ClockBlocked brings that same power to your life. Ready to commit?",
];

export const QUESTIONS = [
  {
    text: "Are you a dog person?",
    id: "pets",
  },
  {
    text: "Do you prefer summer over winter?",
    id: "seasons",
  },
  {
    text: "Are you a morning person?",
    id: "morning",
  },
  {
    text: "Do you prefer coffee over tea?",
    id: "drinks",
  },
];

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DAY_ABBREVIATIONS = ["S", "M", "T", "W", "T", "F", "S"];

export const MOTIVATIONAL_PHRASES = [
  "I am unstoppable",
  "I am capable of achieving anything",
  "I am focused and determined",
  "I am ready to conquer today",
  "I am strong and resilient",
  "I am in control of my destiny",
  "I am worthy of success",
  "I am grateful for this new day",
  "I am energized and motivated",
  "I am confident in my abilities",
  "I am committed to my goals",
  "I am making progress every day",
  "I am choosing positivity today",
  "I am powerful beyond measure",
  "I am creating my own opportunities",
  "I am disciplined and focused",
  "I am rising above challenges",
  "I am becoming my best self",
  "I am taking charge of my life",
  "I am worthy of greatness",
  "I am embracing this moment",
  "I am building my future now",
  "I am stronger than my excuses",
  "I am committed to excellence",
  "I am ready to make it happen",
];

/**
 * Get a random motivational phrase for alarm verification
 */
export const getRandomMotivationalPhrase = (): string => {
  return MOTIVATIONAL_PHRASES[
    Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)
  ];
};
