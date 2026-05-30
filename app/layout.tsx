import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hebrew Heroes",
  description: "Learn Hebrew through bite-sized exercises.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
