import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000", // your backend port
});

export default api;
