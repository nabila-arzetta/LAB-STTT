import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/DataTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Lab = {
  lab_id?: number | null;
  id_lab?: number | null;
  nama_lab: string;
  kode_bagian?: string | null;
  singkatan?: string | null;
  jumlah_barang?: number;
};

type Item = {
  id: number;
  kode_barang?: string | null;
  nama_barang: string;
  satuan?: string | null;
  kategori?: "alat" | "bahan" | string | null;
  deskripsi?: string | null;
  [k: string]: any;
};

const firstNumber = (val: unknown): number | null => {
  const n = typeof val === "number" ? val : parseInt(String(val ?? ""), 10);
  return Number.isFinite(n) ? n : null;
};

const getLabId = (lab: Lab | null | undefined): number | null =>
  lab ? (firstNumber(lab.lab_id) ?? firstNumber(lab.id_lab)) : null;

export const MasterBarang: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false); // create dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // edit dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // delete dialog

  const [saving, setSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const [suggestions, setSuggestions] = useState<Item[]>([]);

  const [autoController, setAutoController] = useState<AbortController | null>(null);

  const [debounceTimer, setDebounceTimer] = useState<any>(null);

  const [form, setForm] = useState({
    kode_barang: "",
    nama_barang: "",
    satuan: "",
    kategori: "",
    keterangan: "",
  });

  const fetchItems = async (q?: string) => {
    setLoadingItems(true);
    try {
      const params: any = {};
      if (q?.trim()) params.q = q;

      const res = await api.get("/master-barang", { params });

      const raw = Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      const mapped = raw.map((b: any) => ({
        id: b.id,
        kode_barang: b.kode_barang,
        nama_barang: b.nama_barang,
        satuan: b.satuan ?? "-",
        kategori: b.kategori ?? "alat",
        deskripsi: b.deskripsi ?? "",
      }));

      setItems(mapped);
    } catch {
      toast.error("Gagal memuat master barang");
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;

    const q = searchTerm.toLowerCase();

    return items.filter((i) => {
      const text = [
        i.kode_barang,
        i.nama_barang,
        i.satuan,
        i.kategori,
        i.deskripsi,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [items, searchTerm]);

  const totalItems = items.length;

  const columns = [
  { key: "kode_barang", header: "Kode Barang" },
  { key: "nama_barang", header: "Nama Barang" },
  {
    key: "kategori",
    header: "Kategori",
    render: (item: Item) =>
      (item.kategori ?? "").toLowerCase() === "bahan" ? (
        <Badge className="pointer-events-none !bg-blue-100 !text-blue-800 !border-blue-200 hover:!bg-blue-100 hover:!text-blue-800">
          Bahan
        </Badge>
      ) : (
        <Badge className="pointer-events-none !bg-yellow-100 !text-yellow-800 !border-yellow-200 hover:!bg-yellow-100 hover:!text-yellow-800">
          Alat
        </Badge>
      ),
  },
  { key: "satuan", header: "Satuan" },
  {
    key: "deskripsi",
    header: "Deskripsi",
    render: (item: Item) => (
      <div className="max-w-md truncate" title={item.deskripsi ?? ""}>
        {item.deskripsi ?? "-"}
      </div>
    ),
  },
];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        nama_barang: form.nama_barang.trim(),
        satuan: form.satuan || "unit",
        kategori: form.kategori,
        deskripsi: form.keterangan || "",
      };

      const res = await api.post("/master-barang", payload);
      const newItem = res.data.data;

      setItems((prev) => [...prev, newItem]);
      toast.success("Master Barang berhasil dibuat");

      setForm({
        kode_barang: "",
        nama_barang: "",
        satuan: "",
        kategori: "",
        keterangan: "",
      });
      setIsDialogOpen(false);
    } 
    catch (err: any) {
      console.error("Create error:", err);

      if (err?.response?.status === 422) {
        toast.error("Nama barang sudah terdaftar!");
      } 
      else if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } 
      else {
        toast.error("Gagal membuat Master Barang");
      }
    } 
    finally {
      setSaving(false);
    }
  };


  // Edit handler 
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSaving(true);
    try {
      const payload = {
        nama_barang: form.nama_barang,
        satuan: form.satuan,
        kategori: form.kategori,
        deskripsi: form.keterangan,
      };
      await api.put(`/master-barang/${selectedItem.id}`, payload);
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? {
                ...i,
                nama_barang: payload.nama_barang,
                satuan: payload.satuan,
                kategori: payload.kategori,
                deskripsi: payload.deskripsi,
              }
            : i
        )
      );

      toast.success("Barang berhasil diperbarui");
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      setForm({
        kode_barang: "",
        nama_barang: "",
        satuan: "",
        kategori: "",
        keterangan: "",
      });

    } catch (err) {
      console.error("Edit error:", err);
      toast.error("Gagal memperbarui barang");
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!selectedItem) return;

    setSaving(true);

    try {
      await api.delete(`/master-barang/${selectedItem.id}`);

      setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));

      toast.success("Master Barang berhasil dihapus");

      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } 
    catch (err: any) {
      console.error("Delete error:", err);

      if (err?.response?.status === 409) {
        toast.error(err.response.data.message);
      } 
      else if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } 
      else {
        toast.error("Gagal menghapus barang");
      }

      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } 
    finally {
      setSaving(false);
    }
  };

  const getLabCount = async (labId: number): Promise<number> => {
    try {
      const res = await api.get("/master-barang", { params: { id_lab: labId } });
      const data = (res && (res as any).data) ?? res;
      const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      return raw.length;
    } catch {
      return 0;
    }
  };

  if (loadingItems) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Master Barang
          </h1>
          <p className="text-muted-foreground mt-1">
            Data master barang global
          </p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);

            if (open) {
              setForm({
                kode_barang: "",
                nama_barang: "",
                satuan: "",
                kategori: "",
                keterangan: "",
              });
              setSuggestions([]);
              setSelectedItem(null);
            } else {
              if (autoController) autoController.abort();
              setAutoController(null);
              setSuggestions([]);
            }
          }}
        >

          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-light">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Barang
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Master Barang</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4">

              {/* Nama Barang */}
              <div>
                <label className="text-sm font-medium">Nama Barang</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Masukkan nama barang"
                    value={form.nama_barang}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, nama_barang: val });

                      if (debounceTimer) {
                        clearTimeout(debounceTimer);
                      }

                      // Minimal 2 huruf biar gak spam request
                      if (val.trim().length < 2) {
                        setSuggestions([]);
                        return;
                      }

                      const newTimer = setTimeout(async () => {
                        // Abort request sebelumnya
                        if (autoController) autoController.abort();

                        const controller = new AbortController();
                        setAutoController(controller);

                        try {
                          const res = await api.get("/master-barang/autocomplete", {
                            params: { q: val },
                            signal: controller.signal,
                          });

                          setSuggestions(res.data.data || []);
                        } catch (err: any) {
                          if (err.name !== "AbortError") setSuggestions([]);
                        }
                      }, 350); // <-- debounce delay

                      setDebounceTimer(newTimer);
                    }}

                    className="w-full border rounded px-3 py-2"
                  />

                  {suggestions.length > 0 && (
                    <div className="absolute z-50 bg-white border w-full rounded shadow max-h-40 overflow-y-auto">
                      {suggestions.map((s) => (
                        <div
                          key={s.id}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-muted"
                          onClick={() => {
                            setForm({ ...form, nama_barang: s.nama_barang });
                            setSuggestions([]);
                          }}
                        >
                          {s.nama_barang}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="text-sm font-medium">Kategori</label>
                <select
                  value={form.kategori}
                  onChange={(e) =>
                    setForm({ ...form, kategori: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="" disabled>
                    Pilih kategori
                  </option>
                  <option value="alat">Alat</option>
                  <option value="bahan">Bahan</option>
                </select>
              </div>

              {/* Satuan */}
              <div>
                <label className="text-sm font-medium">Satuan</label>
                <input
                  type="text"
                  placeholder="Contoh: unit, pcs, gram"
                  value={form.satuan}
                  onChange={(e) =>
                    setForm({ ...form, satuan: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-sm font-medium">Deskripsi</label>
                <textarea
                  rows={3}
                  placeholder="Masukkan deskripsi barang"
                  value={form.keterangan}
                  onChange={(e) =>
                    setForm({ ...form, keterangan: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 resize-none"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>

            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABLE */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6 mb-2">
        <h2 className="text-lg font-semibold">Daftar Master Barang</h2>

        <div className="flex items-center gap-3">
          {/* SEARCH BAR */}
          <input
            type="text"
            placeholder="Cari barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <p className="text-sm text-foreground whitespace-nowrap">
            Total Barang: <span className="font-bold">{items.length}</span>
            {searchTerm && (
              <> | Hasil: <span className="font-bold">{filteredItems.length}</span></>
            )}
          </p>
        </div>
      </div>

          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Nomor</th>
                  <th className="p-2 text-left">Nama Barang</th>
                  <th className="p-2 text-left">Kategori</th>
                  <th className="p-2 text-left">Satuan</th>
                  <th className="p-2 text-left">Deskripsi</th>
                  <th className="p-2 text-left">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      {searchTerm
                        ? "Tidak ada barang yang cocok."
                        : "Belum ada data master barang."}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    // NOMOR BERDASARKAN URUTAN DATA ASLI
                    const nomor = items.findIndex(i => i.id === item.id) + 1;

                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/30">
                        {/* NOMOR TETAP */}
                        <td className="p-2 font-medium">
                          {nomor}
                        </td>

                        <td className="p-2">{item.nama_barang}</td>
                        <td className="p-2 capitalize">{item.kategori}</td>
                        <td className="p-2">{item.satuan}</td>
                        <td className="p-2">{item.deskripsi}</td>

                        {/* EDIT & DELETE — TETAP ADA */}
                        <td className="p-2 flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving}
                            onClick={() => {
                              setSelectedItem(item);
                              setForm({
                                kode_barang: item.kode_barang ?? "",
                                nama_barang: item.nama_barang ?? "",
                                satuan: item.satuan ?? "",
                                kategori: item.kategori ?? "",
                                keterangan: item.deskripsi ?? "",
                              });
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={saving}
                            onClick={() => {
                              setSelectedItem(item);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>


            </table>
          </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Master Barang</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">

            <div>
              <label className="text-sm font-medium">Nama Barang</label>
              <input
                type="text"
                required
                value={form.nama_barang}
                onChange={(e) =>
                  setForm({ ...form, nama_barang: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Kategori</label>
              <select
                value={form.kategori}
                onChange={(e) =>
                  setForm({ ...form, kategori: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="alat">Alat</option>
                <option value="bahan">Bahan</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Satuan</label>
              <input
                type="text"
                value={form.satuan}
                onChange={(e) =>
                  setForm({ ...form, satuan: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Deskripsi</label>
              <textarea
                rows={3}
                value={form.keterangan}
                onChange={(e) =>
                  setForm({ ...form, keterangan: e.target.value })
                }
                className="w-full border rounded px-3 py-2 resize-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) setSelectedItem(null);
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Hapus Master Barang</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">
              Apakah kamu yakin ingin menghapus barang{" "}
              <span className="font-semibold text-foreground">
                {selectedItem?.nama_barang}
              </span>
              ? Data yang sudah dihapus tidak dapat dikembalikan.
            </p>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedItem(null);
                }}
              >
                Batal
              </Button>

              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={handleDelete}
              >
                {saving ? "Menghapus..." : "Hapus"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
export default MasterBarang;
