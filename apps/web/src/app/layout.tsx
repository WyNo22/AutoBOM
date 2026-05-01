import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoBOM",
  description: "AutoBOM — gestion de nomenclature centralisée.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
