import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  ArrowLeft,
  Building2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";


type Barang = {
  id?: number;
  kode_barang: string;
  nama_barang: string;
  kode_ruangan: string;
  satuan?: string;
};

type DetailPenggunaan = {
  kode_barang: string;
  quantity: number;
  barang?: Barang;
};

type Penggunaan = {
  id_penggunaan: number;
  tanggal: string;
  kode_ruangan: string;
  nama_lab?: string;
  keterangan?: string;
  detail: DetailPenggunaan[];
};

type Lab = {
  id_lab?: number; 
  nama_lab: string;
  kode_ruangan: string;
  kode_bagian: string;
  status?: string;  
  lokasi?: string;
};

type FormState = {
  kode_ruangan: string;
  tanggal: string;
  keterangan: string;
  detail: DetailPenggunaan[];
};

export default function PenggunaanBarang() {
  const { toast } = useToast();
  const { user } = useAuth();

  const isAdminLab = user?.role === "admin_lab";
  const isSuperAdmin = user?.role === "superadmin";
  const userKodeBagian = user?.kode_bagian || "";

  const [penggunaan, setPenggunaan] = useState<Penggunaan[]>([]);
  const [labList, setLabList] = useState<Lab[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [selected, setSelected] = useState<Penggunaan | null>(null);
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Penggunaan | null>(null);

  const [search, setSearch] = useState("");

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Penggunaan | null>(null);

  const [form, setForm] = useState<FormState>({
    kode_ruangan: "",
    tanggal: "",
    keterangan: "",
    detail: [],
  });

  const formatTanggal = (tgl: string) => {
    if (!tgl) return "-";
    const d = new Date(tgl);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // state untuk superadmin: lab yang dipilih (pakai kode_ruangan)
  const [selectedKodeRuangan, setSelectedKodeRuangan] = useState<string | null>(
    null
  );

  const selectedLab = useMemo(
    () =>
      selectedKodeRuangan
        ? labList.find(
            (l) =>
              String(l.kode_ruangan).toUpperCase() ===
              String(selectedKodeRuangan).toUpperCase()
          ) ?? null
        : null,
    [labList, selectedKodeRuangan]
  );

  // =========================================================
  // LOAD DATA
  // =========================================================
  const loadData = useCallback(async () => {
    console.log("MULAI FETCH /penggunaan-barang");
    setLoading(true);

    try {
      const labRes = await api.get<{ data: Lab[] }>("/labs/options");
      const labsFromApi = labRes?.data?.data ?? [];

      const aktifs = labsFromApi.filter(
        (l) => (l.status ?? "aktif").toLowerCase() === "aktif"
      );

      setLabList(aktifs);

      // Temukan lab yang dimiliki admin (pakai tipe nyata, bukan any)
      const userLab = aktifs.find(
        (l) => String(l.kode_bagian).toLowerCase() === String(userKodeBagian).toLowerCase()
      );

      const userKodeRuangan = userLab?.kode_ruangan?.toUpperCase() ?? null;

      // Fetch penggunaan dan barang — beri typing yang sesuai
      const penggunaanRes = await api.get<{ data: Penggunaan[] }>("/penggunaan-barang");

      const barangRes = isAdminLab && userKodeRuangan
        ? await api.get<{ data: Barang[] }>(`/master-barang/by-lab/${userKodeRuangan}`)
        : await api.get<{ data: Barang[] }>("/master-barang");

      const barangData: Barang[] = barangRes?.data?.data ?? [];
      setBarangList(barangData);

      const penggunaanData: Penggunaan[] = penggunaanRes?.data?.data ?? [];

      // Normalisasi detail → inject barang info
      const normalized: Penggunaan[] = penggunaanData.map((p) => ({
        ...p,
        detail: (p.detail ?? []).map((d) => ({
          ...d,
          barang:
            d.barang ??
            barangData.find((b) => b.kode_barang === d.kode_barang) ??
            undefined,
        })),
      }));

      // Filter untuk admin_lab
      const visible = isAdminLab && userKodeRuangan
        ? normalized.filter((p) => String(p.kode_ruangan).toUpperCase() === userKodeRuangan)
        : normalized;

      setPenggunaan(visible);

      // Set default lab untuk admin
      if (isAdminLab && userLab) {
        setForm((prev) => ({ ...prev, kode_ruangan: userLab.kode_ruangan }));
      }
    } catch (error: any) {
      toast({
        title: "Gagal memuat data",
        description: error?.response?.data?.message ?? error?.message ?? String(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, userKodeBagian, isAdminLab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =========================================================
  // FORM HANDLER
  // =========================================================
  const addBarang = (kode: string) => {
    if (!kode) return;

    setForm((p) => ({
      ...p,
      // selalu hanya 1 item
      detail: [
        {
          kode_barang: kode,
          quantity: p.detail[0]?.quantity ?? 1,
        },
      ],
    }));
  };

  const removeBarang = (kode: string) =>
    setForm((p) => ({
      ...p,
      detail: [],
    }));

  const updateQty = (kode: string, qty: number) =>
    setForm((p) => ({
      ...p,
      detail: p.detail.map((d) =>
        d.kode_barang === kode ? { ...d, quantity: qty < 1 ? 1 : qty } : d
      ),
    }));

  // OPEN CREATE
  const openCreateModal = () => {
    const lab = labList.find(
      (l) => String(l.kode_bagian) === String(userKodeBagian)
    );

    setEditingTarget(null);
    setForm({
      kode_ruangan: lab?.kode_ruangan ?? "",
      tanggal: "",
      keterangan: "",
      detail: [],
    });
    setIsDialogOpen(true);
  };

  // OPEN EDIT
  const openEditModal = (p: Penggunaan) => {
    setEditingTarget(p);
    setForm({
      kode_ruangan: p.kode_ruangan,
      tanggal: p.tanggal,
      keterangan: p.keterangan ?? "",
      detail: p.detail.map((d) => ({
        kode_barang: d.kode_barang,
        quantity: d.quantity,
        barang: d.barang,
      })),
    });
    setIsDialogOpen(true);
  };

  // SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.kode_ruangan || !form.tanggal || form.detail.length === 0) {
      toast({
        title: "Error",
        description: "Lengkapi semua field dan minimal 1 barang",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingTarget) {
        api
          .put(`/penggunaan-barang/${editingTarget.id_penggunaan}`, {
            tanggal: form.tanggal,
            keterangan: form.keterangan,
            detail: form.detail,
          })
          .then(() => loadData())
          .catch((err) => {
            toast({
              title: "Gagal memperbarui",
              description: err?.response?.data?.message,
              variant: "destructive",
            });
          });
      } else {
        api
          .post("/penggunaan-barang", {
            kode_ruangan: form.kode_ruangan,
            tanggal: form.tanggal,
            keterangan: form.keterangan,
            detail: form.detail,
          })
          .then(() => loadData())
          .catch((err) => {
            toast({
              title: "Gagal menyimpan",
              description: err?.response?.data?.message,
              variant: "destructive",
            });
          });
      }

      setIsDialogOpen(false);
      setEditingTarget(null);
    } catch (err: any) {
      toast({
        title: "Gagal menyimpan",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    }
  };

  // DELETE
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      api
        .delete(`/penggunaan-barang/${deleteTarget.id_penggunaan}`)
        .then(() => loadData())
        .catch((err) => {
          toast({
            title: "Gagal menghapus",
            description: err?.response?.data?.message,
            variant: "destructive",
          });
        });
      setDeleteDialog(false);
      setDeleteTarget(null);
    } catch (err: any) {
      toast({
        title: "Gagal menghapus",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    }
  };

  // =========================================================
  // DATA TABLE
  // =========================================================
  const detailRows = isAdminLab
    ? penggunaan.flatMap((p) =>
        p.detail.map((d) => ({
          id_penggunaan: p.id_penggunaan,
          tanggal: p.tanggal,
          kode_barang: d.kode_barang,
          nama_barang: d.barang?.nama_barang ?? "-",
          quantity: d.quantity,
          satuan: d.barang?.satuan ?? "-",
          keterangan: p.keterangan ?? "-",
          full_penggunaan: p,
        }))
      )
    : [];

  // Untuk superadmin: filter penggunaan berdasarkan lab yang dipilih
  const superadminFilteredPenggunaan =
    !isAdminLab && selectedLab
      ? penggunaan.filter(
          (p) =>
            String(p.kode_ruangan).toUpperCase() ===
            String(selectedLab.kode_ruangan).toUpperCase()
        )
      : [];

  // 🔹 Flatten ke level detail agar kolom jadi:
  // Tanggal | Kode Barang | Nama Barang | Qty | Satuan | Keterangan
  const superadminDetailRows = superadminFilteredPenggunaan.flatMap((p) =>
    p.detail.map((d) => ({
      tanggal: p.tanggal,
      kode_barang: d.kode_barang,
      nama_barang: d.barang?.nama_barang ?? "-",
      quantity: d.quantity,
      satuan: d.barang?.satuan ?? "-",
      keterangan: p.keterangan ?? "-",
    }))
  );

  // 🔹 Filter pencarian untuk superadmin berdasarkan kolom yang diminta
  const superadminSearchedDetailRows = superadminDetailRows.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      row.tanggal.toLowerCase().includes(q) ||
      row.kode_barang.toLowerCase().includes(q) ||
      row.nama_barang.toLowerCase().includes(q) ||
      row.keterangan.toLowerCase().includes(q)
    );
  });

  // =========================================================
  // RENDER
  // =========================================================
  if (loading)
    return (
      <p className="text-center p-6 text-muted-foreground">
        Memuat data...
      </p>
    );

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Penggunaan Barang</h1>
          {isSuperAdmin && (
            <p className="text-sm text-muted-foreground mt-1">
              {selectedLab
                ? `Lab dipilih: ${selectedLab.nama_lab} (${selectedLab.kode_ruangan})`
                : "Pilih lab terlebih dahulu untuk melihat penggunaan barang."}
            </p>
          )}
        </div>

        {isAdminLab && (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingTarget(null);
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" /> Ajukan Penggunaan
              </Button>
            </DialogTrigger>

            {/* FORM */}
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTarget
                    ? "Edit Penggunaan Barang"
                    : "Ajukan Penggunaan Barang"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Laboratorium</Label>
                    <Input value={form.kode_ruangan} disabled />
                  </div>

                  <div>
                    <Label>Tanggal</Label>
                    <Input
                      type="date"
                      value={form.tanggal}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, tanggal: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* BARANG */}
                <div>
                  <Label>Tambah Barang</Label>
                  <Select onValueChange={addBarang}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih barang..." />
                    </SelectTrigger>

                    <SelectContent>
                      {barangList.map((b) => (
                        <SelectItem key={b.kode_barang} value={b.kode_barang}>
                          {b.nama_barang} ({b.satuan ?? "unit"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.detail.length > 0 && (
                  <div className="space-y-2 border rounded-md p-3">
                    {form.detail.map((d) => {
                      const barang = barangList.find(
                        (b) => b.kode_barang === d.kode_barang
                      );

                      return (
                        <div
                          key={d.kode_barang}
                          className="flex justify-between items-center border-b py-2"
                        >
                          <div>
                            <p className="font-medium">
                              {barang?.nama_barang || d.kode_barang}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Satuan: {barang?.satuan ?? "unit"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={d.quantity}
                              onChange={(e) =>
                                updateQty(
                                  d.kode_barang,
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-20"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBarang(d.kode_barang)}
                            >
                              Hapus
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div>
                  <Label>Keterangan</Label>
                  <Textarea
                    value={form.keterangan}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, keterangan: e.target.value }))
                    }
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingTarget(null);
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingTarget ? "Simpan Perubahan" : "Ajukan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* TABLE ADMIN LAB (TIDAK DIUBAH) */}
      {isAdminLab ? (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Tanggal</th>
                <th className="p-2 text-left">Kode Barang</th>
                <th className="p-2 text-left">Nama Barang</th>
                <th className="p-2 text-left">Qty</th>
                <th className="p-2 text-left">Satuan</th>
                <th className="p-2 text-left">Keterangan</th>
                <th className="p-2 text-left">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {detailRows.map((row, i) => (
                <tr key={i} className="border-b hover:bg-muted/30">
                  <td className="p-2">{formatTanggal(row.tanggal)}</td>
                  <td className="p-2">{row.kode_barang}</td>
                  <td className="p-2">{row.nama_barang}</td>
                  <td className="p-2">{row.quantity}</td>
                  <td className="p-2">{row.satuan}</td>
                  <td className="p-2">{row.keterangan}</td>

                  <td className="p-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => openEditModal(row.full_penggunaan)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      type="button"
                      onClick={() => {
                        setDeleteTarget(row.full_penggunaan);
                        setDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // TABLE SUPERADMIN
        <>
          {/* Kalau superadmin belum pilih lab → tampilkan daftar lab */}
          {isSuperAdmin && !selectedLab && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {labList
                  .slice()
                  .sort((a, b) => String(a.nama_lab).localeCompare(String(b.nama_lab)))
                  .map((lab) => (
                    <div
                      key={lab.kode_ruangan}
                      className="p-6 border rounded-lg cursor-pointer hover:shadow-md transition-all"
                      onClick={() => setSelectedKodeRuangan(lab.kode_ruangan)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-primary/20 rounded-lg">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>

                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>

                      <h3 className="font-semibold text-lg">{lab.nama_lab}</h3>

                      <p className="text-sm text-muted-foreground">
                        {lab.kode_ruangan} — {lab.kode_bagian}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Kalau lab sudah dipilih → tampilkan tabel dengan kolom yang diminta */}
          {isSuperAdmin && selectedLab && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedKodeRuangan(null)}
                  className="shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>

                <div>
                  <h1 className="text-3xl font-bold text-primary">
                    {selectedLab.nama_lab}
                  </h1>

                  <p className="text-muted-foreground mt-1">
                    {selectedLab.kode_ruangan} – {selectedLab.kode_bagian}
                  </p>
                </div>
              </div>

              {/* SEARCH */}
              {(isAdminLab || selectedLab) && (
                <div className="w-full mt-4 px-2">
                  <Input
                    placeholder="Cari Penggunaan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-none"
                  />
                </div>
              )}

              {/* TABLE */}
              <div className="overflow-x-auto border rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Tanggal</th>
                      <th className="p-2 text-left">Kode Barang</th>
                      <th className="p-2 text-left">Nama Barang</th>
                      <th className="p-2 text-left">Qty</th>
                      <th className="p-2 text-left">Satuan</th>
                      <th className="p-2 text-left">Keterangan</th>
                    </tr>
                  </thead>

                  <tbody>
                    {superadminSearchedDetailRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-4 text-center text-muted-foreground"
                        >
                          {search
                            ? "Tidak ada penggunaan yang cocok dengan kata kunci."
                            : "Belum ada data penggunaan untuk lab ini."}
                        </td>
                      </tr>
                    ) : (
                      superadminSearchedDetailRows.map((row, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{formatTanggal(row.tanggal)}</td>
                          <td className="p-2">{row.kode_barang}</td>
                          <td className="p-2">{row.nama_barang}</td>
                          <td className="p-2">{row.quantity}</td>
                          <td className="p-2">{row.satuan}</td>
                          <td className="p-2">{row.keterangan}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL (tidak dipakai superadmin lagi, tapi dibiarkan) */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Penggunaan</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <p>
                <strong>Tanggal:</strong> {formatTanggal(selected.tanggal)}
              </p>
              <p>
                <strong>Lab:</strong>{" "}
                {selected.nama_lab ?? selected.kode_ruangan}
              </p>
              <p>
                <strong>Keterangan:</strong> {selected.keterangan ?? "-"}
              </p>

              <table className="min-w-full text-sm border rounded-md">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 border">Kode</th>
                    <th className="p-2 border">Nama</th>
                    <th className="p-2 border">Qty</th>
                    <th className="p-2 border">Satuan</th>
                  </tr>
                </thead>

                <tbody>
                  {selected.detail.map((d) => (
                    <tr key={d.kode_barang}>
                      <td className="p-2 border">{d.kode_barang}</td>
                      <td className="p-2 border">
                        {d.barang?.nama_barang ?? "-"}
                      </td>
                      <td className="p-2 border">{d.quantity}</td>
                      <td className="p-2 border">
                        {d.barang?.satuan ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM MODAL */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Penggunaan?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Penghapusan tidak dapat dibatalkan. Yakin ingin menghapus data ini?
          </p>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Batal
            </Button>

            <Button
              variant="destructive"
              type="button"
              onClick={handleDelete}
            >
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
