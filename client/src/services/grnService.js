import api from "@/utils/api";
import { authService } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const authHeader = () => ({
  headers: { Authorization: `Bearer ${authService.getToken()}` },
});

export const grnService = {
  getList: async (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined))
    ).toString();
    const response = await api.get(`${API_BASE_URL}/api/grn${query ? "?" + query : ""}`, authHeader());
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post(`${API_BASE_URL}/api/grn`, payload, authHeader());
    return response.data;
  },

  searchSku: async (q) => {
    const response = await api.get(
      `${API_BASE_URL}/api/products/sku/search?q=${encodeURIComponent(q)}`,
      authHeader()
    );
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${API_BASE_URL}/api/grn/${id}`, authHeader());
    return response.data;
  },
};
