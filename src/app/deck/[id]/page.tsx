import { DeckStudyPage } from "@/components/DeckStudyPage";
import { decks } from "@/lib/mockData";

interface DeckPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return decks.map((deck) => ({ id: deck.id }));
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { id } = await params;
  return <DeckStudyPage deckId={id} />;
}
