const base = () => import.meta.env.VITE_API_URL || '';

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
  return fetch(`${base()}${path}`, { ...init, headers });
}
