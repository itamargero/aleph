import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hebrew Heroes",
  description: "Listen, match pictures, and learn Hebrew through an offline adventure.",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he">
      <body>{children}</body>
    </html>
  );
}
