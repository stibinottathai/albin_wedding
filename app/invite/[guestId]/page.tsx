import { LanguageProvider } from "../../../context/LanguageContext";
import InvitationMain from "../../../components/InvitationMain";
import { getGuest } from "../../../lib/db";
import { notFound } from "next/navigation";

interface InvitePageProps {
  params: Promise<{
    guestId: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  // Await params as required by Next.js 15+
  const { guestId } = await params;
  
  // Load guest data
  const guest = await getGuest(guestId);

  // If no guest matches this ID, render the Next.js not-found page
  if (!guest) {
    notFound();
  }

  return (
    <LanguageProvider>
      <InvitationMain guest={guest} />
    </LanguageProvider>
  );
}
