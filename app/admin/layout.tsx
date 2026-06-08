import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedding Admin Dashboard",
  description: "Admin panel to manage wedding data, guest lists, and RSVPs.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
