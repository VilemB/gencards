import EditDeckClient from "./EditDeckClient";

interface Props {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function EditDeckPage({ params }: Props) {
  const { deckId } = await params;
  return <EditDeckClient deckId={deckId} />;
}
