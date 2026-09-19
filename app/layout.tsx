import type { Metadata } from "next";
import { minecraftFont, interFont } from "./fonts";
import FarlandsCursor from "./components/cursor/FarlandsCursor";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farlands Hackathon 2026 | Enter the Unknown",
  description:
    "Enter the Farlands. Experience the 3D voxel rotating world, step through the dimensional portal, and assemble your squad for the 24-hour hackathon sprint.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${minecraftFont.variable} ${interFont.variable}`} suppressHydrationWarning>
      <body>
        <FarlandsCursor />
        {children}
      </body>
    </html>
  );
}
