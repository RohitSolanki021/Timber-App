import type { AuthUser } from "../types";

const PROFILE_KEY = "profile";

export function getStoredProfile(): AuthUser | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isSalesUser() {
  const role = getStoredProfile()?.role;
  return Boolean(role && role.toLowerCase().includes("sales"));
}
