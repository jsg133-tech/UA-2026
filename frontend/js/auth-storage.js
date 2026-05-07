const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function saveAuthSession({ token, user, rememberMe }) {
  clearAuthSession();

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  if (user) {
    storage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function setStoredUser(user) {
  if (!user) return;

  const serialized = JSON.stringify(user);
  if (localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(USER_KEY, serialized);
    return;
  }

  if (sessionStorage.getItem(TOKEN_KEY)) {
    sessionStorage.setItem(USER_KEY, serialized);
  }
}
