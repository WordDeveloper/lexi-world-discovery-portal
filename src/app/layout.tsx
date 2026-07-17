import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lexi World Discovery Portal",
  description:
    "A calm, guided space for the Lexi World team to capture your game with you.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#2E4374",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased text-ink">{children}</body>
    </html>
  );
}
