"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AuthShell, Stamp, Problem, Action } from "@/components/auth/AuthShell";
import { Field } from "@/components/auth/Field";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that link.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell
        index="03"
        kicker="Recover"
        title={
          <>
            Check the <em className="italic text-signal">post</em>.
          </>
        }
      >
        <Stamp label="Link sent" />
        {/* The API answers the same way whether or not the account exists, so
            the copy must not confirm it does. */}
        <p className="mt-7 text-[14.5px] leading-[1.7] text-ink-2">
          If <span className="slug text-ink">{email}</span> has an account here, a reset link is on
          its way. It is good for one hour.
        </p>
        <dl className="mt-6 border-t border-rule">
          {/* Mono is for the data — an address, a duration. The instruction is a
              sentence and gets set as one. */}
          {([
            ["Sent to", email, true],
            ["Good for", "1 hour", true],
            ["Next", "Open the link and set a new password.", false],
          ] as [string, string, boolean][]).map(([k, v, mono]) => (
            <div key={k} className="flex gap-4 border-b border-rule py-2.5">
              <dt className="label w-20 shrink-0 text-ink-3">{k}</dt>
              <dd
                className={
                  mono
                    ? "slug min-w-0 truncate text-[12.5px] text-ink-2"
                    : "min-w-0 text-[12.5px] leading-[1.6] text-ink-2"
                }
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>
        <Link
          href="/login"
          className="label mt-7 flex h-12 items-center justify-center gap-2 border border-rule-strong text-ink transition-colors hover:border-signal hover:text-signal"
        >
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      index="03"
      kicker="Recover"
      title={
        <>
          Mislaid <em className="italic text-signal">the key</em>?
        </>
      }
      deck="Give us the address on the account and we'll post a link that lets you set a new password. The link expires after an hour."
      footer={
        <p className="label text-center text-ink-3">
          Remembered it?{" "}
          <Link href="/login" className="text-signal underline underline-offset-4">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-6">
        <Field
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            setError("");
          }}
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
        />

        {error && <Problem>{error}</Problem>}

        <Action type="submit" loading={loading} loadingLabel="Posting">
          Send the link
        </Action>
      </form>
    </AuthShell>
  );
}
