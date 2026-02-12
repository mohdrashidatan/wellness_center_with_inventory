import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import api from "@/utils/api";
import { authService } from "./authService";
const API_BASE_URL = import.meta.env.VITE_API_URL;

export const receiptService = {
  sentEmail: async (formdata) => {
    // const margedData = { data1, data2 };
    const token = authService.getToken();
    try {
      const response = await api.post(`${API_BASE_URL}/api/receipt/sentemail`, formdata, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error registation", error);
      return error;
    }
  },
};
