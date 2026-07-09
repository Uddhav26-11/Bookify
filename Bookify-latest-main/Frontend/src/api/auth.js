import api from "./axios";

const TOKEN_KEY = "bookify_token";

// sessionStorage (not localStorage) is intentional: it's scoped per browser
// tab rather than shared across every tab on the origin. That lets someone
// be logged in as admin in one tab and seller in another, in the same
// browser, without one login overwriting the other. The trade-off is the
// session doesn't survive closing the tab (a fresh tab needs a fresh
// login) — normal within-tab refreshes are unaffected.
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

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