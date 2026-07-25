/**
 * Accepts a full YouTube URL (watch, embed, /v/, or youtu.be) or a bare 11-char
 * video ID. Returns null when neither matches.
 *
 * Shared by JobsProcessor and TranscriptionService — they carried verbatim
 * copies of this before.
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();

  const regExp =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
}
