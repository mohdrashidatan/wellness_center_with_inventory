import api from "@/utils/api";
import { authService } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const therapistsService = {
  therapistsList: async () => {
    const token = authService.getToken();
    try {
      const response = await api.get(`${API_BASE_URL}/api/therapist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching patient data:", error);
      throw error;
    }
  },
};
