import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import api from "@/utils/api";
import { authService } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const packageService = {
  getPackage: async () => {
    // const margedData = { data1, data2 };
    const token = authService.getToken();
    try {
      const response = await api.get(`${API_BASE_URL}/api/package`, {
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

  getCusPackage: async (customerId) => {
    // const margedData = { data1, data2 };
    const token = authService.getToken();
    try {
      const response = await api.get(`${API_BASE_URL}/api/package/${customerId}`, {
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

  minCusPackage: async (data) => {
    // const margedData = { data1, data2 };
    const token = authService.getToken();
    try {
      const response = await api.put(`${API_BASE_URL}/api/package/mincuspackage`, data, {
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

  insertCusPackage: async (data, id) => {
    const token = authService.getToken();
    try {
      const response = await api.post(`${API_BASE_URL}/api/package/${id}`, data, {
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
};
