import { LanguageProvider } from "../../../context/LanguageContext";
import InvitationMain from "../../../components/InvitationMain";
import { getGuest, getWeddingInfo } from "../../../lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface InvitePageProps {
  params: Promise<{
    guestId: string;
  }>;
}

// Generate dynamic metadata for WhatsApp/Social Media link previews
export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { guestId } = await params;
  const guest = await getGuest(guestId);
  const weddingInfo = await getWeddingInfo();

  if (!guest) {
    return {
      title: "Wedding Invitation",
    };
  }

  const groom = weddingInfo?.groomName || "Albin";
  const bride = weddingInfo?.brideName || "Stella";
  const title = `Wedding Invitation | ${groom} & ${bride}`;
  const description = `Dearest ${guest.greeting}, you are cordially invited to celebrate the marriage of ${groom} and ${bride}. Click to view details and RSVP.`;
  
  // High-resolution premium cover photo for the preview card
  const imageUrl = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${groom} & ${bride} Wedding Invitation`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
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
