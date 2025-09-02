import axios from "axios";

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
  timeout: 1200000,
  withCredentials: false,
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Error de red";
    return Promise.reject(new Error(msg));
  }
);
