import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import api from "@/utils/api";
import { authService } from "./authService";
const API_BASE_URL = import.meta.env.VITE_API_URL;

export const customerService = {
  customerRegistration: async (id = 0, data1, data2) => {
    const margedData = { data1, data2 };
    const token = authService.getToken();
    try {
      const response = await api.post(`${API_BASE_URL}/api/customer/${id}`, margedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      console.error("Error registation", error);
    }
  },
  updateRegistration: async (id, data1, data2) => {
    console.log(data1);
    const margedData = { data1, data2 };
    const token = authService.getToken();
    try {
      const response = await api.put(`${API_BASE_URL}/api/customer/${id}`, margedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error registation", error);
    }
  },

  getCustomerData: async (id) => {
    const token = authService.getToken();
    try {
      const response = await api.get(`${API_BASE_URL}/api/customer/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetch data", error);
    }
  },
  getCustomerJoinInterestData: async (id) => {
    const token = authService.getToken();
    try {
      const response = await api.get(`${API_BASE_URL}/api/customer/joininterest/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetch data", error);
    }
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
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
      };
    } catch {
      return null;
    }
  },
};
