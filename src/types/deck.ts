export interface Card {
  _id: string;
  front: string;
  back: string;
  createdAt: string;
  updatedAt: string;
}

export interface PopulatedDeck {
  _id: string;
  title: string;
  parentDeckId?: PopulatedDeck;
}

export interface Deck {
  _id: string;
  userId: string;
  title: string;
  description: string;
  topic: string;
  isPublic: boolean;
  cardCount: number;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
  parentDeckId?: string | PopulatedDeck;
  path: string;
  level: number;
  hasChildren: boolean;
}
