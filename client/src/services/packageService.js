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
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Error registation", error);
      return error;
    }
  },

  // ─── Setup Management ──────────────────────────────────────────────────────
  getPackageList: async () => {
    const token = authService.getToken();
    const res = await api.get(`${API_BASE_URL}/api/package/setup/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  createPackage: async (data) => {
    const token = authService.getToken();
    const res = await api.post(`${API_BASE_URL}/api/package/setup`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  updatePackage: async (id, data) => {
    const token = authService.getToken();
    const res = await api.put(`${API_BASE_URL}/api/package/setup/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  addPackageDetail: async (packageId, data) => {
    const token = authService.getToken();
    const res = await api.post(`${API_BASE_URL}/api/package/setup/${packageId}/details`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  updatePackageDetail: async (detailId, data) => {
    const token = authService.getToken();
    const res = await api.put(`${API_BASE_URL}/api/package/setup/details/${detailId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  deletePackageDetail: async (detailId) => {
    const token = authService.getToken();
    const res = await api.delete(`${API_BASE_URL}/api/package/setup/details/${detailId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  getCustomerPackageUsage: async ({ packageId = "", search = "" } = {}) => {
    const token = authService.getToken();
    const params = new URLSearchParams({ packageId, search });
    const res = await api.get(`${API_BASE_URL}/api/package/setup/customer-usage?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};
