import axios from "axios";

// Pakai env Vite: VITE_API_BASE_URL="http://127.0.0.1:8000/api"
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api",
  headers: { Accept: "application/json" },
  withCredentials: true,
});


// Inject token dari localStorage (AuthContext kamu sudah simpan token di sana)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout kalau token invalid/expired
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.replace("/login");
    }
    return Promise.reject(err);
  }
);

export { api };
