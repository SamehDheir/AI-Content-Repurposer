"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mark, Wordmark } from "@/src/components/brand/Mark";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { useScrollProgress } from "@/src/hooks/useScrollProgress";

const SECTIONS = [
  { id: "outputs", index: "01", label: "Outputs" },
  { id: "pipeline", index: "02", label: "Pipeline" },
  { id: "specs", index: "03", label: "Specs" },
  { id: "rates", index: "04", label: "Rates" },
];

export function SiteHeader({ authed, onEnter }: { authed: boolean; onEnter: () => void }) {
  const router = useRouter();
  const progress = useScrollProgress();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");

  // Underline whichever section is currently crossing the upper third.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* How far down the issue you have read. */}
      <div
        className="h-[2px] origin-left bg-signal transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />

      <div className="border-b border-rule bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between gap-6 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="AI Repurposer, home">
            <Mark size={22} />
            <Wordmark className="hidden sm:flex" />
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Sections">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="group flex items-baseline gap-1.5 py-1"
              >
                <span className="label text-ink-3 transition-colors group-hover:text-signal">
                  {s.index}
                </span>
                <span className="relative text-[13px] text-ink-2 transition-colors group-hover:text-ink">
                  {s.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-px w-full origin-left bg-signal transition-transform duration-300 ${
                      active === s.id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!authed && (
              <button
                onClick={() => router.push("/login")}
                className="hidden h-8 px-3 text-[13px] text-ink-2 transition-colors hover:text-ink sm:block"
              >
                Sign in
              </button>
            )}
            <button
              onClick={onEnter}
              className="label group hidden h-8 items-center gap-2 bg-signal px-4 text-signal-ink transition-all hover:-translate-y-[2px] hover:shadow-[3px_3px_0_var(--rule-strong)] sm:flex"
            >
              {authed ? "The desk" : "Start free"}
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>

            <button
              onClick={() => setOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center border border-rule text-ink-2 md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <span className="relative block h-[9px] w-4">
                <span
                  className={`absolute left-0 h-px w-full bg-current transition-all duration-300 ${
                    open ? "top-1 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 h-px w-full bg-current transition-all duration-300 ${
                    open ? "top-1 -rotate-45" : "top-2"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile index */}
      <div
        className={`fixed inset-x-0 top-[calc(3.5rem+2px)] bottom-0 z-40 border-t border-rule bg-paper transition-all duration-300 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <div className="flex h-full flex-col px-5 py-8">
          <span className="label mb-6 text-ink-3">Index</span>
          {SECTIONS.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setOpen(false)}
              className="flex items-baseline gap-4 border-b border-rule py-4"
              style={{
                transition: "opacity .5s, transform .5s",
                transitionDelay: `${open ? 80 + i * 60 : 0}ms`,
                opacity: open ? 1 : 0,
                transform: open ? "none" : "translateY(12px)",
              }}
            >
              <span className="label text-signal">{s.index}</span>
              <span className="display text-3xl">{s.label}</span>
            </a>
          ))}
          <div className="mt-auto flex gap-3">
            {!authed && (
              <button
                onClick={() => router.push("/login")}
                className="label h-11 flex-1 border border-rule text-ink-2"
              >
                Sign in
              </button>
            )}
            <button
              onClick={onEnter}
              className="label h-11 flex-1 bg-signal text-signal-ink"
            >
              {authed ? "The desk →" : "Start free →"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
