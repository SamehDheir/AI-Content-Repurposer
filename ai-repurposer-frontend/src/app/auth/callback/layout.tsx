import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - AI Repurposer",
  description: "Complete your authentication with AI Repurposer.",
};

export default function AuthCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
