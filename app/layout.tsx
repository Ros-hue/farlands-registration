import type { Metadata } from "next";
import { minecraftFont, interFont } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farlands Hackathon 2026 | From Vishwakarma into the Unknown",
  description: "Travel from the ancient era of Vishwakarma into the Minecraft Farlands hackathon. 24 hours of innovation, $150K+ in prizes, and endless possibilities.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${minecraftFont.variable} ${interFont.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
