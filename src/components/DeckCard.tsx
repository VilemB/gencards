import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Book, Edit, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Deck } from "@/types/deck";

interface DeckCardProps {
  deck: Deck;
  onDelete?: () => void;
  showActions?: boolean;
}

export function DeckCard({ deck, showActions = true }: DeckCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isOwner = session?.user?.id === deck.userId;

  return (
    <div
      className="group relative bg-[var(--neutral-50)] rounded-xl p-4 hover:bg-[var(--neutral-100)] transition-all duration-200 cursor-pointer"
      onClick={() => router.push(`/decks/${deck._id}`)}
    >
      <div className="flex flex-col h-full min-h-[120px]">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-medium text-[var(--text-primary)] line-clamp-1">
              {deck.title}
            </h3>
            {showActions && (
              <div className="flex gap-1 -mt-1 -mr-1">
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/decks/${deck._id}/edit`);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/decks/${deck._id}/study`);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
            {deck.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Book className="h-3.5 w-3.5" />
            <span>{deck.cardCount} cards</span>
            <span>•</span>
            <span className="truncate">{deck.topic}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
