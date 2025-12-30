import "./globals.css";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Scene Director AI Agent",
  description: "Generate cinematic scripts, scenes, image prompts, and video prompts from any idea."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} bg-slate-950 text-slate-100 min-h-screen antialiased font-body`}>
        {children}
      </body>
    </html>
  );
}
