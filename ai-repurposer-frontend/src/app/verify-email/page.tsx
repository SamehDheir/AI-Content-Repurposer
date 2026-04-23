"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/src/lib/api";
import { Sparkles, CheckCircle, AlertCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    const verify = async () => {
      try {
        await api.verifyEmail(token);
        setStatus("success");
        setMessage("Email verified successfully!");
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Verification failed");
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0e0e10] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center mb-6">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-zinc-100 mb-2">Verifying your email...</h1>
              <p className="text-sm text-zinc-500">Please wait while we verify your email address</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h1 className="text-xl font-bold text-zinc-100 mb-2">Email Verified!</h1>
              <p className="text-sm text-zinc-500">{message}</p>
              <p className="text-xs text-zinc-600 mt-4">Redirecting to dashboard...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-6">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-zinc-100 mb-2">Verification Failed</h1>
              <p className="text-sm text-zinc-500 mb-6">{message}</p>
              <button
                onClick={() => router.push("/login")}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
