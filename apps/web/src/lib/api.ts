const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  allowRefresh = true
): Promise<any> {
  const url = `${API_URL}${endpoint}`;

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important for cookies
  });

  // Access token expires after 15 minutes. Transparently refresh once and
  // retry the original request so long sessions don't fail mid-action.
  if (
    response.status === 401 &&
    allowRefresh &&
    !endpoint.startsWith('/auth/')
  ) {
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshResponse.ok) {
      return fetchWithAuth(endpoint, options, false);
    }
  }

  if (!response.ok) {
    let message = 'An error occurred';
    try {
      const data = await response.json();
      // Backend error shape: { error: { code, message } }; fall back to { message }
      message = data?.error?.message || data?.message || message;
    } catch (e) {
      // Ignore JSON parse error if response is not JSON
    }
    throw new ApiError(response.status, message);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (endpoint: string) => fetchWithAuth(endpoint, { method: 'GET' }),
  post: (endpoint: string, data?: any) => fetchWithAuth(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  }),
  patch: (endpoint: string, data?: any) => fetchWithAuth(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined
  }),
  delete: (endpoint: string) => fetchWithAuth(endpoint, { method: 'DELETE' }),
};
