import axios from "axios";

const TOKEN_KEY = "mcq_token";

const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:1126/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      window.dispatchEvent(new Event("mcq:unauthorized"));
    }
    if (!axios.isCancel(error)) {
      const status = error.response?.status;
      const messages = {
        403: "Access denied. You do not have permission for this action.",
        404: "The requested item was not found.",
        409: "This action conflicts with the current state.",
        422: "Please check the form values.",
        429: "Too many requests. Please wait and try again.",
      };
      const message = !error.response
        ? "Connection lost. Please check your connection."
        : status >= 500
          ? "The server could not complete the request. Please try again."
          : error.response.data?.message ||
            messages[status] ||
            "Unable to complete the request.";
      error.userMessage = message;
      if (error.response?.data && typeof error.response.data === "object")
        error.response.data.message = message;
    }
    return Promise.reject(error);
  },
);

export default api;

/** Returns a safe message for every Axios/API failure without exposing internals. */
export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again.",
) => error?.userMessage || fallback;
