"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Mark } from "@/src/components/brand/Mark";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";

/** Wall clock in the rail, in the same 24h form as the job timecodes. */
function Timecode() {
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Empty on the server: a clock rendered there would never match the client.
  return (
    <span className="label tabular-nums text-ink-3" suppressHydrationWarning>
      {now || "--:--:--"}
    </span>
  );
}

export function DeskRail({ onSignOut }: { onSignOut: () => void }) {
  return (
    <>
      {/* Desktop: a narrow vertical rail, the spine of the desk. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col items-center justify-between border-r border-rule bg-paper py-5 md:flex">
        <Link href="/" aria-label="Back to the front page" className="block">
          <Mark size={22} />
        </Link>

        <span
          className="label whitespace-nowrap text-ink-3"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          The cutting room — desk 01
        </span>

        <div className="flex flex-col items-center gap-2">
          <ThemeToggle />
          <button
            onClick={onSignOut}
            className="flex h-8 w-8 items-center justify-center border border-rule text-ink-3 transition-colors hover:border-signal hover:text-signal"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </aside>

      {/* Mobile: the same controls, folded into a bar. */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-rule bg-paper/90 px-4 backdrop-blur-md md:hidden">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Back to the front page">
          <Mark size={20} />
          <span className="display text-base">The desk</span>
        </Link>
        <div className="flex items-center gap-2">
          <Timecode />
          <ThemeToggle />
          <button
            onClick={onSignOut}
            className="flex h-8 w-8 items-center justify-center border border-rule text-ink-3"
            aria-label="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </>
  );
}

export function DeskHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-14 z-20 border-b border-rule bg-paper/90 backdrop-blur-md md:top-0">
      <div className="mx-auto flex h-auto max-w-5xl flex-col gap-3 px-5 py-4 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-0 sm:px-8">
        <div className="flex items-baseline gap-3">
          <h1 className="display text-2xl leading-none">The desk</h1>
          <span className="hidden h-3 w-px bg-rule sm:block" />
          <span className="hidden sm:block">
            <Timecode />
          </span>
        </div>
        {children}
      </div>
    </header>
  );
}
