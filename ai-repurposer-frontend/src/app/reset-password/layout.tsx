import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password - AI Repurposer",
  description: "Create a new password for your AI Repurposer account.",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
