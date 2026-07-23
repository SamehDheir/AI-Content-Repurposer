export function parseTweets(text: string): string[] {
  return text.split(/\n\s*\n/).filter((t) => t.trim());
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g) ?? [];
  return [...new Set(matches)];
}

export function extractHook(text: string): string {
  return text.split(/\n/).filter((l) => l.trim())[0] ?? "";
}

export function parseHighlights(text: string): { title: string; body: string }[] {
  return text
    .split(/\n(?=\d+\.|[•\-])/)
    .filter((s) => s.trim())
    .map((item) => {
      const colonIdx = item.search(/[:\-–]/);
      if (colonIdx > 0 && colonIdx < 80) {
        return {
          title: item.slice(0, colonIdx).replace(/^[\d•\-\s]+/, "").trim(),
          body:  item.slice(colonIdx + 1).trim(),
        };
      }
      const lines = item.split("\n").filter(Boolean);
      return {
        title: lines[0]?.replace(/^[\d•\-\s]+/, "").trim() ?? "Point",
        body:  lines.slice(1).join(" ").trim() || item.replace(/^[\d•\-\s]+/, "").trim(),
      };
    });
}

