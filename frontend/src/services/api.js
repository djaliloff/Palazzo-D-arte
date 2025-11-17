import axios from "axios";

const resolveBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const port = process.env.REACT_APP_API_PORT || "5000";
    return `${protocol}//${hostname}:${port}/api`;
  }

  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: resolveBaseURL(),
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
