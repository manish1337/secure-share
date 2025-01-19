import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// List of routes that don't require authentication
const publicRoutes = ["/api/auth/login/", "/api/auth/register/"];

let handleAuthError = () => {
  // Default implementation, will be overridden
  localStorage.removeItem("token");
  window.location.href = "/login?session_expired=true";
};

export const setAuthErrorHandler = (handler) => {
  handleAuthError = handler;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && !publicRoutes.includes(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isTokenError =
      error.response?.data?.code === "token_not_valid" ||
      error.response?.status === 401;

    if (isTokenError && !publicRoutes.includes(error.config.url)) {
      handleAuthError();
    }
    return Promise.reject(error);
  }
);

export default api;
