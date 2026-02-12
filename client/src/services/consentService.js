import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import api from "@/utils/api";
import { authService } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const consentService = {
  consentRegistration: async (id = 0, data) => {
    // const margedData = { data1, data2 };
    const token = authService.getToken();
    console.log("boy");
    try {
      const response = await api.post(`${API_BASE_URL}/api/consent/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error registation", error);
      return error;
    }
  },
  consentUpdate: async (id, data) => {
    // const margedData = { data1, data2 };
    const token = authService.getToken();
    try {
      const response = await api.put(`${API_BASE_URL}/api/consent/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error registation", error);
      return error;
    }
  },
  getConsent: async (id) => {
    // const margedData = { data1, data2 };
    const token = authService.getToken();
    try {
      const response = await api.get(`${API_BASE_URL}/api/consent`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error registation", error);
      return error;
    }
  },
  getConsentByid: async (id) => {
    // const margedData = { data1, data2 };
    const token = authService.getToken();
    try {
      const response = await api.get(`${API_BASE_URL}/api/consent/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error registation", error);
      return error;
    }
  },
  deleteById: async (id) => {
    // const margedData = { data1, data2 };
    const token = authService.getToken();
    try {
      const response = await api.delete(`${API_BASE_URL}/api/consent/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      console.error("Error registation", error);
      return error;
    }
  },
};
