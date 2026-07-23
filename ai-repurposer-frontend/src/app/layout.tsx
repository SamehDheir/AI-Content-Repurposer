import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/src/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Repurposer - Transform YouTube Videos into Multiple Content Formats",
  description: "Turn one YouTube video into blog posts, Twitter threads, Facebook posts, and more. Save hours of work with AI-powered content repurposing.",
  keywords: ["AI content repurposing", "YouTube to blog", "video to text", "content automation", "AI writing"],
  authors: [{ name: "AI Repurposer" }],
  openGraph: {
    title: "AI Repurposer - Transform YouTube Videos into Multiple Content Formats",
    description: "Turn one YouTube video into blog posts, Twitter threads, Facebook posts, and more.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Repurposer - Transform YouTube Videos into Multiple Content Formats",
    description: "Turn one YouTube video into blog posts, Twitter threads, Facebook posts, and more.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
