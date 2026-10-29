/** The video id from a youtube.com or youtu.be link (also /shorts/ and /embed/), or null. */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const fromPath = parsed.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/);
      return parsed.searchParams.get("v") ?? fromPath?.[1] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}
