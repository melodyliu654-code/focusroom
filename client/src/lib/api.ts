function normalizeBase(url: string | undefined): string {
  return (url || '').trim().replace(/\/+$/, '');
}

export function getApiBase(): string {
  return normalizeBase(import.meta.env.VITE_API_URL);
}

export function getApiConfigError(): string | null {
  if (getApiBase()) return null;
  if (!import.meta.env.PROD) return null;
  return 'Frontend is missing VITE_API_URL. Set it to your deployed API origin and redeploy the client.';
}

export async function apiFetch(
  path: string,
  accessToken: string | null,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${getApiBase()}${path}`, { ...init, headers });
}
