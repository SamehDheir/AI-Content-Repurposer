"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Waveform } from "@/components/ui/Waveform";

// The backend sets HttpOnly cookies before redirecting here, so there are no
// tokens in the URL to read — this page just forwards to the dashboard. It is
// usually on screen for a single frame; it exists so that frame is not blank.
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <AuthShell
      index="06"
      kicker="Handoff"
      back={false}
      title={
        <>
          Letting you <em className="italic text-signal">in</em>.
        </>
      }
      deck="Google vouched for you and the session cookies are already set. Nothing to type."
    >
      <Waveform bars={40} live playhead className="h-10 opacity-40" />
      <p className="label mt-6 flex items-center gap-2 text-ink-3">
        <span
          className="h-3 w-3 border border-current"
          style={{ animation: "cr-spin 0.9s linear infinite" }}
        />
        Forwarding to the desk
      </p>
    </AuthShell>
  );
}
