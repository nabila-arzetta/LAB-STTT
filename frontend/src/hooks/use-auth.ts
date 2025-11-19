import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  kode_bagian?: string | null;
  kode_ruangan?: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ user: AuthUser }>('/me');
      setUser(res.data.user);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Gagal memuat data pengguna');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    try {
      await api.post('/logout');
      setUser(null);
      window.location.href = '/login'; // redirect ke halaman login
    } catch {
      setError('Gagal logout');
    }
  };

  return {
    user,
    loading,
    error,
    refresh: fetchUser,
    logout,
    isSuperAdmin: user?.role === 'superadmin',
    isAdminLab: user?.role === 'admin_lab',
  };
}
