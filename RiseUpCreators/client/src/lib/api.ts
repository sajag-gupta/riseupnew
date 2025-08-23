import { getAuthToken, removeAuthToken, isTokenExpired } from "./authUtils";

export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  path: string,
  body?: any
) {
  const token = getAuthToken();

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: "include",
  };

  if (body && method !== "GET") {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(path, config);

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      // Only redirect to login if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
      const error = new Error('Authentication required');
      (error as any).status = response.status;
      throw error;
    }

    const errorText = await response.text();
    let errorMessage: string;

    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    } catch {
      errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
    }

    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  return response;
}

export async function uploadFile(
  url: string,
  file: File,
  fieldName = 'file'
): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token && !isTokenExpired(token)) {
    headers.Authorization = `Bearer ${token}`;
  }

  const formData = new FormData();
  formData.append(fieldName, file);

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (res.status === 401) {
    removeAuthToken();
    window.location.href = '/login';
    throw new Error(`${res.status}: Unauthorized`);
  }

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
}