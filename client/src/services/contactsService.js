import api from "@/utils/api";
import { authService } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${authService.getToken()}` } });

export const contactsService = {
  search: async (q) => {
    const res = await api.get(`${API_BASE_URL}/api/contacts/search?q=${encodeURIComponent(q)}`, authHeader());
    return res.data;
  },
  createSupplier: async (data) => {
    const res = await api.post(`${API_BASE_URL}/api/contacts`, data, authHeader());
    return res.data;
  },
};
