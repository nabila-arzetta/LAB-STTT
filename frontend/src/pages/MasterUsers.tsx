import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  kode_bagian?: string | null;
  bagian?: { nama_lab?: string | null };
};

type Lab = {
  kode_bagian: string;
  nama_lab: string;
};

const MasterUsers: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin_lab',
    kode_bagian: '',
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<{ data: User[] }>('/users');
      setUsers(data.data || []);
    } catch (err: any) {
      toast({
        title: 'Gagal memuat data',
        description: err?.response?.data?.message ?? err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchLabs = useCallback(async () => {
    try {
      const res = await api.get('/labs');
      const payload = res?.data ?? [];
      const list = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      setLabs(list);
    } catch (e: any) {
      console.error('Gagal memuat lab:', e);
      toast({
        title: 'Gagal memuat lab',
        description: e?.response?.data?.message ?? e.message ?? 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
    fetchLabs();
  }, [fetchUsers, fetchLabs]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // mulai loading
    try {
      if (editingUser) {
        const { data } = await api.put(`/users/${editingUser.id}`, formData);
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? data.data : u))
        );
        toast({ title: 'Berhasil', description: 'User diperbarui.' });
      } else {
        const { data } = await api.post('/users', formData);
        // 🧠 Cek apakah user dengan ID ini sudah ada — kalau iya, replace
        setUsers((prev) => {
          const exists = prev.some((u) => u.id === data.data.id);
          return exists
            ? prev.map((u) => (u.id === data.data.id ? data.data : u))
            : [...prev, data.data];
        });
        toast({ title: 'Berhasil', description: 'User ditambahkan.' });
      }
      resetForm();
    } catch (err: any) {
      toast({
        title: 'Gagal menyimpan data',
        description: err?.response?.data?.message ?? err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      kode_bagian: u.kode_bagian ?? '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast({ title: 'User dihapus', description: 'Data user berhasil dihapus.' });
    } catch (err: any) {
      toast({
        title: 'Gagal menghapus',
        description: err?.response?.data?.message ?? err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.delete(`/users/${selectedUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      toast({ title: 'Berhasil', description: `User "${selectedUser.name}" dihapus.` });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      toast({
        title: 'Gagal menghapus',
        description: err?.response?.data?.message ?? err.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };


  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'admin_lab', kode_bagian: '' });
    setEditingUser(null);
    setIsDialogOpen(false);
  };

  const columns = [
    {
      key: 'no',
      header: 'No',
      className: 'w-16 text-center',
      render: (u: User) => <>{users.indexOf(u) + 1}</>,
    },
    { key: 'name', header: 'Nama' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (u: User) => <Badge>{u.role}</Badge>,
    },
    {
      key: 'lab',
      header: 'Laboratorium',
      render: (u: any) => u.lab_name ?? '-',
    },
  ];

  const actions = (u: User) => (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => handleEdit(u)}>
        <Edit className="w-4 h-4" />
      </Button>
      {isSuperAdmin && (
        <Button
          variant="outline"
          size="sm"
          className="text-destructive"
          onClick={() => {
            setSelectedUser(u);
            setIsDeleteDialogOpen(true);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Master User</h1>
        {isSuperAdmin && (
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Tambah User
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Ubah data pengguna.' : 'Tambahkan pengguna baru ke sistem.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nama Lengkap</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            {!editingUser && (
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_lab">Admin Lab</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'admin_lab' && (
              <div>
                <Label>Laboratorium</Label>
                <Select
                  value={formData.kode_bagian}
                  onValueChange={(v) => setFormData({ ...formData, kode_bagian: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih laboratorium" />
                  </SelectTrigger>
                  <SelectContent>
                    {labs.map((lab) => (
                      <SelectItem key={lab.kode_bagian} value={lab.kode_bagian}>
                        {lab.nama_lab}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>Batal</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : editingUser ? 'Perbarui' : 'Tambah'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DataTable
        data={filteredUsers}
        columns={columns}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
        searchPlaceholder="Cari user..."
        emptyMessage={loading ? 'Memuat...' : 'Tidak ada user ditemukan'}
        actions={actions}
      />

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(v) => {
        if (!v) setSelectedUser(null);
        setIsDeleteDialogOpen(v);
      }}>
        <DialogContent className="max-w-sm text-center space-y-4">
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
          </DialogHeader>

          <p>
            Apakah kamu yakin ingin menghapus <b>{selectedUser?.name}</b>?
          </p>

          <DialogFooter className="justify-center gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" disabled={saving} onClick={confirmDelete}>
              {saving ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default MasterUsers;
