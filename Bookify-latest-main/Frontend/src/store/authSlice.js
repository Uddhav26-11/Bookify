import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  role: null, // "admin" | "seller" | "customer"
  name: null,
  email: null,
  id: null,
  // Whether we've finished trying to restore the session from the
  // persisted token on app startup. Routing/guards should wait for this to
  // be true before deciding "not logged in" vs "still checking" — otherwise
  // a refresh briefly looks logged-out before the /auth/me check resolves.
  bootstrapped: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.role = action.payload.role;
      state.name = action.payload.name;
      state.email = action.payload.email || null;
      state.id = action.payload.id || null;
      state.bootstrapped = true;
    },
    logout: (state) => {
      state.role = null;
      state.name = null;
      state.email = null;
      state.id = null;
      state.bootstrapped = true;
    },
    authBootstrapped: (state) => {
      state.bootstrapped = true;
    },
  },
});

export const { login, logout, authBootstrapped } = authSlice.actions;
export default authSlice.reducer;