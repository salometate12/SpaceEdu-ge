import { YoutubeTranscript, type TranscriptResponse } from "youtube-transcript";
import { sliceTranscript } from "@/lib/generation-options";
import { extractYouTubeVideoId } from "./youtube-id";

export { extractYouTubeVideoId };

/** The video's timed captions: Georgian first, then English. */
export async function fetchYouTubeSegments(url: string): Promise<TranscriptResponse[]> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("არასწორი YouTube ბმული");
  }
  return YoutubeTranscript.fetchTranscript(videoId, {
    lang: "ka",
  }).catch(async () => {
    return YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
  });
}

/** The transcript as text; with `range` (seconds), only that part of the video. */
export async function fetchYouTubeTranscript(
  url: string,
  range?: { start: number; end: number } | null,
): Promise<string> {
  const segments = await fetchYouTubeSegments(url);
  const text = range
    ? sliceTranscript(segments, range.start, range.end)
    : segments.map((s) => s.text).join(" ").trim();
  if (!text) {
    throw new Error(
      range ? "ამ მონაკვეთში სუბტიტრები ვერ ვიპოვე. აირჩიე სხვა დრო." : "ტრანსკრიპტი ვერ მოიძებნა ამ ვიდეოსთვის",
    );
  }
  return text;
}
