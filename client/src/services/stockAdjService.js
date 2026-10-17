import api from "@/utils/api";

export const getAdjBalance = (cutoffDate) =>
  api.get("/api/stock-adj/balance", { params: { cutoffDate } }).then((r) => r.data);

export const createAdjustment = (payload) =>
  api.post("/api/stock-adj", payload).then((r) => r.data);
