import api from "./api";

export const login = async (email, password, mfaCode) => {
  const response = await api.post("/api/auth/login/", {
    email,
    password,
    mfa_code: mfaCode,
  });
  return response.data;
};

export const register = async (username, email, password) => {
  const response = await api.post("/api/auth/register/", {
    username,
    email,
    password,
  });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};
