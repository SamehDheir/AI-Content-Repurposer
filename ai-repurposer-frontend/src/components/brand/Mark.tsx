interface Props {
  size?: number;
  className?: string;
}

/**
 * The house mark: a solid source block, and the four pieces it gets cut into.
 * Hover fans the pieces out (see `.mark-*` in globals.css).
 */
export function Mark({ size = 24, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`mark shrink-0 ${className}`}
    >
      <rect className="mark-source" x="1" y="3" width="7" height="18" fill="var(--signal)" />
      <rect className="mark-chip mark-chip-a" x="11" y="3" width="5.5" height="8" fill="var(--fmt-thread)" />
      <rect className="mark-chip mark-chip-b" x="17.5" y="3" width="5.5" height="8" fill="var(--fmt-blog)" />
      <rect className="mark-chip mark-chip-c" x="11" y="13" width="5.5" height="8" fill="var(--fmt-social)" />
      <rect className="mark-chip mark-chip-d" x="17.5" y="13" width="5.5" height="8" fill="var(--fmt-marks)" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-baseline gap-1.5 ${className}`}>
      <span className="display text-[1.05rem] leading-none">Repurposer</span>
      <span className="label text-ink-3 translate-y-[-1px]">v1</span>
    </span>
  );
}
