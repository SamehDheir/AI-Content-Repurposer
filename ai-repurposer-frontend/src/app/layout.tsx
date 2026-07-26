import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

// `subsets` controls *preloading only* — it does not reduce what is downloaded.
// Next fetches and self-hosts every file in the Google CSS regardless (see
// findFontFilesInCss: subsets just sets preloadFontFile), which is why the build
// carries 17 woff2 files for three families. Only four are preloaded — one latin
// file per family and style, ~171KB — and the other thirteen (latin-ext,
// vietnamese, cyrillic) are never requested by a browser that renders no
// codepoint in their unicode-range. Getting to genuinely latin-only would mean
// next/font/local with the woff2 files committed, which saves build output and
// no user bytes at all.
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
//
// The italic is the largest single font file the site loads — 64.5KB, more than
// the roman — and it is kept deliberately. It sets the `<em>` accent in the
// headline of every page at 2.4–5rem, and a synthetic slant on a serif skews the
// serifs while keeping roman letterforms, which is exactly the failure this face
// was chosen to avoid.
const displaySerif = Newsreader({
  variable: "--font-display-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  // Social images have to be absolute URLs. Without this Next resolves them
  // against http://localhost:3000 and every shared link points at nothing —
  // set NEXT_PUBLIC_SITE_URL to the deployed origin.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
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
      // globals.css sets scroll-behavior: smooth for the in-page section links;
      // this tells Next to bypass it on route transitions.
      data-scroll-behavior="smooth"
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
