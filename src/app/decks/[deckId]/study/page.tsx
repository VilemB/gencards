import StudyClient from "./StudyClient";

interface Props {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function StudyPage({ params }: Props) {
  const { deckId } = await params;
  return <StudyClient deckId={deckId} />;
}
