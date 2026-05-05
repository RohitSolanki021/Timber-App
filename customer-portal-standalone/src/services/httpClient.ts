import { env } from "../config/env";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem(env.AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(env.AUTH_TOKEN_KEY);
  }
}

export function restoreAccessToken() {
  const token = localStorage.getItem(env.AUTH_TOKEN_KEY);
  if (token) accessToken = token;
}

function withQuery(url: string, query?: Record<string, string | number | undefined>) {
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  }
  const q = params.toString();
  return q ? `${url}?${q}` : url;
}

export async function http<T>(
  path: string,
  options: RequestInit = {},
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = withQuery(`${env.API_BASE_URL}${path}`, query);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
