import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Eye, EyeOff, Plus, Edit, Trash2 } from "lucide-react";
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
  id_lab: number;
};

const MasterUsers: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [selectedLabUser, setSelectedLabUser] = useState<any | null>(null);
  const [selectedLabName, setSelectedLabName] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

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
      console.log('Fetched users:', data.data);
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
      console.log('Fetching labs', labs);
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
    const init = async () => {
      try {
        setInitialLoading(true);
        await Promise.all([fetchUsers(), fetchLabs()]);
      } finally {
        setInitialLoading(false);
      }
    };

    init();
  }, [fetchUsers, fetchLabs]);

  const groupedUsers = useMemo(() => {
    const map = new Map<string, any>();
    users.forEach(u => {
      const key = u.email;
      if (!map.has(key)) {
        map.set(key, { ...u, labs: u.lab_name ? [u.lab_name] : [] });
      } else {
        const existing = map.get(key)!;
        if (u.lab_name && !existing.labs.includes(u.lab_name)) {
          existing.labs.push(u.lab_name);
        }
      }
    });
    return Array.from(map.values());
  }, [users])

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return groupedUsers;

    return groupedUsers.filter((u: any) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }, [groupedUsers, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); 
    try {
      if (editingUser) {
        const { data } = await api.put(`/users/${editingUser.id}`, formData);
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? data.data : u))
        );
        toast({ title: 'Berhasil', description: 'User diperbarui.' });
      } else {
        const { data } = await api.post('/users', formData);
        // Cek apakah user dengan ID ini sudah ada
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
      // Panggil API backend untuk hapus user
      await api.delete(`/users/${id}`);
      
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

  const handleDeleteLab = async (groupedUser: any, labName: string) => {
    // Cari semua user dengan email yang sama
    const userLabs = users.filter(u => u.email === groupedUser.email);
    // Cari user-lab yang ingin dihapus
    const userLab = userLabs.find(u => u.lab_name === labName);

    if (!userLab) return;

    if (userLabs.length > 1) {
      // Hapus baris user dengan lab yang dipilih
      await api.delete(`/users/${userLab.id}`);
      toast({ title: 'Berhasil', description: `Lab "${labName}" dihapus dari user.` });
    } else {
      
      await api.delete(`/users/${userLab.id}`);
      toast({ title: 'Berhasil', description: `User "${groupedUser.name}" dihapus.` });
    }
    fetchUsers();
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
      render: (_: any, idx: number) => <>{idx + 1}</>,
    },
    { key: 'name', header: 'Nama' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (u: any) => <Badge>{u.role}</Badge>,
    },
    {
      key: 'labs',
      header: 'Laboratorium',
      render: (u: any) => (
        <div>
          {u.labs.length === 1 ? (
            u.labs[0]
          ) : (
            <Accordion type="single" collapsible>
              <AccordionItem value="lab-list">
                <AccordionTrigger>
                  {u.labs.length} lab
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {u.labs.map((lab: string) => (
                      <div key={lab} className="flex items-center justify-between px-2 py-1 border-b last:border-b-0">
                        <span>{lab}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteLab(u, lab)}
                        >
                          Hapus
                        </Button>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      ),
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

  if (initialLoading) {
    return (
      <div className="flex justify-center pt-6">
        <p className="text-muted-foreground animate-pulse">
          Memuat data...
        </p>
      </div>
    );
  }

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

            {/* Nama */}
            <div>
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                autoComplete="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Password (hanya saat create) */}
            {!editingUser && (
              <div className="relative">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="pr-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Role */}
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_lab">Admin Lab</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lab */}
            {formData.role === "admin_lab" && (
              <div>
                <Label htmlFor="kode_bagian">Laboratorium</Label>
                <Select
                  value={formData.kode_bagian}
                  onValueChange={(v) => setFormData({ ...formData, kode_bagian: v })}
                >
                  <SelectTrigger id="kode_bagian">
                    <SelectValue placeholder="Pilih laboratorium" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      new Map(
                        labs
                          .filter(lab => lab.kode_bagian)
                          .map(lab => [lab.kode_bagian, lab])
                      ).values()
                    ).map((lab) => (
                      <SelectItem key={lab.id_lab} value={lab.kode_bagian}>
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
                {loading ? "Menyimpan..." : editingUser ? "Perbarui" : "Tambah"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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

      {/* HEADER TABLE + SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6 mb-2">
        <h2 className="text-lg font-semibold">Daftar User</h2>

        <div className="flex items-center gap-3">
          <Input
            type="text"
            placeholder="Cari user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />

          <p className="text-sm whitespace-nowrap">
            Total: <span className="font-bold">{groupedUsers.length}</span>
            {searchTerm && (
              <> | Hasil: <span className="font-bold">{filteredUsers.length}</span></>
            )}
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Nomor</th>
              <th className="p-2 text-left">Nama</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Laboratorium</th>
              <th className="p-2 text-left">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  Tidak ada user ditemukan
                </td>
              </tr>
            ) : (
              filteredUsers.map((u: any, idx: number) => (
                <tr key={u.email} className="border-b hover:bg-muted/30">
                  <td className="p-2 font-medium">{idx + 1}</td>

                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>

                  <td className="p-2">
                    <Badge>{u.role}</Badge>
                  </td>

                  <td className="p-2">
                    {u.labs.length === 1 ? (
                      u.labs[0]
                    ) : (
                      <div className="space-y-1">
                        {u.labs.map((lab: string) => (
                          <div key={lab} className="flex justify-between items-center">
                            <span>{lab}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDeleteLab(u, lab)}
                            >
                              Hapus
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="p-2 flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(u)}>
                      <Edit className="w-4 h-4" />
                    </Button>

                    {isSuperAdmin && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(u);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
export default MasterUsers;
