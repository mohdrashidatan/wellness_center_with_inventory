import api from "@/utils/api";
import { authService } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const authHeader = () => ({
  headers: { Authorization: `Bearer ${authService.getToken()}` },
});

export const usersService = {
  getAll: async () => {
    const response = await api.get(`${API_BASE_URL}/api/users`, authHeader());
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${API_BASE_URL}/api/users/${id}`, authHeader());
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(`${API_BASE_URL}/api/users`, data, authHeader());
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`${API_BASE_URL}/api/users/${id}`, data, authHeader());
    return response.data;
  },

  deactivate: async (id) => {
    const response = await api.delete(`${API_BASE_URL}/api/users/${id}`, authHeader());
    return response.data;
  },
};
