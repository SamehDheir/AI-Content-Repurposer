"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      // Set cookies
      document.cookie = `accessToken=${accessToken}; path=/; max-age=604800`;
      document.cookie = `refreshToken=${refreshToken}; path=/; max-age=604800`;
      
      // Redirect to dashboard
      router.push("/dashboard");
    } else {
      // Redirect to login if no tokens
      router.push("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0e0e10] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-500">Signing you in...</p>
      </div>
    </div>
  );
}
