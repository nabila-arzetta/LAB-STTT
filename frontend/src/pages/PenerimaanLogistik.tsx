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

export default function PenerimaanLogistik() {
  const { toast } = useToast();
  const { user } = useAuth();

  const isAdminLab = user?.role === "admin_lab";
  const isSuperAdmin = user?.role === "superadmin";
  const userLabKode = user?.kode_bagian || "";

  const [list, setList] = useState<Penerimaan[]>([]);
  const [labList, setLabList] = useState<Lab[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingTarget, setEditingTarget] = useState<Penerimaan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

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

  // ========================================================
  // LOAD DATA
  // ========================================================
  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      // Load lab
      const labRes = await api.get("/labs/options");
      const labs: Lab[] = labRes.data.data ?? [];
      setLabList(labs);

      const userLab = labs.find(
        (l) =>
          String(l.kode_bagian).toUpperCase() ===
          String(userLabKode).toUpperCase()
      );

      const userRuangan = userLab?.kode_ruangan?.toUpperCase() ?? null;

      // Load data
      const penerimaanRes = await api.get("/penerimaan-logistik");

      // Load barang
      const barangRes = isAdminLab
        ? await api.get(`/master-barang/by-lab/${userRuangan}`)
        : await api.get("/master-barang");

      const barangData: Barang[] = barangRes.data.data ?? [];
      setBarangList(barangData);

      // Normalize detail
      const normalized: Penerimaan[] =
        penerimaanRes.data.data?.map((p: Penerimaan) => ({
          ...p,
          detail: p.detail.map((d) => ({
            ...d,
            barang:
              barangData.find((b) => b.kode_barang === d.kode_barang) ?? null,
          })),
        })) ?? [];

      let visible: Penerimaan[] = normalized;

      if (isAdminLab && userRuangan) {
        visible = normalized.filter(
          (p) => p.kode_ruangan?.toUpperCase() === userRuangan
        );
      }

      setList(visible);

      if (isAdminLab && userLab) {
        setForm((prev) => ({
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

  // ========================================================
  // FORM HANDLING
  // ========================================================
  const addBarang = (kode: string) => {
    if (!kode) return;

    setForm((prev) => ({
      ...prev,
      detail: [
        {
          kode_barang: kode,
          quantity: 1,
          barang: barangList.find((b) => b.kode_barang === kode),
        },
      ],
    }));
  };

  const removeBarang = () =>
    setForm((p) => ({
      ...p,
      detail: [],
    }));

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
          detail: form.detail,
        });
      } else {
        await api.post("/penerimaan-logistik", {
          kode_ruangan: form.kode_ruangan,
          tanggal: form.tanggal,
          keterangan: form.keterangan,
          detail: form.detail,
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

  // ========================================================
  // FILTER ADMIN DATA (FLATTEN)
  // ========================================================
  const detailRows = isAdminLab
    ? list.flatMap((p) =>
        p.detail.map((d) => ({
          id_penerimaan: p.id_penerimaan,
          tanggal: p.tanggal,
          kode_barang: d.kode_barang,
          nama_barang: d.barang?.nama_barang ?? "-",
          quantity: d.quantity,
          satuan: d.barang?.satuan ?? "-",
          keterangan: p.keterangan ?? "-",
          full: p,
        }))
      )
    : [];

  // ========================================================
  // SUPERADMIN VIEW (FILTER by LAB + SEARCH)
  // ========================================================
  const superFiltered =
    isSuperAdmin && selectedLab
      ? list.filter(
          (p) =>
            String(p.kode_ruangan).toUpperCase() ===
            String(selectedLab.kode_ruangan).toUpperCase()
        )
      : [];

  const flatSuperRows = superFiltered.flatMap((p) =>
    p.detail.map((d) => ({
      tanggal: p.tanggal,
      kode_barang: d.kode_barang,
      nama_barang: d.barang?.nama_barang ?? "-",
      quantity: d.quantity,
      satuan: d.barang?.satuan ?? "-",
      keterangan: p.keterangan ?? "-",
    }))
  );

  const superSearched = flatSuperRows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();

    return (
      r.tanggal.toLowerCase().includes(q) ||
      r.kode_barang.toLowerCase().includes(q) ||
      r.nama_barang.toLowerCase().includes(q) ||
      r.keterangan.toLowerCase().includes(q)
    );
  });

  // ========================================================
  // RENDER
  // ========================================================
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
          <h1 className="text-2xl font-bold text-primary">
            Penerimaan Logistik
          </h1>

          {isSuperAdmin && (
            <p className="text-sm text-muted-foreground mt-1">
              {selectedLab
                ? `Lab dipilih: ${selectedLab.nama_lab} (${selectedLab.kode_ruangan})`
                : "Pilih lab terlebih dahulu"}
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
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Penerimaan
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTarget
                    ? "Edit Penerimaan Logistik"
                    : "Tambah Penerimaan Logistik"}
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
                  <Label>Pilih Barang</Label>
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
                          <Input
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

                <div>
                  <Label>Keterangan</Label>
                  <Textarea
                    value={form.keterangan}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        keterangan: e.target.value,
                      }))
                    }
                  />
                </div>

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
      </div>

      {/* TABLE ADMIN */}
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
              {detailRows.map((row) => (
                <tr
                  key={`${row.id_penerimaan}-${row.kode_barang}`}
                  className="border-b hover:bg-muted/40"
                >
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
                      onClick={() => openEdit(row.full)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setDeleteTarget(row.full);
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

              {/* TABEL */}
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
                    {superSearched.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-4 text-center text-muted-foreground"
                        >
                          {search
                            ? "Tidak ada data yang cocok."
                            : "Belum ada data penerimaan untuk lab ini."}
                        </td>
                      </tr>
                    ) : (
                      superSearched.map((row, idx) => (
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

      {/* DELETE MODAL */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus penerimaan ini?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}