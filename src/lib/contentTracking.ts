export function contentTracking(type: "post" | "article" | "story" | "project", id: string, title?: string, publishedAt?: string) {
  return {
    "data-analytics-type": type,
    "data-analytics-id": id,
    "data-analytics-title": title || undefined,
    "data-analytics-published-at": publishedAt || undefined,
  };
}
