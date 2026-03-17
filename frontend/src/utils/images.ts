const DEFAULT_UPLOAD_BASE_URL = "http://localhost/natural/";

export const UPLOAD_BASE_URL = (() => {
  const configured = (import.meta.env.VITE_UPLOAD_BASE_URL || DEFAULT_UPLOAD_BASE_URL).trim();
  if (!configured) return DEFAULT_UPLOAD_BASE_URL;
  return configured.endsWith("/") ? configured : `${configured}/`;
})();

function stripBasePathPrefix(path: string, baseUrl: string) {
  try {
    const basePath = new URL(baseUrl).pathname.replace(/^\/+|\/+$/g, "");
    if (!basePath) return path;
    if (path === basePath) return "";
    if (path.startsWith(`${basePath}/`)) return path.slice(basePath.length + 1);
    return path;
  } catch {
    return path;
  }
}

export function resolveImageUrl(path?: string) {
  if (!path) return "";

  const normalized = path.trim().replace(/\\/g, "/");
  if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith("data:")) return normalized;

  const withoutLeadingSlash = normalized.replace(/^\/+/, "");
  const relativePath = stripBasePathPrefix(withoutLeadingSlash, UPLOAD_BASE_URL);
  return new URL(relativePath, UPLOAD_BASE_URL).toString();
}
