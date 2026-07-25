/** Pulls the video id out of the URL shapes YouTube hands people. */
export function youtubeId(url: string): string | null {
  return (
    url.match(/[?&]v=([\w-]{6,})/)?.[1] ??
    url.match(/youtu\.be\/([\w-]{6,})/)?.[1] ??
    url.match(/\/(?:embed|shorts|live)\/([\w-]{6,})/)?.[1] ??
    null
  );
}

export function thumbnailFor(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
}
