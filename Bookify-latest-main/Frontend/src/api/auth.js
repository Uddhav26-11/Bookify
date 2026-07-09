import api from "./axios";

const TOKEN_KEY = "bookify_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Validates the persisted token with the backend and returns the current
// user if it's still valid. Used on app startup to restore the session
// after a refresh, and returns null (without throwing) if there's no token
// or the token is missing/expired/invalid.
export const fetchCurrentUser = async () => {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await api.get("/auth/me");
    return res.data.user;
  } catch (error) {
    // Token missing/expired/invalid on the backend — clear it so we don't
    // keep retrying with a dead token.
    clearToken();
    return null;
  }
};
