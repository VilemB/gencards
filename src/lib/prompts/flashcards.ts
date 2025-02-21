export interface Card {
  front: string;
  back: string;
}

interface SystemPromptParams {
  mainTopic: string;
  subtopic: string;
  deckChain: string[];
  deckTopics: string[];
  fullPath: string;
  existingCards: Card[];
  format: "simple" | "complex" | "detailed" | "basic";
}

interface TemplateConfig {
  format: string;
  example: string;
  avoid: string;
  contextRules?: string[];
}

// Base templates with stronger typing and context rules
const SUBJECT_TEMPLATES: Record<string, TemplateConfig> = {
  language: {
    format: "Front: Word/phrase\nBack: Translation (pronunciation)",
    example:
      '{"front": "먹었어", "back": "ate (meogeosseo) - past tense of 먹다 (to eat)"}',
    avoid: "NO grammar explanations",
    contextRules: [
      "Must follow language-specific grammar rules",
      "Must match the specified tense/form if given",
      "Include pronunciation in parentheses",
    ],
  },
  science: {
    format: "Front: Instance\nBack: Key properties",
    example: '{"front": "Fe", "back": "Iron - Used in hemoglobin"}',
    avoid: "NO general definitions",
    contextRules: [
      "Must be a specific example",
      "Include practical application",
    ],
  },
  mathematics: {
    format: "Front: Problem\nBack: Solution",
    example: '{"front": "2x + 5 = 15", "back": "x = 5"}',
    avoid: "NO concept explanations",
    contextRules: [
      "Must show complete solution",
      "Follow mathematical notation",
    ],
  },
  history: {
    format: "Front: Event\nBack: Significance",
    example: '{"front": "Battle of Hastings 1066", "back": "Norman Conquest"}',
    avoid: "NO general descriptions",
    contextRules: ["Include specific dates", "Focus on historical impact"],
  },
  general: {
    format: "Front: Example\nBack: Details",
    example:
      '{"front": "German Shepherd", "back": "Working dog breed, loyal, police work"}',
    avoid: "NO category descriptions",
    contextRules: [
      "Must be specific instances",
      "Include distinguishing features",
    ],
  },
};

function detectSubjectType(topic: string): keyof typeof SUBJECT_TEMPLATES {
  const topic_lower = topic.toLowerCase();

  // Enhanced pattern matching with common variations
  const patterns = {
    language: [
      "language",
      "italian",
      "korean",
      "spanish",
      "english",
      "japanese",
      "french",
      "german",
      "vocab",
      "phrase",
      "grammar",
      "말하기",
      "単語",
      "词",
    ],
    science: [
      "physics",
      "chemistry",
      "biology",
      "science",
      "element",
      "compound",
      "species",
      "atom",
      "molecule",
      "cell",
    ],
    mathematics: [
      "math",
      "algebra",
      "calculus",
      "geometry",
      "equation",
      "number",
      "theorem",
      "formula",
      "function",
    ],
    history: [
      "history",
      "civilization",
      "empire",
      "dynasty",
      "war",
      "period",
      "century",
      "era",
      "revolution",
      "movement",
    ],
  };

  for (const [subject, keywords] of Object.entries(patterns)) {
    if (keywords.some((k) => topic_lower.includes(k))) {
      return subject as keyof typeof SUBJECT_TEMPLATES;
    }
  }
  return "general";
}

function buildContextualConstraints(
  deckChain: string[],
  deckTopics: string[],
  fullPath: string
): string {
  if (deckChain.length === 0) return "";

  const contextHierarchy = deckTopics
    .map((topic, i) => {
      const prefix =
        i === 0
          ? "Root"
          : i === deckTopics.length - 1
          ? "Current"
          : `Level ${i + 1}`;
      const role =
        i === 0
          ? "Defines overall domain"
          : i === deckTopics.length - 1
          ? "Specific focus"
          : "Refines context";
      return `${prefix}: ${topic} (${deckChain[i]}) - ${role}`;
    })
    .join("\n");

  const currentContext = deckChain[deckChain.length - 1];
  const parentContext = deckChain[deckChain.length - 2];

  const rules = [
    `• Every card MUST contain content specifically for: ${currentContext}`,
    parentContext
      ? `• Content must be valid within parent category: ${parentContext}`
      : "",
    `• Follow complete hierarchy: ${fullPath}`,
    "• NO content from outside this hierarchy",
    "• NO generic content - everything must be specific to this context",
    "• Each card must demonstrate clear relationship to ALL parent categories",
  ].filter(Boolean);

  return `Context Hierarchy:
${contextHierarchy}

Strict Context Rules:
${rules.join("\n")}`;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  // For very different length strings, return low similarity
  if (Math.max(s1.length, s2.length) > 2 * Math.min(s1.length, s2.length)) {
    return 0;
  }

  // Calculate Levenshtein distance
  const m = s1.length;
  const n = s2.length;
  const d: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  // Convert distance to similarity score (0 to 1)
  return 1 - d[m][n] / Math.max(m, n);
}

export function isDuplicate(
  newCard: Card,
  existingCards: Card[]
): { isDuplicate: boolean; similarCard?: Card; similarity?: number } {
  const SIMILARITY_THRESHOLD = 0.9; // Increased from 0.8 to 0.9 for stricter matching

  // Normalize the new card text
  const normalizedNewFront = normalizeText(newCard.front);
  if (normalizedNewFront.length < 2) return { isDuplicate: false };

  for (const existingCard of existingCards) {
    const normalizedExistingFront = normalizeText(existingCard.front);
    if (normalizedExistingFront.length < 2) continue;

    // Check exact matches first (faster)
    if (normalizedNewFront === normalizedExistingFront) {
      return { isDuplicate: true, similarCard: existingCard, similarity: 1 };
    }

    // For very different length strings, skip similarity check
    if (
      Math.max(normalizedNewFront.length, normalizedExistingFront.length) >
      2 * Math.min(normalizedNewFront.length, normalizedExistingFront.length)
    ) {
      continue;
    }

    // Check for high similarity
    const similarity = calculateSimilarity(
      normalizedNewFront,
      normalizedExistingFront
    );
    if (similarity > SIMILARITY_THRESHOLD) {
      return { isDuplicate: true, similarCard: existingCard, similarity };
    }

    // For language cards, check stem similarity
    if (newCard.front.match(/[가-힣]/) && existingCard.front.match(/[가-힣]/)) {
      const newStem = newCard.front.replace(
        /[았었겠]어요?$|[ㄴ는]다$|기$|[을를이가]$/g,
        ""
      );
      const existingStem = existingCard.front.replace(
        /[았었겠]어요?$|[ㄴ는]다$|기$|[을를이가]$/g,
        ""
      );

      // Only consider stems of sufficient length
      if (
        newStem.length > 1 &&
        existingStem.length > 1 &&
        newStem === existingStem
      ) {
        return {
          isDuplicate: true,
          similarCard: existingCard,
          similarity: 0.95,
        };
      }
    }
  }

  return { isDuplicate: false };
}

function analyzeCardPatterns(cards: Card[]): string {
  // For small decks, just show the first few cards
  if (cards.length <= 5) {
    return cards.map((card) => `• Similar to: ${card.front}`).join("\n");
  }

  // For language cards, analyze common patterns
  const fronts = cards.map((card) => card.front);
  if (fronts.some((f) => /[가-힣]/.test(f))) {
    // Korean text detection
    const commonEndings = extractCommonPatterns(
      fronts,
      /[았었겠]어요?$|[ㄴ는]다$|기$|[을를이가]$/g
    );
    const commonStems = extractCommonPatterns(fronts, /[가-힣]+/g);

    return `• Common endings: ${commonEndings.slice(0, 5).join(", ")}
• Common stems: ${commonStems.slice(0, 5).join(", ")}
• Total unique patterns: ${commonStems.length}`;
  }

  // For other types, extract common words or numbers
  const words = fronts.join(" ").match(/\b\w+\b/g) || [];
  const commonWords = [...new Set(words)]
    .filter((w) => words.filter((x) => x === w).length > 1)
    .slice(0, 5);

  return `• Common elements: ${commonWords.join(", ")}
• Total cards: ${cards.length}
• Generate content different from these patterns`;
}

function extractCommonPatterns(strings: string[], regex: RegExp): string[] {
  const patterns = new Set<string>();
  strings.forEach((str) => {
    const matches = str.match(regex);
    if (matches) matches.forEach((m) => patterns.add(m));
  });
  return Array.from(patterns);
}

export function getSystemPrompt({
  mainTopic,
  subtopic,
  deckChain,
  deckTopics,
  fullPath,
  existingCards,
  format,
}: SystemPromptParams): string {
  const subjectType = detectSubjectType(mainTopic);
  const template = SUBJECT_TEMPLATES[subjectType];
  const isDetailedFormat = format === "complex" || format === "detailed";
  const contextConstraints = buildContextualConstraints(
    deckChain,
    deckTopics,
    fullPath
  );
  const existingCardsWarning = buildExistingCardsWarning(existingCards);

  // Add specific constraints based on the context hierarchy
  const specificConstraints = [];

  // Korean language constraints
  if (deckTopics.includes("Korean")) {
    specificConstraints.push(
      "• All cards MUST contain Korean text",
      "• Include both Hangul and romanization",
      "• Focus on practical usage examples"
    );

    // Food category constraints
    if (deckTopics.includes("Food")) {
      specificConstraints.push(
        "• Content MUST be about Korean food",
        "• Include Korean food items, dishes, or eating-related terms",
        "• NO non-food vocabulary or general Korean terms",
        "• Each term must be commonly used in food/dining contexts"
      );

      // Food-related slang constraints
      if (subtopic.toLowerCase().includes("slang")) {
        specificConstraints.push(
          "• Only include Korean food-related slang/casual expressions",
          "• Terms must be used specifically in eating/dining situations",
          "• Each expression must relate to food, eating, or dining",
          "• Include usage context in parentheses",
          "• NO general Korean slang unrelated to food"
        );
      }
    }

    // Nouns category constraints
    if (deckTopics.includes("Nouns")) {
      specificConstraints.push(
        "• All terms must be Korean nouns",
        "• Include particle usage examples",
        "• NO verbs, adjectives, or other parts of speech"
      );
    }
  }

  const prompt = `Expert ${mainTopic} Flashcard Generator
Topic: ${subtopic}
Full Context Path: ${fullPath}

${contextConstraints}

${
  specificConstraints.length > 0
    ? `Category-Specific Requirements:
${specificConstraints.join("\n")}\n`
    : ""
}

${existingCardsWarning}

Format Requirements:
${template.format}
Example: ${template.example}
${template.avoid}
${template.contextRules?.map((rule) => `• ${rule}`).join("\n") || ""}

Critical Requirements:
• EVERY card must follow the complete context hierarchy
• Content must be specific to ${deckChain[deckChain.length - 1]}
• ${
    isDetailedFormat
      ? "Include detailed context and usage examples"
      : "Keep responses focused and practical"
  }
• Generate unique, context-appropriate content
• Follow ALL category-specific requirements
• NO generic or out-of-context content

Response format: {"flashcards":[{"front":"","back":""}]}`;

  return prompt;
}

function buildExistingCardsWarning(cards: Card[]): string {
  if (cards.length === 0) return "";

  // Show just 3 complete examples for format reference
  const fullExamples = cards
    .slice(0, 3)
    .map((card) => `• "${card.front}" → "${card.back}"`)
    .join("\n");

  // Extract patterns and common elements instead of listing all cards
  const patterns = analyzeCardPatterns(cards);

  return `
⚠️ IMPORTANT - GENERATE UNIQUE CONTENT (${cards.length} existing cards):

Format examples:
${fullExamples}

Patterns to avoid:
${patterns}

STRICT UNIQUENESS REQUIREMENTS:
• No exact matches with existing cards
• No similar variations (${Math.floor(0.8 * 100)}% similarity threshold)
• For language cards: No same word stems with different endings
• For math: No equivalent expressions (e.g., 2+3 vs 3+2)
• For science: No synonymous terms

Any duplicates or similar content will be rejected.`;
}
