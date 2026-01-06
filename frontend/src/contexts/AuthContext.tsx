import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import { api } from "@/lib/api"; 

export type User = {
  id: number;
  name?: string | null;
  username?: string | null;
  full_name?: string | null;
  email: string;
  role?: string | null;
  lab_id?: number | null;               
  kode_bagian?: string | null;  
  token: string;        
  lab?: {                               
    id?: number | null;
    nama_lab?: string | null;
    singkatan?: string | null;
  } | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  getUserLab: () => number | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isAdminRole = (role?: string | null) =>
  role === "admin" || role === "admin_lab" || role === "superadmin";

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Header Authorization untuk axios
  const setAuthHeader = (token: string) => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  };
  const clearAuthHeader = () => {
    delete api.defaults.headers.common.Authorization;
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const rawUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser) as User;
            if (alive) setUser(parsed);
          } catch {
            localStorage.removeItem("user");
          }
        }

        if (token) {
          setAuthHeader(token);
          // validasi token 
          const { data } = await api.get<User>("/me");
          if (alive) setUser(data);
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        clearAuthHeader();
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Interceptor 401 -> bersihkan sesi lokal
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          clearAuthHeader();
          setUser(null);
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, []);

  // Actions
  const login = async (username: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>("/login", {
      username,
      password,
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setAuthHeader(data.token);
    setUser(data.user);
    if (data.user.role === "logistik") {
      window.location.href = "/logistik-role";
    }

    return data.user;
  };

  const logout = async () => {
    try {
      await api.post("/logout"); 
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    clearAuthHeader();
    setUser(null);
  };

  const isAdmin = () => isAdminRole(user?.role);

  const getUserLab = () => {
    if (!user) return null;
    if (typeof user.lab_id === "number") return user.lab_id ?? null;
    if (user.lab && typeof user.lab.id === "number") return user.lab.id ?? null;
    return null;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAdmin, getUserLab }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
