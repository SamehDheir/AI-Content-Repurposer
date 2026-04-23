import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email - AI Repurposer",
  description: "Verify your email address to complete your AI Repurposer account registration.",
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
