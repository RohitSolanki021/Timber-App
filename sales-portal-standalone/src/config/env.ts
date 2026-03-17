const runtimeEnv = import.meta.env;

export const env = {
  API_BASE_URL: runtimeEnv.VITE_API_BASE_URL ?? '/api',
  USE_MOCK_API: (runtimeEnv.VITE_USE_MOCK_API ?? 'false').toLowerCase() === 'true',
  AUTH_TOKEN_KEY: runtimeEnv.VITE_AUTH_TOKEN_KEY ?? 'token',
};
