import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wedding of Albin & Stella | You Are Invited",
  description: "Join us in celebrating our special day. View our story, check events, RSVP, and share in our joy.",
  keywords: ["Albin and Stella Wedding", "Wedding Invitation", "Save the Date", "RSVP"],
  authors: [{ name: "Albin & Stella" }],
  openGraph: {
    title: "Wedding of Albin & Stella",
    description: "You are cordially invited to celebrate our wedding.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
