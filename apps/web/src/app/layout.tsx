import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceFit - AI Fitness Coach",
  description: "Your personal AI fitness coach with voice-first training",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

