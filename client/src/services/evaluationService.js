import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import api from "@/utils/api";
import { authService } from "./authService";
const API_BASE_URL = import.meta.env.VITE_API_URL;

export const evaluationService = {
  addEvaluation: async (id, data) => {
    const token = authService.getToken();
    try {
      const response = await api.post(`${API_BASE_URL}/api/evaluation/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      console.error("Error registation", error);
    }
  },
  updateEvaluation: async (id, data) => {
    const token = authService.getToken();
    try {
      const response = await api.put(`${API_BASE_URL}/api/evaluation/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      console.error("Error registation", error);
    }
  },
  getEvaluationData: async (id) => {
    const token = authService.getToken();
    try {
      const response = await api.get(`${API_BASE_URL}/api/evaluation/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      console.error("Error registation", error);
    }
  },
  deleteEvaluationData: async (id) => {
    const token = authService.getToken();
    try {
      const response = await api.delete(`${API_BASE_URL}/api/evaluation/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      console.error("Error registation", error);
    }
  },
};
