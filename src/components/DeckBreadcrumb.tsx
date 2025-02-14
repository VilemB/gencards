import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PopulatedDeck } from "@/types/deck";

interface DeckBreadcrumbProps {
  deckId: string;
  deckTitle: string;
  currentPage: string;
  path?: string;
  parentDeckId?: string | PopulatedDeck;
}

export function DeckBreadcrumb({
  deckId,
  deckTitle,
  currentPage,
}: DeckBreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4">
      <Link
        href="/decks"
        className="hover:text-[var(--neutral-300)] transition-colors"
      >
        Decks
      </Link>
      <ArrowRight className="h-3 w-3" />
      <Link
        href={`/decks/${deckId}`}
        className="hover:text-[var(--neutral-300)] transition-colors"
      >
        {deckTitle}
      </Link>
      {currentPage && (
        <>
          <ArrowRight className="h-3 w-3" />
          <span>{currentPage}</span>
        </>
      )}
    </div>
  );
}
