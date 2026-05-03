import api from "@/utils/api";
import { authService } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const authHeader = () => ({
  headers: { Authorization: `Bearer ${authService.getToken()}` },
});

export const doService = {
  getList: async (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined))
    ).toString();
    const response = await api.get(`${API_BASE_URL}/api/do${query ? "?" + query : ""}`, authHeader());
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post(`${API_BASE_URL}/api/do`, payload, authHeader());
    return response.data;
  },

  searchProducts: async (q) => {
    const response = await api.get(
      `${API_BASE_URL}/api/products/search?q=${encodeURIComponent(q)}`,
      authHeader()
    );
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${API_BASE_URL}/api/do/${id}`, authHeader());
    return response.data;
  },

  update: async (id, payload) => {
    const response = await api.put(`${API_BASE_URL}/api/do/${id}`, payload, authHeader());
    return response.data;
  },
};
