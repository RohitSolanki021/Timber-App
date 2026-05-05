// apiToggle.ts
// Simple runtime toggle for switching between real API and mock API

export const API_MODE_KEY = 'api_mode'; // localStorage key

export type ApiMode = 'real' | 'mock';

export function getApiMode(): ApiMode {
  const mode = localStorage.getItem(API_MODE_KEY);
  return mode === 'mock' ? 'mock' : 'real';
}

export function setApiMode(mode: ApiMode) {
  localStorage.setItem(API_MODE_KEY, mode);
  window.location.reload(); // reload to ensure all modules pick up the change
}
