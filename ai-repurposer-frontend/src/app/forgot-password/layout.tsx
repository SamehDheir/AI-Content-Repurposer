import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password - AI Repurposer",
  description: "Reset your AI Repurposer password to regain access to your account.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
