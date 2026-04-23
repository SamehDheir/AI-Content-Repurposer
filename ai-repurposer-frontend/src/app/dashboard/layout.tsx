import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - AI Repurposer",
  description: "Manage your content repurposing jobs and view your generated content.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
