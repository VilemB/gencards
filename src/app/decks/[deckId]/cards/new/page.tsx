import { notFound } from "next/navigation";
import CreateCardsClient from "./CreateCardsClient";
import { getDeck } from "@/lib/api/decks";

interface CreateCardsPageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function CreateCardsPage({
  params,
}: CreateCardsPageProps) {
  const { deckId } = await params;
  const deck = await getDeck(deckId);

  if (!deck) {
    notFound();
  }

  return <CreateCardsClient deckId={deckId} deckTitle={deck.title} />;
}
