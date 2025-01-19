import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authService from "../../services/auth";
import api from "../../services/api";

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  loading: !!localStorage.getItem("token"),
  error: null,
};

export const validateToken = createAsyncThunk(
  "auth/validateToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/auth/validate/");
      return response.data;
    } catch (error) {
      localStorage.removeItem("token");
      return rejectWithValue({ error: "Invalid token" });
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async ({ username, password, mfaCode }, { rejectWithValue }) => {
    try {
      const data = await authService.login(username, password, mfaCode);
      if (data.token) {
        localStorage.setItem("token", data.token);
        return {
          user: data.user,
          token: data.token,
        };
      }
      return rejectWithValue({ error: "Invalid credentials" });
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Login failed";
      return rejectWithValue({ error: errorMessage });
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async ({ username, email, password }, { dispatch, rejectWithValue }) => {
    try {
      const data = await authService.register(username, email, password);
      if (data.user) {
        const loginResult = await dispatch(
          login({ username: email, password })
        );
        if (loginResult.error) {
          return rejectWithValue({
            error: "Registration successful but login failed",
          });
        }
      }
      return data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Registration failed";
      return rejectWithValue({ error: errorMessage });
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      authService.logout();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(validateToken.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Login failed";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        // Login is handled by the login thunk after registration
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Registration failed";
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
