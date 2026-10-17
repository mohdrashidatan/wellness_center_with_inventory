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

  searchCustomers: async (q) => {
    const response = await api.get(
      `${API_BASE_URL}/api/do/search-customers?q=${encodeURIComponent(q)}`,
      authHeader()
    );
    return response.data;
  },

  createCustomer: async (name) => {
    const response = await api.post(`${API_BASE_URL}/api/do/customers`, { name }, authHeader());
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

  searchFieldValues: async (field, q) => {
    const response = await api.get(
      `${API_BASE_URL}/api/do/field-values?field=${encodeURIComponent(field)}&q=${encodeURIComponent(q)}`,
      authHeader()
    );
    return response.data;
  },

  updateCollectedDate: async (id, datecollected) => {
    const response = await api.patch(
      `${API_BASE_URL}/api/do/${id}/collected`,
      { datecollected: datecollected || null },
      authHeader()
    );
    return response.data;
  },

  getTopCustomers: async () => {
    const response = await api.get(`${API_BASE_URL}/api/do/stats/top-customers`, authHeader());
    return response.data;
  },

  getTopProducts: async () => {
    const response = await api.get(`${API_BASE_URL}/api/do/stats/top-products`, authHeader());
    return response.data;
  },
};
