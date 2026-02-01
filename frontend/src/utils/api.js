import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("No token found in localStorage for request:", config.url);
  }
  return config;
});

export default api;
