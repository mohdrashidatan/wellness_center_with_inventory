import api from "@/utils/api";
import { authService } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const auth = () => ({ headers: { Authorization: `Bearer ${authService.getToken()}` } });

export const serialService = {
  // Paged serial register, searchable by serial no / product name / item code.
  list: async ({ search = "", productId = "", status = "", page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams({ search, page, limit });
    if (productId) params.set("productId", productId);
    if (status) params.set("status", status);
    const res = await api.get(`${API_BASE_URL}/api/serial?${params}`, auth());
    return res.data;
  },

  // Units currently in stock for a product — the stock-out picker.
  getAvailable: async (productId) => {
    const res = await api.get(`${API_BASE_URL}/api/serial/available/${productId}`, auth());
    return res.data;
  },

  getHistory: async (serialId) => {
    const res = await api.get(`${API_BASE_URL}/api/serial/${serialId}/history`, auth());
    return res.data;
  },

  getReconciliation: async () => {
    const res = await api.get(`${API_BASE_URL}/api/serial/reconciliation`, auth());
    return res.data;
  },

  getSerializedProducts: async () => {
    try {
      const res = await api.get(`${API_BASE_URL}/api/serial/products`, auth());
      return res.data;
    } catch {
      return [];
    }
  },

  // Register serials for stock already on hand (opening balances).
  register: async ({ productid, serials, remarks }) => {
    const res = await api.post(`${API_BASE_URL}/api/serial/register`, { productid, serials, remarks }, auth());
    return res.data;
  },
};
