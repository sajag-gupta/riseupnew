export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function getAuthToken(): string | null {
  // Try localStorage first, then fallback to cookie
  let token = localStorage.getItem('authToken');

  if (!token) {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
    if (tokenCookie) {
      token = tokenCookie.split('=')[1];
      // Sync to localStorage if found in cookie
      if (token) {
        localStorage.setItem('authToken', token);
      }
    }
  }

  return token;
}

export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
  // Also set as cookie for server-side requests
  document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`; // 7 days
}

export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}