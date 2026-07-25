"use client";
import Link from "next/link";
import { Mark, Wordmark } from "@/src/components/brand/Mark";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";

const INKS = ["var(--fmt-thread)", "var(--fmt-blog)", "var(--fmt-social)", "var(--fmt-marks)"];

interface Props {
  /** Plate number in the auth sequence — 01 is the login door. */
  index: string;
  kicker: string;
  title: React.ReactNode;
  deck?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  note?: string;
  /** `false` hides it — the OAuth handoff is mid-sign-in, so offering the door
      back would be nonsense. */
  back?: { href: string; label: string } | false;
}

/**
 * The chrome shared by the short auth pages: recover, reset, verify, handoff.
 * They are dockets rather than doors — one plate, one job — so they get a single
 * centred column instead of the login page's two-column spread.
 */
export function AuthShell({
  index,
  kicker,
  title,
  deck,
  children,
  footer,
  note = "Sessions are HttpOnly cookies — nothing is kept in the browser you can read.",
  back = { href: "/login", label: "← Sign in" },
}: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-rule px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Back to the front page">
          <Mark size={22} />
          <Wordmark />
        </Link>
        <div className="flex items-center gap-3">
          {back && (
            <Link href={back.href} className="label text-ink-3 transition-colors hover:text-signal">
              {back.label}
            </Link>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div
            className="border border-rule-strong bg-surface"
            style={{ animation: "cr-rise 0.55s cubic-bezier(.16,.84,.28,1) both" }}
          >
            <div className="flex items-center justify-between border-b border-rule px-6 py-3">
              <span className="label text-ink-3">
                {index} · {kicker}
              </span>
              <span className="flex items-center gap-1" aria-hidden="true">
                {INKS.map((ink) => (
                  <span key={ink} className="h-2 w-2" style={{ background: ink }} />
                ))}
              </span>
            </div>

            <div className="px-6 py-7 sm:px-8">
              <h1 className="display display-xl text-[clamp(1.9rem,4.6vw,2.5rem)]">{title}</h1>
              {deck && <p className="mt-4 text-[14.5px] leading-[1.7] text-ink-2">{deck}</p>}
              <div className="mt-7">{children}</div>
            </div>
          </div>

          {footer && <div className="mt-5">{footer}</div>}
        </div>
      </main>

      <footer className="border-t border-rule px-5 py-4 sm:px-8">
        <span className="label text-ink-3">{note}</span>
      </footer>
    </div>
  );
}

/** Terminal state of a docket: a rubber stamp, not a tick in a circle. */
export function Stamp({ label, ink = "var(--fmt-social)" }: { label: string; ink?: string }) {
  return (
    <span
      className="inline-flex"
      style={{ animation: "cr-stamp 0.5s cubic-bezier(.2,1.5,.4,1) both" }}
    >
      <span
        className="label border-2 px-4 py-2.5"
        style={{ borderColor: ink, color: ink }}
      >
        {label}
      </span>
    </span>
  );
}

/** The signal-washed error strip every auth page uses. */
export function Problem({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2.5 border-l-2 border-signal bg-signal-wash px-4 py-3 text-[13px] leading-[1.6] text-ink">
      <span className="label mt-0.5 shrink-0 text-signal">Err</span>
      {children}
    </p>
  );
}

/** Primary action, shared so the four pages cannot drift apart. */
export function Action({
  children,
  loading,
  loadingLabel = "Working",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      aria-busy={loading}
      className="label group flex h-12 w-full items-center justify-center gap-2.5 bg-signal text-signal-ink transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--rule-strong)] disabled:pointer-events-none disabled:bg-rule-strong disabled:text-ink-3"
    >
      {loading ? (
        <>
          <span
            className="h-3 w-3 border border-current"
            style={{ animation: "cr-spin 0.9s linear infinite" }}
          />
          {loadingLabel}
        </>
      ) : (
        <>
          {children}
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </>
      )}
    </button>
  );
}
