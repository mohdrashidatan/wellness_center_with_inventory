import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import api from "@/utils/api";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const readJsonResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const body = await response.text();
    const preview = body.replace(/\s+/g, " ").trim().slice(0, 120);
    throw new Error(
      `API returned ${contentType || "non-JSON"} instead of JSON. ${preview || "No response body."}`
    );
  }

  return response.json();
};

export const authService = {
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.error?.message || data.message || "Login failed");
    }
    console.log("Login successful:", data);
    authService.setToken(data.data.token);

    return data;
  },

  singup: async (body) => {
    try {
      const response = await api.post(`${API_BASE_URL}/api/auth/signup`, body);
      return response.data;
    } catch (error) {
      console.error("Error creating account", error);
    }
  },

  getToken: () => Cookies.get("token"),

  setToken: (token) => {
    Cookies.set("token", token, {
      expires: 1,
      secure: true,
      sameSite: "Strict",
    });
  },

  removeToken: () => Cookies.remove("token"),

  isAuthenticated: () => {
    const token = authService.getToken();

    if (!token) return false;

    try {
      const decoded = jwtDecode(token);

      if (!decoded.userId || !decoded.iat || !decoded.jti || decoded.exp * 1000 < Date.now()) {
        authService.removeToken();
        return false;
      }
      return true;
    } catch {
      authService.removeToken();
      return false;
    }
  },

  getUserInfo: () => {
    try {
      const token = authService.getToken();
      if (!token) return null;

      const decoded = jwtDecode(token);
      return {
        userId: decoded.userId,
        userName: decoded.userName,
        email: decoded.email,
        role: decoded.role,
        customerId: decoded.customerId,
        therapistId: decoded.therapistId,
      };
    } catch {
      return null;
    }
  },
};
