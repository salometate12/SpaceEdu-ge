export interface HistorySource {
  id: string;
  title: string;
  url: string;
  domain: string;
}

const SOURCES_MARKER = "\x1ESOURCES\x1E";

export function splitCompletionAndSources(raw: string): {
  content: string;
  sources: HistorySource[];
} {
  const markerIndex = raw.indexOf(SOURCES_MARKER);
  if (markerIndex !== -1) {
    const content = raw.slice(0, markerIndex).trimEnd();
    const jsonPart = raw.slice(markerIndex + SOURCES_MARKER.length);
    try {
      const parsed = JSON.parse(jsonPart) as {
        title?: string;
        url: string;
      }[];
      return {
        content: stripMarkdownSourcesSection(content),
        sources: normalizeSources(parsed),
      };
    } catch {
      return {
        content: stripMarkdownSourcesSection(content),
        sources: extractSourcesFromMarkdown(content),
      };
    }
  }

  const { body, sources } = extractMarkdownSourcesSection(raw);
  return {
    content: body,
    sources: sources.length > 0 ? sources : extractSourcesFromMarkdown(raw),
  };
}

export function stripSourcesPayload(raw: string): string {
  const markerIndex = raw.indexOf(SOURCES_MARKER);
  if (markerIndex !== -1) {
    return stripMarkdownSourcesSection(raw.slice(0, markerIndex).trimEnd());
  }
  const partial = raw.lastIndexOf("\x1E");
  if (partial !== -1 && partial > raw.length - 20) {
    return stripMarkdownSourcesSection(raw.slice(0, partial).trimEnd());
  }
  return stripMarkdownSourcesSection(raw);
}

function normalizeSources(
  items: { title?: string; url: string }[],
): HistorySource[] {
  const seen = new Set<string>();
  const result: HistorySource[] = [];

  for (const item of items) {
    if (!item.url || seen.has(item.url)) continue;
    seen.add(item.url);
    try {
      const url = new URL(item.url);
      result.push({
        id: item.url,
        url: item.url,
        title: item.title?.trim() || url.hostname,
        domain: url.hostname.replace(/^www\./, ""),
      });
    } catch {
      /* invalid url */
    }
  }

  return result;
}

function stripMarkdownSourcesSection(content: string): string {
  return extractMarkdownSourcesSection(content).body;
}

function extractMarkdownSourcesSection(content: string): {
  body: string;
  sources: HistorySource[];
} {
  const patterns = [
    /\n##\s*წყაროები\s*\n/i,
    /\n#\s*წყაროები\s*\n/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.index != null) {
      const body = content.slice(0, match.index).trimEnd();
      const sourcesBlock = content.slice(match.index);
      return {
        body,
        sources: extractSourcesFromMarkdown(sourcesBlock),
      };
    }
  }

  return { body: content, sources: [] };
}

export function extractSourcesFromMarkdown(text: string): HistorySource[] {
  const sources: HistorySource[] = [];
  const seen = new Set<string>();

  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(text)) !== null) {
    const url = match[2];
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      const parsed = new URL(url);
      sources.push({
        id: url,
        url,
        title: match[1].trim(),
        domain: parsed.hostname.replace(/^www\./, ""),
      });
    } catch {
      /* skip */
    }
  }

  const bareUrlRegex = /https?:\/\/[^\s)\]>]+/g;
  while ((match = bareUrlRegex.exec(text)) !== null) {
    const url = match[0].replace(/[.,;]+$/, "");
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      const parsed = new URL(url);
      sources.push({
        id: url,
        url,
        title: parsed.hostname,
        domain: parsed.hostname.replace(/^www\./, ""),
      });
    } catch {
      /* skip */
    }
  }

  return sources;
}

export function formatUrlSources(
  sources: Array<{
    sourceType: string;
    url?: string;
    title?: string;
  }>,
): { title?: string; url: string }[] {
  return sources
    .filter((s) => s.sourceType === "url" && s.url)
    .map((s) => ({
      title: s.title,
      url: s.url!,
    }));
}
