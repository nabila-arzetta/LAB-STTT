import React, { useCallback, useEffect, useMemo, useState} from "react";
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
  Pencil, 
  Trash2, 
  ArrowLeft, 
  Building2,
  ChevronRight 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type Barang = {
  kode_barang: string;
  nama_barang: string;
  satuan?: string;
};

type DetailPermintaan = {
  kode_barang: string;
  qty_diminta: number;
  qty_dikirim?: number;
  qty_diterima?: number;   
  barang?: Barang;
};

type Permintaan = {
  id_permintaan: number;
  tanggal: string;
  kode_ruangan: string;
  nama_lab?: string;
  keterangan?: string;
  status: "menunggu" | "dikirim" | "selesai";
  detail: DetailPermintaan[];
};

type DetailPenerimaan = {
  kode_barang: string;
  quantity: number;   
  barang?: Barang;
};

type Penerimaan = {
  id_penerimaan: number;
  tanggal: string;
  kode_ruangan: string;
  nama_lab?: string;
  keterangan?: string;
  detail: DetailPenerimaan[];
};

type Lab = {
  id_lab: number;
  nama_lab: string;
  kode_ruangan: string;
  kode_bagian: string;
};

type FormState = {
  kode_ruangan: string;
  tanggal: string;
  keterangan: string;
  detail: DetailPenerimaan[];
};

export default function Logistik() {
  const { toast } = useToast();
  const { user } = useAuth();

  const isAdminLab = user?.role === "admin_lab";
  const isSuperAdmin = user?.role === "superadmin";
  const isLogistik = user?.role === "logistik";

  const userLabKode = user?.kode_bagian || "";

  const [listPermintaan, setListPermintaan] = useState<Permintaan[]>([]);
  const [listPenerimaan, setListPenerimaan] = useState<Penerimaan[]>([]);

  const [selectedBarangNama, setSelectedBarangNama] = useState<string | null>(null);

  const [labList, setLabList] = useState<Lab[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingTarget, setEditingTarget] = useState<Penerimaan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [accDialog, setAccDialog] = useState(false);
  const [accTarget, setAccTarget] = useState<Permintaan | null>(null);

  const [selectKey, setSelectKey] = useState(0);

  const [filterTanggalAwal, setFilterTanggalAwal] = useState("");
  const [filterTanggalAkhir, setFilterTanggalAkhir] = useState("");
  const [filterKodeBarang, setFilterKodeBarang] = useState("");

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Penerimaan | null>(null);

  const [selectedKodeRuangan, setSelectedKodeRuangan] =
    useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    kode_ruangan: "",
    tanggal: "",
    keterangan: "",
    detail: [],
  });

  const [formPermintaan, setFormPermintaan] = useState({
    tanggal: "",
    keterangan: "",
    detail: [] as {
      kode_barang: string;
      qty_diminta: number;
      barang?: Barang;
    }[],
  });

  const [editingPermintaan, setEditingPermintaan] = useState<Permintaan | null>(null);
  const [permintaanDialogOpen, setPermintaanDialogOpen] = useState(false);

  const selectedLab = useMemo(
    () =>
      selectedKodeRuangan
        ? labList.find(
            (l) =>
              String(l.kode_ruangan).toUpperCase() ===
              String(selectedKodeRuangan).toUpperCase()
          ) ?? null
        : null,
    [selectedKodeRuangan, labList]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // ================= LAB =================
      const labRes = await api.get("/labs/options");
      const labs: Lab[] = labRes.data.data ?? [];
      setLabList(labs);

      const userLab = labs.find(
        l =>
          String(l.kode_bagian).toUpperCase() ===
          String(userLabKode).toUpperCase()
      );

      const userRuangan = userLab?.kode_ruangan?.toUpperCase() ?? null;

      // ================= BARANG =================
      const barangRes = await api.get<{ data: Barang[] }>("/master-barang");
      const barangData: Barang[] = barangRes.data.data;
      setBarangList(barangData);

      // ================= PERMINTAAN =================
      const permintaanRes = await api.get("/permintaan-logistik");
      const rawPermintaan: Permintaan[] = permintaanRes.data.data ?? [];

      const normalizedPermintaan: Permintaan[] = rawPermintaan.map(p => ({
        ...p,
        detail: p.detail.map(d => ({
          ...d,
          barang: barangData.find(b => b.kode_barang === d.kode_barang),
        })),
      }));

      setListPermintaan(normalizedPermintaan);

      // ================= PENERIMAAN =================
      const penerimaanRes = await api.get("/penerimaan-logistik");
      const rawPenerimaan: Penerimaan[] = penerimaanRes.data.data ?? [];

      const normalizedPenerimaan: Penerimaan[] = rawPenerimaan.map(p => ({
        ...p,
        detail: p.detail.map(d => ({
          kode_barang: d.kode_barang,
          quantity: d.quantity, // AMBIL DARI API
          barang: barangData.find(b => b.kode_barang === d.kode_barang),
        }))
      }));


      if (isAdminLab && userRuangan) {
        setListPenerimaan(
          normalizedPenerimaan.filter(
            p => p.kode_ruangan?.toUpperCase() === userRuangan
          )
        );
      } else {
        setListPenerimaan(normalizedPenerimaan);
      }

      if (isAdminLab && userLab) {
        setForm(prev => ({
          ...prev,
          kode_ruangan: userLab.kode_ruangan,
        }));
      }
    } catch (err: any) {
      toast({
        title: "Gagal memuat data",
        description: err?.response?.data?.message ?? err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userLabKode, isAdminLab, toast]);


  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTanggal = (tgl: string) => {
    if (!tgl) return "-";
    const d = new Date(tgl);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // FORM HANDLING
  const addBarang = (kode: string) => {
    if (!kode) return;

    const barang = barangList.find((b) => b.kode_barang === kode);
    if (!barang) return;

    setSelectedBarangNama(barang.nama_barang);

    setForm((prev) => ({
      ...prev,
      detail: [
        {
          kode_barang: kode,
          quantity: 1,
          barang,
        },
      ],
    }));
  };

  const addBarangPermintaan = (kode: string) => {
   if (editingPermintaan) return;
    const barang = barangList.find(b => b.kode_barang === kode);
    if (!barang) return;

    setFormPermintaan(prev => ({
      ...prev,
      detail: [
        ...prev.detail,
        {
          kode_barang: kode,
          qty_diminta: 1,
          barang
        }
      ]
    }));

    setSelectKey(prev => prev + 1);
  };


  const updateQtyPermintaan = (kode: string, qty: number) => {
    setFormPermintaan(prev => ({
      ...prev,
      detail: prev.detail.map(d =>
        d.kode_barang === kode
          ? { ...d, qty_diminta: qty < 1 ? 1 : qty }
          : d
      )
    }));
  };

  const removeBarangPermintaan = (kode: string) => {
    setFormPermintaan(prev => ({
      ...prev,
      detail: prev.detail.filter(d => d.kode_barang !== kode)
    }));
  };


  const removeBarang = () =>
    setForm((p) => {
      setSelectedBarangNama(null); 
      return {
        ...p,
        detail: [],
      };
    });

  const updateQty = (qty: number) =>
    setForm((p) => ({
      ...p,
      detail: p.detail.map((d) => ({
        ...d,
        quantity: qty < 1 ? 1 : qty, 
      })),
    }));

  const openCreate = () => {
    const lab = labList.find(
      (l) => String(l.kode_bagian) === String(userLabKode)
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

  const openEdit = (p: Penerimaan) => {
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
        await api.put(`/penerimaan-logistik/${editingTarget.id_penerimaan}`, {
          tanggal: form.tanggal,
          keterangan: form.keterangan,
          detail: form.detail.map(d => ({
            kode_barang: d.kode_barang,
            quantity: d.quantity,
          })),
        });
      } else {
        await api.post("/penerimaan-logistik", {
          kode_ruangan: form.kode_ruangan,
          tanggal: form.tanggal,
          keterangan: form.keterangan,
          detail: form.detail.map(d => ({
            kode_barang: d.kode_barang,
            quantity: d.quantity,
          })),
        });
      }

      setIsDialogOpen(false);
      setEditingTarget(null);
      loadData();

    } catch (err: any) {
      toast({
        title: "Gagal menyimpan",
        description: err?.response?.data?.message ?? err.message,
        variant: "destructive",
      });
    }
  };


  const handleSubmitPermintaan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formPermintaan.tanggal || formPermintaan.detail.length === 0) {
      toast({
        title: "Error",
        description: "Lengkapi tanggal & minimal 1 barang",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.post("/permintaan-logistik", {
        kode_ruangan: form.kode_ruangan,
        tanggal: formPermintaan.tanggal,
        keterangan: formPermintaan.keterangan,
        detail: formPermintaan.detail.map(d => ({
          kode_barang: d.kode_barang,
          qty_diminta: d.qty_diminta
        }))
      });

      toast({ title: "Permintaan berhasil dikirim" });

      setFormPermintaan({
        tanggal: "",
        keterangan: "",
        detail: [],
      });

      loadData();

    } catch (err: any) {
      toast({
        title: "Gagal mengirim permintaan",
        description: err?.response?.data?.message ?? err.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdatePermintaan = async () => {
    if (!editingPermintaan) return;

    try {
      await api.put(`/permintaan-logistik/${editingPermintaan.id_permintaan}`, {
        tanggal: formPermintaan.tanggal,
        keterangan: formPermintaan.keterangan,
        detail: formPermintaan.detail.map(d => ({
          kode_barang: d.kode_barang,
          qty_diminta: d.qty_diminta,
        })),
      });

      toast({ title: "Permintaan berhasil diperbarui" });

      setEditingPermintaan(null);
      setPermintaanDialogOpen(false);

      setFormPermintaan({ tanggal: "", keterangan: "", detail: [] });

      loadData();

    } catch (err: any) {
      toast({
        title: "Gagal memperbarui",
        description: err?.response?.data?.message ?? err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePermintaan = async (id: number) => {
    try {
      await api.delete(`/permintaan-logistik/${id}`);

      toast({ title: "Permintaan berhasil dihapus" });
      loadData();
    } catch (err: any) {
      toast({
        title: "Gagal menghapus",
        description: err?.response?.data?.message ?? err.message,
        variant: "destructive",
      });
    }
  };

  // =======================
  // LOGISTIK → KIRIM BARANG
  // =======================
  const handleKirim = async (p: Permintaan) => {
    try {
      await api.put(`/permintaan-logistik/${p.id_permintaan}/kirim`, {
        detail: p.detail.map(d => ({
          kode_barang: d.kode_barang,
          qty_dikirim: d.qty_dikirim ?? Number(d.qty_diminta)
        }))
      });

      toast({ title: "Barang berhasil dikirim" });
      loadData();
    } catch (err: any) {
      toast({
        title: "Gagal kirim",
        description: err?.response?.data?.message ?? err.message,
        variant: "destructive"
      });
    }
  };

  // =======================
  // ADMIN LAB → ACC
  // =======================
  const handleAcc = async (p: Permintaan) => {
    try {
      await api.put(`/permintaan-logistik/${p.id_permintaan}/acc`, {
        detail: p.detail.map(d => ({
          kode_barang: d.kode_barang,
          qty_diterima: d.qty_diterima ?? d.qty_dikirim ?? d.qty_diminta
        }))
      });

      toast({ title: "Permintaan terkonfirmasi" });
      loadData();

    } catch (err: any) {
      toast({
        title: "Gagal ACC",
        description: err?.response?.data?.message ?? err.message,
        variant: "destructive"
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await api.delete(
        `/penerimaan-logistik/${deleteTarget.id_penerimaan}`
      );

      loadData();
      setDeleteDialog(false);
      setDeleteTarget(null);
    } catch (err: any) {
      toast({
        title: "Gagal menghapus",
        description: err?.response?.data?.message ?? err.message,
        variant: "destructive",
      });
    }
  };

  const detailRows = listPenerimaan.flatMap(p =>
    p.detail.map(d => {
      const permintaanMatch = listPermintaan.find(
        pm =>
          pm.kode_ruangan === p.kode_ruangan &&
          pm.detail.some(x => x.kode_barang === d.kode_barang)
      );

      const detailPermintaanMatch = permintaanMatch?.detail.find(
        x => x.kode_barang === d.kode_barang
      );

      return {
        ...d,
        tanggal: p.tanggal,
        keterangan: p.keterangan,
        qty_diminta: detailPermintaanMatch?.qty_diminta ?? 0, 
      };
    })
  );

  const permintaanByLab = useMemo(() => {
    if (!isSuperAdmin) return {};

    return listPermintaan.reduce((acc, p) => {
      const key = p.kode_ruangan;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {} as Record<string, Permintaan[]>);
  }, [isSuperAdmin, listPermintaan]);


  const filteredPenerimaanByLab = useMemo(() => {
    if (!isSuperAdmin || !selectedLab) return [];

    return listPenerimaan.filter(
      (p) =>
        String(p.kode_ruangan).toUpperCase() ===
        String(selectedLab.kode_ruangan).toUpperCase()
    );
  }, [isSuperAdmin, selectedLab, listPenerimaan]);

  const flatSuperRows = filteredPenerimaanByLab.flatMap((p) =>
    p.detail.map((d) => ({
      tanggal: p.tanggal,
      kode_barang: d.kode_barang,
      nama_barang: d.barang?.nama_barang ?? "-",
      quantity: d.quantity,
      satuan: d.barang?.satuan ?? "-",
      keterangan: p.keterangan ?? "-",
    }))
  );

  const superSearched = flatSuperRows.filter((row) => {
    const q = search.toLowerCase();

    const matchSearch =
      !search ||
      row.tanggal.toLowerCase().includes(q) ||
      String(row.kode_barang || "").toLowerCase().includes(q) ||
      row.nama_barang.toLowerCase().includes(q) ||
      row.keterangan.toLowerCase().includes(q);

    // tanggal
    const dt = new Date(row.tanggal);
    const awalOk =
      !filterTanggalAwal || dt >= new Date(filterTanggalAwal);
    const akhirOk =
      !filterTanggalAkhir || dt <= new Date(filterTanggalAkhir);

    // filter kode barang
    const kodeOk =
      !filterKodeBarang ||
      String(row.kode_barang || "")
        .toLowerCase()
        .includes(filterKodeBarang.toLowerCase());

    return matchSearch && awalOk && akhirOk && kodeOk;
  });

  const isEditing = editingPermintaan !== null;

  if (loading)
    return (
      <p className="text-center p-6 text-muted-foreground">
        Memuat data...
      </p>
    );

  return (
    <div className="space-y-6 w-full max-w-full">

      {isAdminLab && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <h2 className="text-2xl font-bold mb-4">Form Permintaan Logistik</h2>

          <form onSubmit={handleSubmitPermintaan} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tanggal Permintaan</Label>
                <Input
                  type="date"
                  value={formPermintaan.tanggal}
                  onChange={e =>
                    setFormPermintaan(p => ({ ...p, tanggal: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Pilih Barang</Label>
              <Select
                key={selectKey}
                onValueChange={addBarangPermintaan}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih barang..." />
                </SelectTrigger>
                <SelectContent>
                  {barangList.map(b => (
                    <SelectItem key={b.kode_barang} value={b.kode_barang}>
                      {b.nama_barang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formPermintaan.detail.map(d => (
              <div
                key={d.kode_barang}
                className="border p-3 rounded-lg space-y-1"
              >
                <p className="font-semibold">{d.barang?.nama_barang}</p>
                <p className="text-xs text-muted">Satuan: {d.barang?.satuan}</p>

                <div className="flex items-center gap-2">
                  <Label className="text-sm">Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    value={d.qty_diminta}
                    onChange={(e) =>
                      updateQtyPermintaan(d.kode_barang, Number(e.target.value))
                    }
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeBarangPermintaan(d.kode_barang)}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            ))}

            <div>
              <Label>Keterangan</Label>
              <Textarea
                value={formPermintaan.keterangan}
                onChange={e =>
                  setFormPermintaan(p => ({ ...p, keterangan: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit">Kirim Permintaan</Button>
            </div>
          </form>
        </div>
      )}

      {/* ===== TABEL PERMINTAAN ADMIN LAB ===== */}
        {isAdminLab && listPermintaan.filter(p =>
            p.kode_ruangan === form.kode_ruangan &&
            p.status !== "selesai"
          ).length > 0 && (
            <div className="border rounded-lg">
              <div className="p-3 font-semibold bg-muted">
                Daftar Permintaan Logistik
              </div>

              <div className="space-y-4 p-4">
                {listPermintaan
                  .filter(p =>
                    p.kode_ruangan === form.kode_ruangan &&
                    p.status !== "selesai"
                  )
                  .map((p) => (
                    <div
                      key={p.id_permintaan}
                      className="bg-white text-gray-900 rounded-xl p-5 shadow space-y-3"
                    >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-black">
                          Tanggal: {formatTanggal(p.tanggal)}
                        </p>

                        {p.keterangan && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Keterangan: {p.keterangan}
                          </p>
                        )}
                      </div>

                      <span className={`px-3 py-1 text-xs rounded-full text-white 
                        ${p.status === "menunggu" ? "bg-orange-500" :
                          p.status === "dikirim" ? "bg-blue-500" :
                          "bg-green-600"}`}>
                        {p.status}
                      </span>
                    </div>

                    {/* LIST BARANG */}
                    <div className="pl-2 border-l-2 space-y-2">
                      {p.detail.map((d, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <div>
                            <p className="font-medium">{d.barang?.nama_barang}</p>
                            <p className="text-xs text-black">
                              {d.qty_diminta} {d.barang?.satuan}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* BUTTON ACTION */}
                    <div className="flex justify-end gap-2">

                      {/* TOMBOL EDIT (hanya status menunggu) */}
                      {isAdminLab && p.status === "menunggu" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPermintaan(p);
                              setFormPermintaan({
                                tanggal: p.tanggal,
                                keterangan: p.keterangan ?? "",
                                detail: p.detail.map(d => ({
                                  kode_barang: d.kode_barang,
                                  qty_diminta: d.qty_diminta,
                                  barang: d.barang,
                                }))
                              });
                              setPermintaanDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePermintaan(p.id_permintaan)}
                          >
                            Hapus
                          </Button>
                        </>
                      )}

                      {isLogistik && p.status === "menunggu" && (
                        <Button size="sm" onClick={() => handleKirim(p)}>Kirim</Button>
                      )}

                      {isAdminLab && p.status === "dikirim" && (
                        <Button size="sm" onClick={() => { setAccTarget(p); setAccDialog(true); }}>
                          Konfirmasi
                        </Button>
                      )}
                    </div>

                  </div>
                ))}

              {/* Jika tidak ada permintaan */}
              {listPermintaan.filter(p => p.kode_ruangan === form.kode_ruangan).length === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Belum ada permintaan dari laboratorium Anda.
                </p>
              )}
            </div>
          </div>
        )}

        
      {/* HEADER GLOBAL — JANGAN TAMPILKAN JIKA SUPERADMIN SEDANG MELIHAT LAB */}
        {!(isSuperAdmin && selectedLab) && (
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {isLogistik ? "Permintaan Logistik" : "Penerimaan Logistik"}
              </h1>
            </div>
          </div>
        )}

        {isAdminLab && (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingTarget(null);
            }}
          >
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTarget ? "Edit Penerimaan Logistik" : "Tambah Penerimaan Logistik"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* LAB */}
                  <div>
                    <Label htmlFor="formLab">Laboratorium</Label>
                    <Input
                      id="formLab"
                      name="formLab"
                      value={form.kode_ruangan}
                      disabled
                    />
                  </div>

                  {/* Tanggal */}
                  <div>
                    <Label htmlFor="formTanggal">Tanggal</Label>
                    <Input
                      id="formTanggal"
                      name="formTanggal"
                      type="date"
                      value={form.tanggal}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          tanggal: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* BARANG */}
                <div>
                  <Label htmlFor="selectBarang">Pilih Barang</Label>
                  <Select onValueChange={addBarang}>
                    <SelectTrigger id="selectBarang" name="selectBarang">
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
                  {selectedBarangNama && (
                    <p className="text-sm text-black font-medium mt-1">
                      Barang dipilih: {selectedBarangNama}
                    </p>
                  )}
                </div>

                {/* LIST BARANG */}
                {form.detail.length > 0 && (
                  <div className="border rounded-md p-3 space-y-2">
                    {form.detail.map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b py-2">
                        <div>
                          <p className="font-semibold">
                            {d.barang?.nama_barang || d.kode_barang}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {d.barang?.satuan}
                          </p>
                        </div>

                        <div className="flex gap-2 items-center">
                          <Label htmlFor={`qty-${idx}`} className="sr-only">
                            Qty
                          </Label>

                          <Input
                            id={`qty-${idx}`}
                            type="number"
                            min={1}
                            value={d.quantity} 
                            onChange={(e) => updateQty(+e.target.value)}
                            className="w-20"
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeBarang}
                          >
                            Hapus
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* KETERANGAN */}
                <div>
                  <Label htmlFor="formKeterangan">Keterangan</Label>
                  <Textarea
                    id="formKeterangan"
                    name="formKeterangan"
                    value={form.keterangan}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        keterangan: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingTarget ? "Simpan Perubahan" : "Simpan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

      {/* TABLE ADMIN */}
      {isAdminLab ? (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Tanggal</th>
                <th className="p-2 text-left">Nama Barang</th>
                <th className="p-2 text-left">Qty Diminta</th> 
                <th className="p-2 text-left">Qty Diterima</th>
                <th className="p-2 text-left">Satuan</th>
                <th className="p-2 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row, i) => (
                <tr key={i} className="border-b hover:bg-muted/40">
                  <td className="p-2">{formatTanggal(row.tanggal)}</td>
                  <td className="p-2">{row.barang?.nama_barang}</td>
                  <td className="p-2">{row.qty_diminta}</td>   
                  <td className="p-2">{row.quantity}</td>     
                  <td className="p-2">{row.barang?.satuan}</td>
                  <td className="p-2">{row.keterangan}</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
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
                          <Building2 className="w-6 h-6 text-black" />
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

          {isSuperAdmin && selectedLab && (
            <div className="space-y-6">

              {/* HEADER SUPERADMIN */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedKodeRuangan(null)}
                  className="shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>

                <div>
                  <h1 className="text-2xl font-bold">{selectedLab.nama_lab}</h1>
                  <p className="text-muted-foreground text-sm">
                    {selectedLab.kode_ruangan} — {selectedLab.kode_bagian}
                  </p>
                </div>
              </div>

              {/* ⬅️ JUDUL PERMINTAAN DULU */}
              <h2 className="text-xl font-bold">
                Permintaan Logistik 
              </h2>

              {/* CARD PERMINTAAN */}
              <div className="border rounded-lg overflow-hidden p-4 space-y-4">
                {listPermintaan
                  .filter(p =>
                    p.kode_ruangan === selectedLab.kode_ruangan &&
                    p.status !== "selesai"
                  )
                  .map((p) => (
                    <div key={p.id_permintaan} className="bg-white p-4 rounded-lg shadow space-y-2">
                      <div className="flex justify-between">
                        <p className="text-xs">Tanggal: {formatTanggal(p.tanggal)}</p>
                        <span className={`px-2 py-1 rounded text-xs text-white ${
                          p.status === "menunggu" ? "bg-orange-500" :
                          p.status === "dikirim" ? "bg-blue-500" :
                          "bg-green-600"
                        }`}>
                          {p.status}
                        </span>
                      </div>

                      <div className="border-l-2 pl-3 space-y-1">
                        {p.detail.map((d) => (
                          <div key={d.kode_barang}>
                            <p className="font-medium">{d.barang?.nama_barang}</p>
                            <p className="text-xs">{d.qty_diminta} {d.barang?.satuan}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                ))}

                {listPermintaan.filter(p =>
                  p.kode_ruangan === selectedLab.kode_ruangan
                ).length === 0 && (
                  <p className="text-center text-muted-foreground text-sm">
                    Tidak ada permintaan dari lab ini.
                  </p>
                )}
              </div>

              <h2 className="text-xl font-bold">
                Penerimaan Logistik
              </h2>


              {/* FILTER BAR */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                <div className="flex flex-col">
                  <Label>Pencarian</Label>
                  <Input
                    placeholder="Cari kode/nama barang"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-col">
                  <Label>Tanggal Awal</Label>
                  <Input
                    type="date"
                    value={filterTanggalAwal}
                    onChange={(e) => setFilterTanggalAwal(e.target.value)}
                  />
                </div>

                <div className="flex flex-col">
                  <Label>Tanggal Akhir</Label>
                  <Input
                    type="date"
                    value={filterTanggalAkhir}
                    onChange={(e) => setFilterTanggalAkhir(e.target.value)}
                  />
                </div>

              </div>

              {/* TABEL */}
              <div className="overflow-x-auto border rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Tanggal</th>
                      <th className="p-2 text-left">Nama Barang</th>
                      <th className="p-2 text-left">Qty Diterima</th>
                      <th className="p-2 text-left">Satuan</th>
                      <th className="p-2 text-left">Keterangan</th>
                    </tr>
                  </thead>

                  <tbody>
                    {superSearched.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          Tidak ada data yang cocok.
                        </td>
                      </tr>
                    ) : (
                      superSearched.map((row, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{formatTanggal(row.tanggal)}</td>
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

      {/* DELETE MODAL */}
      <Dialog
        open={deleteDialog}
        onOpenChange={(open) => {
          setDeleteDialog(open);
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Hapus Penerimaan?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Tindakan ini tidak dapat dibatalkan. Data yang dihapus tidak dapat
            dikembalikan.
          </p>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Batal
            </Button>

            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={permintaanDialogOpen} onOpenChange={setPermintaanDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Permintaan Logistik</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdatePermintaan();
            }}
            className="space-y-4"
          >
            <div>
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={formPermintaan.tanggal}
                onChange={(e) =>
                  setFormPermintaan((p) => ({ ...p, tanggal: e.target.value }))
                }
              />
            </div>

            {!isEditing && (
              <div>
                <Label>Pilih Barang</Label>
                <Select key={selectKey} onValueChange={addBarangPermintaan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih barang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {barangList.map((b) => (
                      <SelectItem key={b.kode_barang} value={b.kode_barang}>
                        {b.nama_barang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formPermintaan.detail.map((d) => (
              <div key={d.kode_barang} className="border p-3 rounded-lg">
                <p className="font-semibold">{d.barang?.nama_barang}</p>

                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={d.qty_diminta}
                    onChange={(e) =>
                      updateQtyPermintaan(d.kode_barang, Number(e.target.value))
                    }
                  />

                  {!isEditing && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeBarangPermintaan(d.kode_barang)}
                    >
                      Hapus
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div>
              <Label>Keterangan</Label>
              <Textarea
                value={formPermintaan.keterangan}
                onChange={(e) =>
                  setFormPermintaan((p) => ({ ...p, keterangan: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPermintaanDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan Perubahan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={accDialog} onOpenChange={setAccDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Konfirmasi Permintaan</DialogTitle>
          </DialogHeader>

          {accTarget && (
            <div className="space-y-4">

              {/* INFO PERMINTAAN */}
              <div className="text-sm">
                <p><b>Tanggal:</b> {formatTanggal(accTarget.tanggal)}</p>
                <p><b>Status:</b> {accTarget.status}</p>
              </div>

              {/* LIST BARANG + INPUT QTY DITERIMA */}
              <div className="space-y-3">
                {accTarget.detail.map((d) => (
                  <div
                    key={d.kode_barang}
                    className="border rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{d.barang?.nama_barang}</p>
                      <p className="text-xs text-muted-foreground">
                        Dikirim: {d.qty_dikirim} {d.barang?.satuan}
                      </p>
                    </div>

                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={d.qty_diterima ?? d.qty_dikirim ?? d.qty_diminta}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setAccTarget(prev =>
                          prev
                            ? {
                                ...prev,
                                detail: prev.detail.map(x =>
                                  x.kode_barang === d.kode_barang
                                    ? { ...x, qty_diterima: val }
                                    : x
                                ),
                              }
                            : prev
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
              

              {/* ACTION */}
              <div className="flex justify-end gap-2 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setAccDialog(false)}
                >
                  Batal
                </Button>

                <Button
                  onClick={() => {
                    if (!accTarget) return;
                    handleAcc(accTarget);
                    setAccDialog(false);
                    setAccTarget(null);
                  }}
                >
                  Simpan Konfirmasi
                </Button>
              </div>

            </div>
            
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}