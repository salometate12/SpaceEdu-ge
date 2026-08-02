import { YoutubeTranscript } from "youtube-transcript";

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

export async function fetchYouTubeTranscript(url: string): Promise<string> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("არასწორი YouTube ბმული");
  }

  const segments = await YoutubeTranscript.fetchTranscript(videoId, {
    lang: "ka",
  }).catch(async () => {
    return YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
  });

  const text = segments.map((s) => s.text).join(" ").trim();
  if (!text) {
    throw new Error("ტრანსკრიპტი ვერ მოიძებნა ამ ვიდეოსთვის");
  }
  return text;
}
