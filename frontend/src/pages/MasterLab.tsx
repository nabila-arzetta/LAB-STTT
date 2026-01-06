import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

type Lab = {
  id_lab: number | null;
  kode_bagian: string;
  nama_lab: string;
  lokasi: string | null;
  status: 'aktif' | 'nonaktif' | string | number | null;
};

const MasterLab: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'superadmin';
  const userKode = user?.kode_bagian ?? '';

  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nama_lab: '',
    lokasi: '',
    status: 'aktif' as 'aktif' | 'nonaktif',
    kode_bagian: '',
  });

  const fetchLabs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<{ data: Lab[] }>('/labs');
      setLabs(data?.data ?? []);
    } catch (e: any) {
      toast({
        title: 'Gagal memuat data lab',
        description: e?.response?.data?.message ?? e.message ?? 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLabs();
  }, [fetchLabs]);

  const filteredLab = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let result = labs;

    if (q) {
      result = labs.filter(l =>
        (l.nama_lab ?? '').toLowerCase().includes(q) ||
        (l.lokasi ?? '').toLowerCase().includes(q) ||
        (l.kode_bagian ?? '').toLowerCase().includes(q)
      );
    }

    if (!isSuperAdmin) {
      result = [...result].sort((a, b) => {
        const isAOwn = a.kode_bagian === userKode;
        const isBOwn = b.kode_bagian === userKode;

        if (isAOwn && !isBOwn) return -1;
        if (!isAOwn && isBOwn) return 1;
        return 0;
      });
    }

    return result;
  }, [labs, searchTerm, isSuperAdmin, userKode]);

  const isAktif = (status: string | number | null) => {
    if (status == null) return false;
    if (typeof status === 'number') return status === 1;
    return String(status).toLowerCase() === 'aktif';
  };

  const resetForm = () => {
    setFormData({ nama_lab: '', lokasi: '', status: 'aktif', kode_bagian: '' });
    setEditingLab(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama_lab || !formData.kode_bagian) {
      toast({
        title: 'Input tidak valid',
        description: 'Nama Lab dan Kode Bagian wajib diisi.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingLab) {
        // Update data
        const { data } = await api.put(`/labs/${editingLab.id_lab ?? 0}`, formData);

        setLabs((prev) =>
          prev.map((lab) =>
            lab.id_lab === editingLab.id_lab ? { ...lab, ...data.data } : lab
          )
        );

        toast({ title: 'Berhasil', description: `Laboratorium diperbarui.` });
      } else {
        // Create data
        const { data } = await api.post('/labs', formData);

        setLabs((prev) => [...prev, data.data]);

        toast({ title: 'Berhasil', description: 'Laboratorium baru berhasil ditambahkan.' });
      }

      resetForm();
    } catch (e: any) {
      toast({
        title: 'Gagal',
        description: e?.response?.data?.message ?? e?.message ?? 'Gagal menyimpan data.',
        variant: 'destructive',
      });
    }
  };

  // Edit
  const handleEdit = (lab: Lab) => {

    setEditingLab(lab);
    setFormData({
      nama_lab: lab.nama_lab ?? '',
      lokasi: lab.lokasi ?? '',
      status: isAktif(lab.status) ? 'aktif' : 'nonaktif',
      kode_bagian: lab.kode_bagian ?? '',
    });
    setIsDialogOpen(true);
  };

  // Delete
  const handleDelete = async (lab: Lab) => {
    if (!isSuperAdmin) {
      toast({
        title: 'Tidak diizinkan',
        description: 'Hanya superadmin yang bisa menghapus lab.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.delete(`/labs/${lab.id_lab ?? 0}`, {
        params: { kode_bagian: lab.kode_bagian },
      });

      setLabs((prev) => prev.filter((item) => item.id_lab !== lab.id_lab));

      toast({ title: 'Berhasil', description: `Laboratorium "${lab.nama_lab}" dihapus.` });
    } catch (e: any) {
      toast({
        title: 'Gagal menghapus',
        description: e?.response?.data?.message ?? e?.message ?? 'Error',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedLab) return;
    setSaving(true);
    try {
      await api.delete(`/labs/${selectedLab.id_lab ?? 0}`, {
        params: { kode_bagian: selectedLab.kode_bagian },
      });
      setLabs((prev) => prev.filter((item) => item.id_lab !== selectedLab.id_lab));
      toast({ title: 'Berhasil', description: `Laboratorium "${selectedLab.nama_lab}" dihapus.` });
      setIsDeleteDialogOpen(false);
      setSelectedLab(null);
    } catch (e: any) {
      toast({
        title: 'Gagal menghapus',
        description: e?.response?.data?.message ?? e?.message ?? 'Error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center pt-6">
        <p className="text-muted-foreground animate-pulse">
          Memuat data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-3 sm:px-6 lg:px-10 w-full max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          Master Laboratorium
        </h1>

        {isSuperAdmin && (
          <Button
            onClick={() => { resetForm(); setIsDialogOpen(true); }}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Lab
          </Button>
        )}
      </div>

      {/* Dialog (create dan edit) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95%] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLab ? 'Edit Laboratorium' : 'Tambah Laboratorium Baru'}</DialogTitle>
            <DialogDescription>
              {editingLab
                ? 'Perbarui informasi laboratorium Anda.'
                : 'Tambahkan laboratorium baru ke sistem.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="nama_lab">Nama Laboratorium</Label>
              <Input className="w-full"
                id="nama_lab"
                value={formData.nama_lab}
                onChange={(e) => setFormData(f => ({ ...f, nama_lab: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lokasi">Lokasi</Label>
              <Input className="w-full"
                id="lokasi"
                value={formData.lokasi}
                onChange={(e) => setFormData(f => ({ ...f, lokasi: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full border rounded-md h-9 px-3"
                value={formData.status}
                onChange={(e) =>
                  setFormData(f => ({ ...f, status: e.target.value as 'aktif' | 'nonaktif' }))
                }
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="kode_bagian">Kode Bagian</Label>
              <Input className="w-full"
                id="kode_bagian"
                value={formData.kode_bagian}
                onChange={(e) =>
                  setFormData(f => ({ ...f, kode_bagian: e.target.value.toUpperCase() }))
                }
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Batal
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                {editingLab ? 'Perbarui' : 'Tambah'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* HEADER TABLE + SEARCH */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6 mb-2">
          <h2 className="text-lg font-semibold">Daftar Laboratorium</h2>

          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="Cari laboratorium..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />

            <p className="text-sm whitespace-nowrap">
              Total Lab: <span className="font-bold">{labs.length}</span>
              {searchTerm && (
                <> | Hasil: <span className="font-bold">{filteredLab.length}</span></>
              )}
            </p>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">No</th>
                <th className="p-2 text-left">Nama Laboratorium</th>
                <th className="p-2 text-left">Lokasi</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Kode Bagian</th>
                <th className="p-2 text-left">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredLab.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    Tidak ada laboratorium ditemukan
                  </td>
                </tr>
              ) : (
                filteredLab.map((lab) => {
                  const nomor = labs.findIndex(l => l.id_lab === lab.id_lab) + 1;
                  const canEdit = isSuperAdmin || lab.kode_bagian === userKode;

                  return (
                    <tr key={lab.id_lab} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-medium">{nomor}</td>

                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-primary" />
                          {lab.nama_lab}
                        </div>
                      </td>

                      <td className="p-2">{lab.lokasi ?? '-'}</td>

                      <td className="p-2">
                        {isAktif(lab.status) ? (
                          <Badge className="bg-green-100 text-green-700 border border-green-300">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline">Nonaktif</Badge>
                        )}
                      </td>

                      <td className="p-2">
                        <Badge variant="outline">{lab.kode_bagian}</Badge>
                      </td>

                      <td className="p-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canEdit}
                          onClick={() => handleEdit(lab)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {isSuperAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedLab(lab);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={(v) => {
        if (!v) setSelectedLab(null);
        setIsDeleteDialogOpen(v);
      }}>
        <DialogContent className="w-[95%] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Laboratorium</DialogTitle>
          </DialogHeader>

          <p>
            Apakah kamu yakin ingin menghapus <b>{selectedLab?.nama_lab}</b>?
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

export default MasterLab;
