"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The backend sets HttpOnly cookies before redirecting here, so there are no
// tokens in the URL to read — this page just forwards to the dashboard.
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0e0e10] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-500">Signing you in...</p>
      </div>
    </div>
  );
}
