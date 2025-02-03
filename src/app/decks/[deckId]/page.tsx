import DeckClient from "./DeckClient";

interface Props {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function DeckPage({ params }: Props) {
  const { deckId } = await params;
  return <DeckClient deckId={deckId} />;
}
