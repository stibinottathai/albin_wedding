import { LanguageProvider } from "../context/LanguageContext";
import InvitationMain from "../components/InvitationMain";
import type { Metadata } from "next";
import { getWeddingInfo } from "../lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const weddingInfo = await getWeddingInfo();
  const groom = weddingInfo?.groomName || "Albin";
  const bride = weddingInfo?.brideName || "Stella";
  const title = `Wedding of ${groom} & ${bride} | You Are Invited`;
  const description = weddingInfo?.tagline || "Join us in celebrating our special day. View our story, check events, RSVP, and share in our joy.";
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function Home() {
  const weddingInfo = await getWeddingInfo();
  return (
    <LanguageProvider>
      <InvitationMain guest={null} initialWeddingInfo={weddingInfo} />
    </LanguageProvider>
  );
}
