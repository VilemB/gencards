import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PopulatedDeck } from "@/types/deck";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface DeckBreadcrumbProps {
  deckId: string;
  deckTitle: string;
  currentPage: string;
  parentDeckId?: string | PopulatedDeck;
  className?: string;
}

export function DeckBreadcrumb({
  deckId,
  deckTitle,
  currentPage,
  parentDeckId,
  className,
}: DeckBreadcrumbProps) {
  // Build the breadcrumb chain by following parentDeckId references
  const breadcrumbChain = useMemo(() => {
    const chain: { id: string; title: string }[] = [];
    let currentDeck: PopulatedDeck | undefined =
      typeof parentDeckId === "string" ? undefined : parentDeckId;

    // Add parent decks to the chain
    while (currentDeck) {
      chain.unshift({
        id: currentDeck._id,
        title: currentDeck.title,
      });
      currentDeck = currentDeck.parentDeckId as PopulatedDeck;
    }

    return chain;
  }, [parentDeckId]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap",
        className
      )}
    >
      <Link href="/decks" className="hover:text-foreground transition-colors">
        Decks
      </Link>
      {breadcrumbChain.map((deck) => (
        <div key={deck.id} className="flex items-center gap-2">
          <ArrowRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
          <Link
            href={`/decks/${deck.id}`}
            className="hover:text-foreground transition-colors max-w-[200px] truncate"
          >
            {deck.title}
          </Link>
        </div>
      ))}
      {/* Current deck */}
      <ArrowRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
      <Link
        href={`/decks/${deckId}`}
        className="hover:text-foreground transition-colors max-w-[200px] truncate"
      >
        {deckTitle}
      </Link>
      {currentPage && (
        <>
          <ArrowRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
          <span className="text-foreground truncate">{currentPage}</span>
        </>
      )}
    </div>
  );
}
