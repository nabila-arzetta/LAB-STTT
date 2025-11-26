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
  ArrowLeft,
  Package,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

/** ==== Types ==== */
type Lab = {
  lab_id?: number | null;
  id_lab?: number | null;
  nama_lab: string;
  kode_bagian?: string | null;
  singkatan?: string | null;
  status?: "aktif" | "nonaktif" | string;
  jumlah_barang?: number;
};

type Item = {
  id: number;
  kode_barang?: string | null;
  nama_barang: string;
  satuan?: string | null;
  kategori?: "alat" | "bahan" | string | null;
  deskripsi?: string | null;
  status?: "aktif" | "nonaktif" | string;
  // any other fields from backend can be present
  [k: string]: any;
};

const firstNumber = (val: unknown): number | null => {
  const n = typeof val === "number" ? val : parseInt(String(val ?? ""), 10);
  return Number.isFinite(n) ? n : null;
};

const getLabId = (lab: Lab | null | undefined): number | null =>
  lab ? (firstNumber(lab.lab_id) ?? firstNumber(lab.id_lab)) : null;

export const MasterBarang: React.FC = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false); // create dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // edit dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // delete dialog

  const [saving, setSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Form used for both create and edit (create UI preserved)
  const [form, setForm] = useState({
    kode_barang: "",
    nama_barang: "",
    satuan: "",
    kategori: "alat",
    status_barang: "aktif" as "aktif" | "nonaktif",
    keterangan: "",
  });

  /** ==== Fetch labs (onlyManage:1 as before) ==== */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingLabs(true);
        const res = await api.get<{ data?: Lab[] }>("/bagian", {
          params: { onlyManage: 1 },
        });

        if (!active) return;

        const data = (res && (res as any).data) || {};
        const list: Lab[] = Array.isArray(data.data) ? data.data : data.data ?? data;

        // langsung set tanpa filter
        setLabs(list ?? []);

        // auto select jika hanya 1 lab
        if ((list ?? []).length === 1) {
          const onlyId = getLabId(list[0]);
          if (onlyId) setSelectedLabId(onlyId);
        }
      } catch (err) {
        console.error("Fetch labs error:", err);
        setLabs([]);
        toast.error("Gagal memuat daftar lab");
      } finally {
        if (active) setLoadingLabs(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Ambil user
  const { user: authUser } = useAuth();

  // Auto pilih lab untuk admin
  useEffect(() => {
    if (!authUser) return;
    if (authUser.role !== "admin_lab") return;
    if (labs.length === 0) return;

    const labUser = labs.find(
      (l) =>
        String(l.kode_bagian).toUpperCase() ===
        String(authUser.kode_bagian).toUpperCase()
    );

    if (labUser) {
      const id = getLabId(labUser);
      if (id) setSelectedLabId(id); // Langsung buka tabel
    }
  }, [labs, authUser]);


  /** ==== Fetch items for selected lab ==== */
  const fetchItems = async (labId: number | null, q?: string): Promise<void> => {
    if (!labId) return;
    setLoadingItems(true);
    try {
      const params: Record<string, string | number> = { id_lab: labId };
      if (q && q.trim()) params.q = q.trim();
      const res = await api.get("/master-barang", { params });
      console.log("Fetch items response:", res);
      // backend returns either array or {data: array}
      const data = (res && (res as any).data) ?? res;
      const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const mapped: Item[] = raw.map((b: any) => ({
        id: b.id,
        kode_barang: b.kode_barang,
        nama_barang: b.nama_barang,
        satuan: b.satuan ?? "-",
        kategori: b.kategori ?? b.kategori?.toLowerCase?.() ?? "alat",
        deskripsi: b.deskripsi ?? b.keterangan ?? "",
        status: b.status ?? "aktif",
        ...b,
      }));
      setItems(mapped);
    } catch (err) {
      console.error("Fetch items error:", err);
      toast.error("Gagal memuat barang");
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  // debounce-ish fetch when selectedLabId or searchTerm changes
  useEffect(() => {
    if (!selectedLabId) return;
    const t = setTimeout(() => void fetchItems(selectedLabId, searchTerm), 250);
    return () => clearTimeout(t);
  }, [selectedLabId, searchTerm]);

  const selectedLab = useMemo(() => {
    if (!selectedLabId) return null;
    return labs.find((l) => getLabId(l) === selectedLabId) ?? null;
  }, [labs, selectedLabId]);

  /** ---- FILTER ALL COLUMNS (FAST SEARCH FE) ---- */
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
        i.status,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [items, searchTerm]);

  /** ---- FASTER STATS (NO WAITING) ---- */
  const totalItems = filteredItems.length;
  const activeItems = filteredItems.filter(
    (i) => (i.status ?? "").toLowerCase() === "aktif"
  ).length;

  /** ==== Table columns (including deskripsi) ==== */
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
  {
    key: "status",
    header: "Status",
    render: (item: Item) =>
      (item.status ?? "").toLowerCase() === "aktif" ? (
        <Badge className="pointer-events-none !bg-green-100 !text-green-800 !border-green-200 hover:!bg-green-100 hover:!text-green-800">
          Aktif
        </Badge>
      ) : (
        <Badge className="pointer-events-none !bg-red-100 !text-red-800 !border-red-200 hover:!bg-red-100 hover:!text-red-800">
          Non-Aktif
        </Badge>
      ),
  },
];


  /** ==== Create handler (UI preserved) ==== */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        kode_barang: form.kode_barang,
        nama_barang: form.nama_barang,
        satuan: form.satuan || "unit",
        kategori: form.kategori,
        deskripsi: form.keterangan || "",
        kode_ruangan: selectedLab?.kode_bagian ?? "-",
        id_lab: selectedLabId,
      };
      const res = await api.post("/master-barang", payload);
      // backend might return {message, data} or the item directly
      const returned = (res && (res as any).data) ?? res;
      const item = Array.isArray(returned) ? returned[0] : returned.data ?? returned;
      // normalize
      const newItem: Item = {
        id: item.id,
        kode_barang: item.kode_barang,
        nama_barang: item.nama_barang,
        satuan: item.satuan ?? form.satuan ?? "-",
        kategori: item.kategori ?? form.kategori ?? "alat",
        deskripsi: item.deskripsi ?? item.keterangan ?? form.keterangan ?? "",
        status: item.status ?? form.status_barang ?? "aktif",
        ...item,
      };
      // push to current list
      setItems((prev) => [...prev, newItem]);
      toast.success("Master Barang berhasil dibuat");

      // reset form (preserve same form shape)
      setForm({
        kode_barang: "",
        nama_barang: "",
        satuan: "",
        kategori: "alat",
        status_barang: "aktif",
        keterangan: "",
      });
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error("Create error:", err);
      // if MySQL enum error from backend, give readable message
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else toast.error("Gagal membuat Master Barang");
    } finally {
      setSaving(false);
    }
  };

  /** ==== Edit handler (dialog) ==== */
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
        status: form.status_barang,
      };
      await api.put(`/master-barang/${selectedItem.id}`, payload);
      // update local
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? { ...i, nama_barang: form.nama_barang, satuan: form.satuan, kategori: form.kategori, deskripsi: form.keterangan, status: form.status_barang }
            : i
        )
      );
      toast.success("Barang berhasil diperbarui");
      setIsEditDialogOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error("Edit error:", err);
      toast.error("Gagal memperbarui barang");
    } finally {
      setSaving(false);
    }
  };

  /** ==== Delete handler (dialog) ==== */
  const handleDelete = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      await api.delete(`/master-barang/${selectedItem.id}`);
      setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
      toast.success("Master Barang berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Gagal menghapus barang");
    } finally {
      setSaving(false);
    }
  };

  // helper: render lab card's jumlah barang (prefer lab.jumlah_barang if present)
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

  return (
    <div className="space-y-6">
      {/* Header when no lab selected */}
      {!selectedLabId ? (
        <>
          <div>
            <h1 className="text-3xl font-bold text-primary">Master Barang</h1>
            <p className="text-muted-foreground mt-1">
              Pilih laboratorium untuk melihat daftar barang.
            </p>
          </div>

          {loadingLabs ? (
            <div className="text-sm text-muted-foreground">Memuat daftar lab…</div>
          ) : labs.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Tidak ada lab aktif yang bisa diakses akun ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {labs.map((lab) => {
                const id = getLabId(lab);
                return (
                  <Card
                    key={id ?? lab.nama_lab}
                    className="shadow-card hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => id && setSelectedLabId(id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-primary mb-2">
                            {lab.nama_lab}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {lab.singkatan ?? lab.kode_bagian ?? "-"}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package className="w-4 h-4" />
                            <span>
                              {/* prefer jumlah_barang from lab if available, else show '—' until user opens it (we don't call API here to avoid double fetching) */}
                              {typeof lab.jumlah_barang === "number"
                                ? `${lab.jumlah_barang} barang`
                                : "— barang"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* When a lab is selected: header + stats + table */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* TOMBOL BACK HANYA UNTUK SUPERADMIN */}
              {authUser?.role === "superadmin" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedLabId(null)}
                  className="shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}

              <div>
                <h1 className="text-2xl font-bold text-primary">
                  {selectedLab?.nama_lab ?? "Lab"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {selectedLab?.kode_ruangan} — {selectedLab?.kode_bagian}
                </p>
              </div>
            </div>

            {/* Create dialog (UI preserved; added kategori select) */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary-light">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Barang
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tambah Master Barang</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleCreate} className="py-4 space-y-4">

                  {/* Kode Barang */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="kode_barang" className="text-sm font-medium">
                        Kode Barang
                      </label>
                      <input
                        id="kode_barang"
                        name="kode_barang"
                        type="text"
                        required
                        value={form.kode_barang}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, kode_barang: e.target.value }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Misal: BRG-BHS-001"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="nama_barang" className="text-sm font-medium">
                        Nama Barang
                      </label>
                      <input
                        id="nama_barang"
                        name="nama_barang"
                        type="text"
                        required
                        value={form.nama_barang}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, nama_barang: e.target.value }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Misal: Speaker Aktif"
                      />
                    </div>
                  </div>

                  {/* Satuan - Kategori - Status */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="satuan" className="text-sm font-medium">
                        Satuan
                      </label>
                      <input
                        id="satuan"
                        name="satuan"
                        type="text"
                        value={form.satuan}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, satuan: e.target.value }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Unit, Pcs, Set..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="kategori" className="text-sm font-medium">
                        Kategori
                      </label>
                      <select
                        id="kategori"
                        name="kategori"
                        value={form.kategori}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, kategori: e.target.value }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="alat">Alat</option>
                        <option value="bahan">Bahan</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="status_barang" className="text-sm font-medium">
                        Status
                      </label>
                      <select
                        id="status_barang"
                        name="status_barang"
                        value={form.status_barang}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            status_barang: e.target.value as "aktif" | "nonaktif",
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Non-Aktif</option>
                      </select>
                    </div>
                  </div>

                  {/* Keterangan */}
                  <div className="space-y-2">
                    <label htmlFor="keterangan" className="text-sm font-medium">
                      Keterangan
                    </label>
                    <textarea
                      id="keterangan"
                      name="keterangan"
                      rows={3}
                      value={form.keterangan}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, keterangan: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg resize-none"
                      placeholder="Contoh: Barang baru diterima dari vendor"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={saving} className="bg-primary">
                      {saving ? "Menyimpan..." : "Simpan Barang"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/20 rounded-lg">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Barang</p>
                    <p className="text-2xl font-bold">{loadingItems ? "…" : totalItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-success/20 rounded-lg">
                    <Package className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Barang Aktif</p>
                    <p className="text-2xl font-bold">{loadingItems ? "…" : activeItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Daftar Master Barang</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredItems}
                columns={columns}
                actions={(item: Item) => (
                  <div className="flex items-center gap-1">

                    {/* EDIT */}
                    <Button
                      size="icon"
                      variant="outline"
                      disabled={saving}
                      title="Edit Barang"
                      onClick={() => {
                        setSelectedItem(item);
                        setForm({
                          kode_barang: item.kode_barang ?? "",
                          nama_barang: item.nama_barang ?? "",
                          satuan: item.satuan ?? "",
                          kategori: (item.kategori as any) ?? "alat",
                          status_barang: (item.status as any) ?? "aktif",
                          keterangan: item.deskripsi ?? item.keterangan ?? "",
                        });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>

                    {/* DELETE */}
                    <Button
                      size="icon"
                      variant="destructive"
                      disabled={saving}
                      title="Hapus Barang"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                  </div>
                )}
                searchPlaceholder="Cari kode, nama, kategori, satuan..."
                onSearch={setSearchTerm}
                searchTerm={searchTerm}
                emptyMessage={
                  loadingItems
                    ? "Memuat data…"
                    : searchTerm
                    ? "Tidak ada data cocok."
                    : "Belum ada data master barang"
                }
              />
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={(v) => { if (!v) { setSelectedItem(null); } setIsEditDialogOpen(v); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Barang</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4 py-2">

                {/* Nama Barang */}
                <div className="space-y-2">
                  <label htmlFor="edit_nama_barang" className="text-sm font-medium">
                    Nama Barang
                  </label>
                  <input
                    id="edit_nama_barang"
                    name="edit_nama_barang"
                    type="text"
                    required
                    value={form.nama_barang}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nama_barang: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit_satuan" className="text-sm font-medium">
                      Satuan
                    </label>
                    <input
                      id="edit_satuan"
                      name="edit_satuan"
                      type="text"
                      value={form.satuan}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, satuan: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit_kategori" className="text-sm font-medium">
                      Kategori
                    </label>
                    <select
                      id="edit_kategori"
                      name="edit_kategori"
                      value={form.kategori}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, kategori: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="alat">Alat</option>
                      <option value="bahan">Bahan</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit_keterangan" className="text-sm font-medium">
                    Keterangan
                  </label>
                  <textarea
                    id="edit_keterangan"
                    name="edit_keterangan"
                    rows={3}
                    value={form.keterangan}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, keterangan: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit_status_barang" className="text-sm font-medium">
                    Status
                  </label>
                  <select
                    id="edit_status_barang"
                    name="edit_status_barang"
                    value={form.status_barang}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        status_barang: e.target.value as "aktif" | "nonaktif",
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-Aktif</option>
                  </select>
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

          {/* Delete Dialog */}
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={(open) => {
              setIsDeleteDialogOpen(open);
              if (!open) setSelectedItem(null);
            }}
          >
            <DialogContent className="max-w-sm text-center" aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>Hapus Barang?</DialogTitle>
              </DialogHeader>

              <p className="text-sm text-muted-foreground">
                Apakah kamu yakin ingin menghapus <b>{selectedItem?.nama_barang}</b>?
              </p>

              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Batal
                </Button>

                <Button
                  variant="destructive"
                  disabled={saving}
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    "Menghapus..."
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default MasterBarang;
