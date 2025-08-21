import { getAuthToken, removeAuthToken, isTokenExpired } from "./authUtils";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  // Add auth header if token exists and is not expired
  if (token && !isTokenExpired(token)) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add content type for requests with data
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // Handle unauthorized responses
  if (res.status === 401) {
    removeAuthToken();
    window.location.href = '/login';
    throw new Error(`${res.status}: Unauthorized`);
  }

  // Handle other error responses
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
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
