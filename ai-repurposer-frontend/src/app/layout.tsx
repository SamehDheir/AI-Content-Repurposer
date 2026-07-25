import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
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

// The display face. Everything editorial — headlines, section titles, the big
// numerals — is set in this; the mono carries the labels and timecodes.
// Newsreader rather than a high-contrast display serif: its hairlines survive
// at small sizes and on dark backgrounds, where a Didone-style face goes faint.
const displaySerif = Newsreader({
  variable: "--font-display-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Repurposer — One video, cut into everything you publish",
  description:
    "Paste a YouTube link. Get back a Twitter thread, a blog post, a Facebook post and a highlight reel — transcribed, written and laid out in Arabic or English.",
  keywords: [
    "AI content repurposing",
    "YouTube to blog",
    "video to text",
    "content automation",
    "AI writing",
  ],
  authors: [{ name: "AI Repurposer" }],
  openGraph: {
    title: "AI Repurposer — One video, cut into everything you publish",
    description:
      "Paste a YouTube link. Get back a Twitter thread, a blog post, a Facebook post and a highlight reel.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Repurposer — One video, cut into everything you publish",
    description:
      "Paste a YouTube link. Get back a Twitter thread, a blog post, a Facebook post and a highlight reel.",
  },
};

// Runs before first paint so the paper/ink tokens are already correct when the
// document renders. Without it the whole page flashes in the wrong theme while
// React hydrates.
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${displaySerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
