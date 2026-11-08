export function projectUrl(value: string) {
  const url = value?.trim();
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) return url;

  const isHttpUrl = /^https?:\/\//i.test(url);
  if (!isHttpUrl && (url.startsWith("/") || url.includes("://"))) return null;
  try {
    const external = new URL(isHttpUrl ? url : `https://${url}`);
    return external.username || external.password ? null : external.href;
  } catch {
    return null;
  }
}
