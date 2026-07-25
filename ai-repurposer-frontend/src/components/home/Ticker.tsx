const PIECES = [
  "Twitter thread",
  "Blog post",
  "Facebook post",
  "Highlight reel",
  "Featured image",
];

const RUNNERS = [
  "MODERN STANDARD ARABIC",
  "ENGLISH",
  "WHISPER LARGE V3",
  "LLAMA 3.1",
  "YOUTUBE CAPTIONS",
  "YT-DLP FALLBACK",
];

function Row({
  children,
  duration,
  reverse = false,
  className = "",
}: {
  children: React.ReactNode;
  duration: string;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className="anim-marquee flex w-max items-center"
        style={{
          ["--marquee-duration" as string]: duration,
          animationDirection: reverse ? "reverse" : undefined,
        }}
      >
        {/* Duplicated once; the keyframe travels exactly one copy's width. */}
        {children}
        {children}
      </div>
    </div>
  );
}

export function Ticker() {
  const headline = (
    <>
      {PIECES.map((p, i) => (
        <span key={`${p}-${i}`} className="flex shrink-0 items-center">
          <span className="display px-7 text-2xl sm:text-3xl">{p}</span>
          <span className="text-signal-on-ink">✳</span>
        </span>
      ))}
    </>
  );

  const runner = (
    <>
      {RUNNERS.map((r, i) => (
        <span key={`${r}-${i}`} className="flex shrink-0 items-center">
          <span className="label px-6 text-ink-3">{r}</span>
          <span className="h-1 w-1 bg-rule-strong" />
        </span>
      ))}
    </>
  );

  return (
    <section aria-hidden="true" className="border-b border-rule">
      <Row duration="38s" className="bg-ink py-3 text-paper">
        {headline}
      </Row>
      <Row duration="55s" reverse className="border-t border-rule py-2.5">
        {runner}
      </Row>
    </section>
  );
}
