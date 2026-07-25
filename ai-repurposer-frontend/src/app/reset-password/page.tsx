"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { AuthShell, Stamp, Problem, Action } from "@/components/auth/AuthShell";
import { Field } from "@/components/auth/Field";

// useSearchParams() opts the subtree out of prerendering, so it needs its own
// Suspense boundary or `next build` fails on this route.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

/** A requirement that ticks over as it is met. */
function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="label flex items-center gap-2.5" style={{ color: ok ? "var(--fmt-social)" : "var(--ink-3)" }}>
      <span
        className="h-2.5 w-2.5 shrink-0 border transition-colors"
        style={{
          borderColor: ok ? "var(--fmt-social)" : "var(--rule-strong)",
          background: ok ? "var(--fmt-social)" : "transparent",
        }}
      />
      {children}
    </li>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const longEnough = password.length >= 8;
  const matches = password.length > 0 && password === confirm;
  const ready = longEnough && matches && !!token;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) return setError("This reset link is missing its token.");
    if (!longEnough) return setError("Password must be at least 8 characters.");
    if (!matches) return setError("The two passwords do not match.");

    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset that password.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell
        index="04"
        kicker="New key"
        title={
          <>
            Cut and <em className="italic text-signal">filed</em>.
          </>
        }
      >
        <Stamp label="Password reset" />
        <p className="mt-7 text-[14.5px] leading-[1.7] text-ink-2">
          The new password is live and the reset link has been spent. Taking you back to the door
          now.
        </p>
        <p className="label mt-6 flex items-center gap-2 text-ink-3">
          <span
            className="h-3 w-3 border border-current"
            style={{ animation: "cr-spin 0.9s linear infinite" }}
          />
          Redirecting to sign in
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      index="04"
      kicker="New key"
      title={
        <>
          Set a <em className="italic text-signal">new one</em>.
        </>
      }
      deck="Pick something you have not used here before. Eight characters is the floor, not the target."
      footer={
        <p className="label text-center text-ink-3">
          Link gone stale?{" "}
          <Link href="/forgot-password" className="text-signal underline underline-offset-4">
            Ask for another
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-6">
        {/* Surfaced before submitting, rather than after a wasted attempt. */}
        {!token && <Problem>This reset link is missing its token. Ask for a fresh one.</Problem>}

        <Field
          id="password"
          label="New password"
          type="password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setError("");
          }}
          placeholder="••••••••"
          autoComplete="new-password"
          minLength={8}
          autoFocus
        />

        <Field
          id="confirm"
          label="Again, to be sure"
          type="password"
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            setError("");
          }}
          placeholder="••••••••"
          autoComplete="new-password"
          minLength={8}
        />

        {password.length > 0 && (
          <ul className="space-y-2.5 border-t border-rule pt-4">
            <Rule ok={longEnough}>At least 8 characters</Rule>
            <Rule ok={matches}>Both fields match</Rule>
          </ul>
        )}

        {error && <Problem>{error}</Problem>}

        <Action type="submit" loading={loading} loadingLabel="Filing" disabled={!ready}>
          Reset the password
        </Action>
      </form>
    </AuthShell>
  );
}
