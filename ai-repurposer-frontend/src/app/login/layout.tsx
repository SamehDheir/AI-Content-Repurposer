import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - AI Repurposer",
  description: "Sign in to your AI Repurposer account to transform your YouTube videos into multiple content formats.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
