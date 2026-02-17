import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import api from "@/utils/api";
import { authService } from "./authService";
const API_BASE_URL = import.meta.env.VITE_API_URL;

export const productsService = {
  getProducts: async () => {
    const token = authService.getToken();
    try {
      const response = await api.get(`${API_BASE_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching products", error);
      return error;
    }
  },
  getProductList: async ({ search = "", page = 1, limit = 10 }) => {
    const token = authService.getToken();
    const params = new URLSearchParams({ search, page, limit });
    const response = await api.get(`${API_BASE_URL}/api/products/list?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  getProductById: async (id) => {
    const token = authService.getToken();
    const response = await api.get(`${API_BASE_URL}/api/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  updateProduct: async (id, data) => {
    const token = authService.getToken();
    const response = await api.put(`${API_BASE_URL}/api/products/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  deactivateProduct: async (id) => {
    const token = authService.getToken();
    const response = await api.delete(`${API_BASE_URL}/api/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  createProduct: async (data) => {
    const token = authService.getToken();
    const response = await api.post(`${API_BASE_URL}/api/products`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  getProductTransactions: async (id, { search = "", type = "", dateFrom = "", dateTo = "" } = {}) => {
    const token = authService.getToken();
    const params = new URLSearchParams({ search, type, dateFrom, dateTo });
    const response = await api.get(`${API_BASE_URL}/api/products/${id}/transactions?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // ─── Variants ───────────────────────────────────────────────────────────────
  getProductVariants: async (id) => {
    const token = authService.getToken();
    const response = await api.get(`${API_BASE_URL}/api/products/${id}/variants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  createVariantOption: async (productId, data) => {
    const token = authService.getToken();
    const response = await api.post(`${API_BASE_URL}/api/products/${productId}/variants/options`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  updateVariantOption: async (productId, optionId, data) => {
    const token = authService.getToken();
    const response = await api.put(`${API_BASE_URL}/api/products/${productId}/variants/options/${optionId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  deleteVariantOption: async (productId, optionId) => {
    const token = authService.getToken();
    const response = await api.delete(`${API_BASE_URL}/api/products/${productId}/variants/options/${optionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  addVariantValue: async (productId, optionId, data) => {
    const token = authService.getToken();
    const response = await api.post(`${API_BASE_URL}/api/products/${productId}/variants/options/${optionId}/values`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  updateVariantValue: async (productId, valueId, data) => {
    const token = authService.getToken();
    const response = await api.put(`${API_BASE_URL}/api/products/${productId}/variants/values/${valueId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  deleteVariantValue: async (productId, valueId) => {
    const token = authService.getToken();
    const response = await api.delete(`${API_BASE_URL}/api/products/${productId}/variants/values/${valueId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
