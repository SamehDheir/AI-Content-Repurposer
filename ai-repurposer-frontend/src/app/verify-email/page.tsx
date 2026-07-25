"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/src/lib/api";
import { AuthShell, Stamp, Problem } from "@/src/components/auth/AuthShell";
import { Waveform } from "@/src/components/ui/Waveform";

// useSearchParams() opts the subtree out of prerendering, so it needs its own
// Suspense boundary or `next build` fails on this route.
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailHandler />
    </Suspense>
  );
}

type Status = "checking" | "verified" | "rejected";

function VerifyEmailHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("rejected");
      setMessage("This verification link is missing its token.");
      return;
    }

    let live = true;
    api
      .verifyEmail(token)
      .then(() => {
        if (!live) return;
        setStatus("verified");
        // Google's callback aside, this is the one place a session may already
        // exist, so the desk is the right destination.
        setTimeout(() => router.push("/dashboard"), 2000);
      })
      .catch((err: unknown) => {
        if (!live) return;
        setStatus("rejected");
        setMessage(
          err instanceof Error ? err.message : "That verification link could not be read.",
        );
      });

    return () => {
      live = false;
    };
  }, [searchParams, router]);

  if (status === "checking") {
    return (
      <AuthShell
        index="05"
        kicker="Verify"
        title={
          <>
            Reading <em className="italic text-signal">the stamp</em>.
          </>
        }
        deck="Checking the token against the account. This takes a moment."
      >
        <Waveform bars={40} live className="h-10 opacity-40" />
        <p className="label mt-6 text-ink-3">Working</p>
      </AuthShell>
    );
  }

  if (status === "verified") {
    return (
      <AuthShell
        index="05"
        kicker="Verify"
        title={
          <>
            Address <em className="italic text-signal">confirmed</em>.
          </>
        }
      >
        <Stamp label="Verified" />
        <p className="mt-7 text-[14.5px] leading-[1.7] text-ink-2">
          That is the last gate. The account is live and the first video is on the house.
        </p>
        <p className="label mt-6 flex items-center gap-2 text-ink-3">
          <span
            className="h-3 w-3 border border-current"
            style={{ animation: "cr-spin 0.9s linear infinite" }}
          />
          Taking you to the desk
        </p>
        <Link
          href="/dashboard"
          className="label mt-7 flex h-12 items-center justify-center gap-2 border border-rule-strong text-ink transition-colors hover:border-signal hover:text-signal"
        >
          Go now →
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      index="05"
      kicker="Verify"
      title={
        <>
          Could not <em className="italic text-signal">read it</em>.
        </>
      }
      deck="Verification links last 24 hours and can only be spent once, so an old link or a second click will land here."
    >
      <Stamp label="Rejected" ink="var(--signal)" />
      <div className="mt-7">
        <Problem>{message}</Problem>
      </div>
      {/* The login page offers a resend button as soon as the 403 comes back,
          so pointing there is enough — no second email field needed. */}
      <p className="mt-6 text-[14.5px] leading-[1.7] text-ink-2">
        Try signing in: when the address is still unverified we offer a fresh link right there.
      </p>
      <Link
        href="/login"
        className="label mt-7 flex h-12 items-center justify-center gap-2 bg-signal text-signal-ink transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--rule-strong)]"
      >
        Back to sign in →
      </Link>
    </AuthShell>
  );
}
