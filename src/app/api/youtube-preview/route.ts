import { enforceRateLimit } from "@/lib/rate-limit";
import { extractYouTubeVideoId, fetchYouTubeSegments } from "@/lib/ai/youtube";

export const dynamic = "force-dynamic";

export interface YouTubePreview {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  /** Seconds, from the captions' last line; null without captions. */
  duration: number | null;
  hasCaptions: boolean;
}

/**
 * What the generator shows under a pasted link: the video's title, channel
 * and thumbnail (YouTube oEmbed) and whether it has captions, which is what
 * the cards are made from.
 */
export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "ai");
  if (limited) return limited;

  const url = new URL(request.url).searchParams.get("url")?.trim() ?? "";
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return Response.json({ error: "არასწორი YouTube ბმული" }, { status: 400 });
  }

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const [oembed, segments] = await Promise.all([
    fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl)}`, { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<{ title?: string; author_name?: string }>) : null))
      .catch(() => null),
    fetchYouTubeSegments(watchUrl).catch(() => []),
  ]);

  if (!oembed) {
    return Response.json({ error: "ვიდეო ვერ ვიპოვე. შეამოწმე ბმული." }, { status: 404 });
  }

  const last = segments.at(-1);
  // Offsets are seconds in one transcript format and milliseconds in another.
  const rawEnd = last ? last.offset + last.duration : null;
  const duration = rawEnd === null ? null : Math.round(rawEnd > 6 * 3600 ? rawEnd / 1000 : rawEnd);

  const preview: YouTubePreview = {
    videoId,
    title: oembed.title ?? "",
    channel: oembed.author_name ?? "",
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration,
    hasCaptions: segments.length > 0,
  };
  return Response.json(preview);
}
