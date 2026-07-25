"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/src/lib/api";
import { Mark, Wordmark } from "@/src/components/brand/Mark";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { Waveform } from "@/src/components/ui/Waveform";
import { Field } from "@/src/components/auth/Field";

const MODES = ["Sign in", "New account"] as const;
type Mode = (typeof MODES)[number];

const FORMATS = [
  ["Thread", "var(--fmt-thread)"],
  ["Blog post", "var(--fmt-blog)"],
  ["Facebook post", "var(--fmt-social)"],
  ["Highlight reel", "var(--fmt-marks)"],
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("Sign in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const registering = mode === "New account";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (registering) {
        // Registration no longer starts a session — the address has to be
        // verified first, so show the confirmation instead of redirecting.
        const { message } = await api.register(email, password, name.trim() || undefined);
        setNotice(message);
        setPassword("");
      } else {
        // The server sets HttpOnly cookies on the response; nothing to store.
        await api.login(email, password);
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    try {
      const { message } = await api.resendVerification(email);
      setNotice(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend that email.");
    }
  };

  const google = () => {
    const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    window.location.href = `${backend}/auth/google`;
  };

  const switchTo = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  return (
    <div className="grid min-h-screen bg-paper text-ink lg:grid-cols-2">
      {/* ── The door ── */}
      <div className="flex min-h-screen flex-col lg:min-h-0">
        <header className="flex items-center justify-between border-b border-rule px-5 py-4 sm:px-8">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="Back to the front page">
            <Mark size={22} />
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="label text-ink-3 transition-colors hover:text-signal">
              ← Back
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main
          className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8"
          role="main"
          aria-label={registering ? "Create an account" : "Sign in"}
        >
          <div className="w-full max-w-md">
            <span className="label text-ink-3">
              {registering ? "02 · Open an account" : "01 · Access"}
            </span>

            {/* Keyed so the heading replays its entrance when the mode flips. */}
            <h1
              key={mode}
              className="display display-xl mt-4 text-[clamp(2.4rem,6vw,3.4rem)]"
              style={{ animation: "cr-rise 0.55s cubic-bezier(.16,.84,.28,1) both" }}
            >
              {registering ? (
                <>
                  Pull up <em className="italic text-signal">a desk</em>.
                </>
              ) : (
                <>
                  Back to <em className="italic text-signal">the desk</em>.
                </>
              )}
            </h1>

            <p className="mt-4 text-[14.5px] leading-[1.7] text-ink-2">
              {registering
                ? "One video a month, free, cut into all four formats. We verify the address before the first sign-in."
                : "Your ledger, your takes and anything still being cut are waiting where you left them."}
            </p>

            {/* Mode toggle */}
            <div
              className="relative mt-8 grid grid-cols-2 border border-rule"
              role="tablist"
              aria-label="Sign in or create an account"
            >
              <span
                className="absolute inset-y-0 w-1/2 bg-ink transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${registering ? "100%" : "0%"})` }}
                aria-hidden="true"
              />
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchTo(m)}
                  className={`label relative z-10 h-11 transition-colors ${
                    mode === m ? "text-paper" : "text-ink-3 hover:text-ink"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-8 space-y-6">
              {registering && (
                <div style={{ animation: "cr-rise 0.45s cubic-bezier(.16,.84,.28,1) both" }}>
                  <Field
                    id="name"
                    label="Name — optional"
                    type="text"
                    value={name}
                    onChange={setName}
                    placeholder="How the desk should address you"
                    autoComplete="name"
                    required={false}
                  />
                </div>
              )}

              <Field
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <Field
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete={registering ? "new-password" : "current-password"}
                hint={registering ? "At least 8 characters." : undefined}
              />

              {error && (
                <div className="border-l-2 border-signal bg-signal-wash px-4 py-3">
                  <p className="flex gap-2.5 text-[13px] leading-[1.6] text-ink">
                    <span className="label mt-0.5 shrink-0 text-signal">Err</span>
                    {error}
                  </p>
                  {error.toLowerCase().includes("verify your email") && (
                    <button
                      type="button"
                      onClick={resend}
                      className="label mt-2.5 text-signal underline underline-offset-4"
                    >
                      Send the verification email again
                    </button>
                  )}
                </div>
              )}

              {notice && (
                <div className="border-l-2 border-fmt-social bg-surface px-4 py-3">
                  <p className="flex gap-2.5 text-[13px] leading-[1.6] text-ink">
                    <span className="label mt-0.5 shrink-0 text-fmt-social">Ok</span>
                    {notice}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="label group flex h-12 w-full items-center justify-center gap-2.5 bg-signal text-signal-ink transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--rule-strong)] disabled:pointer-events-none disabled:bg-rule-strong disabled:text-ink-3"
              >
                {loading ? (
                  <>
                    <span
                      className="h-3 w-3 border border-current"
                      style={{ animation: "cr-spin 0.9s linear infinite" }}
                    />
                    Working
                  </>
                ) : (
                  <>
                    {registering ? "Create the account" : "Sign in"}
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-4">
                <span className="h-px flex-1 bg-rule" />
                <span className="label text-ink-3">or</span>
                <span className="h-px flex-1 bg-rule" />
              </div>

              <button
                type="button"
                onClick={google}
                className="label flex h-12 w-full items-center justify-center gap-3 border border-rule-strong text-ink transition-colors hover:border-signal hover:text-signal"
                aria-label="Continue with Google"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
            </form>

            {!registering && (
              <p className="mt-8 border-t border-rule pt-5">
                <Link
                  href="/forgot-password"
                  className="label text-ink-3 transition-colors hover:text-signal"
                >
                  Forgotten the password?
                </Link>
              </p>
            )}
          </div>
        </main>

        <footer className="border-t border-rule px-5 py-4 sm:px-8">
          <span className="label text-ink-3">
            Sessions are HttpOnly cookies — nothing is kept in the browser you can read.
          </span>
        </footer>
      </div>

      {/* ── The plate: inverted, so the door has a wall to sit in ── */}
      <aside
        className="relative hidden overflow-hidden border-l border-rule bg-ink text-paper lg:flex lg:flex-col lg:justify-between"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between px-10 pt-10">
          <span className="label text-paper/50">The cutting room</span>
          <span className="label text-paper/50">Issue 01</span>
        </div>

        <div className="px-10">
          <p className="display display-xl text-[clamp(2.6rem,4.4vw,4rem)]">
            One video in.
            <br />
            <em className="italic text-signal-on-ink">Everything</em>
            <br />
            you publish out.
          </p>

          <ul className="mt-12 border-t border-paper/15">
            {FORMATS.map(([label, ink]) => (
              <li
                key={label}
                className="flex items-center gap-4 border-b border-paper/15 py-3.5"
              >
                <span className="h-2.5 w-2.5" style={{ background: ink }} />
                <span className="label text-paper/70">{label}</span>
                <span className="ml-auto label text-paper/40">ready to post</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-10 pb-10">
          <Waveform
            bars={72}
            live
            playhead
            color="var(--paper)"
            playheadColor="var(--signal-on-ink)"
            className="h-14 opacity-30"
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="label text-paper/40">00:00:00:00</span>
            <span className="label text-paper/40">00:12:41:07</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
