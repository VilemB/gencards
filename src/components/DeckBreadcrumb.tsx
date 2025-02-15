import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PopulatedDeck } from "@/types/deck";
import { cn } from "@/lib/utils";

interface DeckBreadcrumbProps {
  deckId: string;
  deckTitle: string;
  currentPage: string;
  path?: string;
  parentDeckId?: string | PopulatedDeck;
  className?: string;
}

export function DeckBreadcrumb({
  deckId,
  deckTitle,
  currentPage,
  className,
}: DeckBreadcrumbProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground mb-4",
        className
      )}
    >
      <Link href="/decks" className="hover:text-foreground transition-colors">
        Decks
      </Link>
      <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
      <Link
        href={`/decks/${deckId}`}
        className="hover:text-foreground transition-colors"
      >
        {deckTitle}
      </Link>
      {currentPage && (
        <>
          <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-foreground">{currentPage}</span>
        </>
      )}
    </div>
  );
}
