export const DECK_TOPICS = [
  {
    id: "languages",
    name: "Languages",
    description: "Vocabulary, grammar, and language learning",
  },
  {
    id: "science-math",
    name: "Science & Math",
    description: "Physics, chemistry, mathematics",
  },
  { id: "biology", name: "Biology", description: "Anatomy, genetics, ecology" },
  {
    id: "history",
    name: "History",
    description: "World history, civilizations, events",
  },
  {
    id: "computer-science",
    name: "Computer Science",
    description: "Programming, algorithms, tech concepts",
  },
  {
    id: "arts",
    name: "Arts & Literature",
    description: "Art history, literature, music",
  },
  {
    id: "business",
    name: "Business",
    description: "Economics, management, finance",
  },
  { id: "other", name: "Other", description: "Other topics" },
] as const;

export type DeckTopic = (typeof DECK_TOPICS)[number]["id"];
