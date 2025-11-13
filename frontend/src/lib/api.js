// src/lib/api.js
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export async function api(path, { auth = true, ...options } = {}) {
  const token = getToken();
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const config = {
    ...options,
    headers,
    credentials: 'include', // keep if your server CORS allows credentials; otherwise remove
  };

  const response = await fetch(`${BASE_URL}${path}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed (${response.status})`;
    const err = new Error(message);
    if (data?.code) err.code = data.code; // optional: bubble up server codes
    throw err;
  }

  return data;
}
