import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Wedding of Albin & Stella | You Are Invited",
  description: "Join us in celebrating our special day. View our story, check events, RSVP, and share in our joy.",
  keywords: ["Albin and Stella Wedding", "Wedding Invitation", "Save the Date", "RSVP", "Digital Wedding Card"],
  authors: [{ name: "Albin & Stella" }],
  openGraph: {
    title: "Wedding of Albin & Stella",
    description: "You are cordially invited to celebrate our wedding. Open the letter to reveal details.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${montserrat.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground transition-colors duration-500">
        {children}
      </body>
    </html>
  );
}
