import api from "@/utils/api";
import { authService } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const authHeader = () => ({
  headers: { Authorization: `Bearer ${authService.getToken()}` },
});

export const uomService = {
  getAll: async () => {
    const response = await api.get(`${API_BASE_URL}/api/uom`, authHeader());
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${API_BASE_URL}/api/uom/${id}`, authHeader());
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(`${API_BASE_URL}/api/uom`, data, authHeader());
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`${API_BASE_URL}/api/uom/${id}`, data, authHeader());
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`${API_BASE_URL}/api/uom/${id}`, authHeader());
    return response.data;
  },
};
