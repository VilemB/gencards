import Link from "next/link";
import { Layers, ArrowRight } from "lucide-react";

interface DeckBreadcrumbProps {
  deckId: string;
  deckTitle: string;
  currentPage: string;
  path?: string;
  parentDeckId?: string;
}

export function DeckBreadcrumb({
  deckId,
  deckTitle,
  currentPage,
  path,
  parentDeckId,
}: DeckBreadcrumbProps) {
  if (!parentDeckId || !path) {
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

  const pathParts = path.split("/").filter(Boolean);
  if (pathParts.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4">
      <Layers className="h-4 w-4" />
      <span>Part of:</span>
      <div className="flex items-center gap-1">
        {pathParts.map((id, index) => (
          <div key={id} className="flex items-center gap-1">
            {index > 0 && <ArrowRight className="h-3 w-3" />}
            <Link
              href={`/decks/${id}`}
              className="hover:text-[var(--primary)] transition-colors"
            >
              Parent Deck {index + 1}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
