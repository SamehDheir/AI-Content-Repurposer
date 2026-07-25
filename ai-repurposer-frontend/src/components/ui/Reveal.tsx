"use client";
import { useReveal } from "@/lib/hooks/useReveal";

interface Props {
  children: React.ReactNode;
  /** Milliseconds of stagger relative to the rest of its group. */
  delay?: number;
  /** "up" rises into place, "wipe" uncovers left-to-right like ink drying. */
  variant?: "up" | "wipe";
  className?: string;
  as?: "div" | "section" | "li" | "tr" | "span" | "p" | "h2" | "header";
}

export function Reveal({
  children,
  delay = 0,
  variant = "up",
  className = "",
  as: Tag = "div",
}: Props) {
  const ref = useReveal<HTMLElement>(delay);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} data-reveal={variant} className={className}>
      {children}
    </Tag>
  );
}
