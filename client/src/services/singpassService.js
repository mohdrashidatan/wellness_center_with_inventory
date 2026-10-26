import api from "@/utils/api";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const SINGPASS_ENABLED = import.meta.env.VITE_SINGPASS_ENABLED === "true";

// Messages for the error codes the server puts in the URL fragment. Provider
// error text is never shown (the server does not forward it).
export const SINGPASS_MESSAGES = {
  cancelled: "Singpass login was cancelled.",
  expired: "The Singpass login took too long. Please try again.",
  session_expired: "Your Singpass login session was not found. Please start again from this browser.",
  replay: "This Singpass login link has already been used. Please start again.",
  not_linked: "This Singpass account is not linked to an inventory user. Log in with your password, then link Singpass from your Profile.",
  not_permitted: "This account is not permitted to use Singpass login.",
  already_linked: "A Singpass account is already linked to this user.",
  link_conflict: "This Singpass account is already linked to another user.",
  provider_error: "Singpass is temporarily unavailable. Please try again later.",
  failed: "Singpass login could not be verified. Please try again.",
};

export const singpassMessage = (code) => SINGPASS_MESSAGES[code] || SINGPASS_MESSAGES.failed;

export const singpassService = {
  // Full-page navigation: the server starts PAR and redirects to Singpass.
  loginUrl: () => `${API_BASE_URL}/api/auth/singpass/login`,

  exchange: async (code) => {
    const response = await api.post(`${API_BASE_URL}/api/auth/singpass/exchange`, { code });
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get(`${API_BASE_URL}/api/auth/singpass/link`);
    return response.data.data;
  },

  // Returns a single-use URL (valid 60s) to navigate to.
  requestLinkUrl: async () => {
    const response = await api.post(`${API_BASE_URL}/api/auth/singpass/link/ticket`);
    return response.data.data.url;
  },

  unlink: async () => {
    const response = await api.delete(`${API_BASE_URL}/api/auth/singpass/link`);
    return response.data;
  },

  listLinks: async () => {
    const response = await api.get(`${API_BASE_URL}/api/auth/singpass/links`);
    return response.data.data;
  },

  revokeLink: async (id) => {
    const response = await api.post(`${API_BASE_URL}/api/auth/singpass/links/${id}/revoke`);
    return response.data;
  },
};
