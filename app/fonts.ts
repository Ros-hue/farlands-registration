import { Press_Start_2P, Inter } from "next/font/google";

export const minecraftFont = Press_Start_2P({ 
  weight: "400", 
  subsets: ["latin"],
  variable: "--font-minecraft"
});

export const interFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});
