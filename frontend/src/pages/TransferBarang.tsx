  import React, { useCallback, useEffect, useMemo, useState } from "react";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
  import {
    Plus,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    Building2,
    ChevronRight,
    Pencil,
    Trash2
  } from "lucide-react";
  import { api } from "@/lib/api";
  import { useAuth } from "@/contexts/AuthContext";
  import { useToast } from "@/hooks/use-toast";
  import { Input } from "@/components/ui/input";

  type Barang = {
    kode_barang: string;
    nama_barang: string;
    satuan?: string;
  };

  type Lab = {
    kode_ruangan: string;
    nama_lab: string;
    kode_bagian: string;
  };

  type TransferDetail = {
    kode_barang: string;
    nama_barang?: string;
    quantity: number;
    qty_approved?: number;
    satuan?: string;
  };

  type TransferStatus =
    | "pending"
    | "approved"
    | "partial_approved"
    | "rejected"
    | "completed";

  type Transfer = {
    id_transfer: number;
    kode_ruangan_dari: string;
    lab_asal?: string;
    kode_ruangan_tujuan: string;
    lab_tujuan?: string;
    tanggal: string;
    keterangan?: string;
    created_at?: string;
    status: TransferStatus;
    detail: TransferDetail[];
  };

  /* BADGE */
  const StatusBadge = ({ status }: { status: TransferStatus }) => {
    const classes: Record<TransferStatus, string> = {
      pending: "bg-yellow-500 text-black hover:bg-yellow-500",
      approved: "bg-green-600 text-white hover:bg-green-600",
      partial_approved: "bg-blue-600 text-white hover:bg-blue-600",
      rejected: "bg-red-600 text-white hover:bg-red-600",
      completed: "bg-emerald-700 text-white hover:bg-emerald-700",
    };

    const labels: Record<TransferStatus, string> = {
      pending: "Menunggu",
      approved: "Disetujui",
      partial_approved: "Disetujui Sebagian",
      rejected: "Ditolak",
      completed: "Selesai",
    };

    return (
      <Badge className={`${classes[status]} pointer-events-none`}>
        {labels[status]}
      </Badge>
    );
  };

  /* MAIN COMPONENT */
  export default function TransferBarang() {
    const { user } = useAuth();
    const { toast } = useToast();

    const isAdminLab = user?.role === "admin_lab";
    const isSuperAdmin = user?.role === "superadmin";

    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [labs, setLabs] = useState<Lab[]>([]);
    const [barangs, setBarangs] = useState<Barang[]>([]);
    const [loading, setLoading] = useState(false);

    // lab milik user (kode_ruangan)
    const userLab = useMemo(() => {
      if (!user || labs.length === 0) return undefined;

      let lab = labs.find(
        (l) =>
          String(l.kode_bagian).toUpperCase() ===
          String(user.kode_bagian).toUpperCase()
      );

      if (!lab) {
        const prefix = String(user.username).split("_")[0].toUpperCase(); 
        const guess = "L-" + prefix;

        lab = labs.find(
          (l) =>
            String(l.kode_ruangan).toUpperCase() === guess
        );
      }

      return lab?.kode_ruangan?.toUpperCase();
    }, [user, labs]);

    const formatTanggal = (tgl: string) => {
      if (!tgl) return "-";
      const d = new Date(tgl);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    };

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [search, setSearch] = useState("");
    
    const [filterTanggalAwal, setFilterTanggalAwal] = useState("");
    const [filterTanggalAkhir, setFilterTanggalAkhir] = useState("");
    const [filterKodeBarang, setFilterKodeBarang] = useState("");

    const [form, setForm] = useState({
      kode_barang: 0,
      jumlah: 1,
      dariLab: "",
      keLab: "",
      tanggal: new Date().toISOString().slice(0, 10),
      catatan: "",
    });

    const [selected, setSelected] = useState<Transfer | null>(null);
    const [activeTab, setActiveTab] = useState<"out" | "in">("out");

    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [approveTarget, setApproveTarget] = useState<Transfer | null>(null);
    const [approveDetails, setApproveDetails] = useState<
      (TransferDetail & { qty_approved: number })[]
    >([]);

    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<Transfer | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Transfer | null>(null);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Transfer | null>(null);

    const [selectedKodeRuangan, setSelectedKodeRuangan] = useState<string | null>(
      null
    );

    const selectedLab = useMemo(
      () =>
        selectedKodeRuangan
          ? labs.find(
              (l) =>
                String(l.kode_ruangan).toUpperCase() ===
                String(selectedKodeRuangan).toUpperCase()
            ) ?? null
          : null,
      [labs, selectedKodeRuangan]
    );

    const resolvedLab = useMemo(() => {
      if (isSuperAdmin) return selectedLab;

      if (isAdminLab && userLab) {
        return (
          labs.find(
            (l) =>
              String(l.kode_ruangan).toUpperCase() ===
              String(userLab).toUpperCase()
          ) ?? null
        );
      }

      return null;
    }, [isSuperAdmin, isAdminLab, selectedLab, userLab, labs]);

    const openApproveModal = (transfer: Transfer) => {
      setApproveTarget(transfer);

      // default: ACC penuh = quantity
      const prepared = (transfer.detail ?? []).map((d) => ({
        ...d,
        qty_approved: d.qty_approved ?? d.quantity,
      }));
      setApproveDetails(prepared);
      setIsApproveOpen(true);
    };

    const openRejectModal = (transfer: Transfer) => {
      setRejectTarget(transfer);
      setRejectReason("");
      setIsRejectOpen(true);
    };

    const rejectTransfer = async (id: number, reason?: string) => {
      try {
        await api.post(`/transfer-barang/${id}/reject`, { reason });
        toast({ title: "Permintaan ditolak" });
        loadAll();
      } catch (err: any) {
        toast({
          title: "Gagal menolak",
          description: err?.response?.data?.message,
          variant: "destructive",
        });
      }
    };

    const loadAll = useCallback(async () => {
      setLoading(true);
      try {
        const [tRes, labRes, brgRes] = await Promise.all([
          api.get<{ data: Transfer[] }>("/transfer-barang"),
          api.get<{ data: Lab[] }>("/labs/options"),
          api.get<{ data: Barang[] }>("/master-barang"),
        ]);

        console.log("Transfers:", tRes.data.data);
        console.log("Labs:", labRes.data.data);
        console.log("Barangs:", brgRes.data.data);

        setTransfers(tRes.data.data ?? []);
        setLabs(labRes.data.data ?? []);
        setBarangs(brgRes.data.data ?? []);
      } catch (err: any) {
        toast({
          title: "Gagal memuat data",
          description: err?.response?.data?.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, [toast]);

    useEffect(() => {
      loadAll();
    }, [loadAll]);

    useEffect(() => {
      if (isAdminLab && userLab) {
        setForm((f) => ({
          ...f,
          dariLab: userLab,
        }));
      }
    }, [isAdminLab, userLab]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (form.kode_barang === 0 || !form.dariLab || !form.keLab) {
        toast({ title: "Lengkapi data", variant: "destructive" });
        return;
      }

      try {
        await api.post("/transfer-barang", {
          kode_ruangan_dari: form.dariLab,
          kode_ruangan_tujuan: form.keLab,
          tanggal: form.tanggal,
          keterangan: form.catatan,
          detail: [{
            kode_barang: Number(form.kode_barang),
            quantity: Number(form.jumlah)
          }],
        });

        toast({ title: "Transfer berhasil dibuat" });
        setIsDialogOpen(false);

        setForm({
          kode_barang: 0,
          jumlah: 1,
          dariLab: isAdminLab ? userLab : "",
          keLab: "",
          tanggal: new Date().toISOString().slice(0, 10),
          catatan: "",
        });

        loadAll();
      } catch (err: any) {
        toast({
          title: "Gagal membuat transfer",
          description: err?.response?.data?.message,
          variant: "destructive",
        });
      }
    };

    const handleApproveQtyChange = (kode: string, value: string) => {
      setApproveDetails((prev) =>
        prev.map((d) => {
          if (d.kode_barang !== kode) return d;
          const raw = Number(value);
          if (Number.isNaN(raw)) return d;
          let val = raw;
          if (val < 0) val = 0;
          if (val > d.quantity) val = d.quantity;
          return { ...d, qty_approved: val };
        })
      );
    };

    const handleApproveSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!approveTarget) return;

      try {
        await api.post(`/transfer-barang/${approveTarget.id_transfer}/approve`, {
          detail: approveDetails.map((d) => ({
            kode_barang: d.kode_barang,
            qty_approved: d.qty_approved,
          })),
        });

        toast({ title: "Transfer disetujui" });
        setIsApproveOpen(false);
        setApproveTarget(null);
        loadAll();

        window.dispatchEvent(new Event("stok-updated"));
        
      } catch (err: any) {
        toast({
          title: "Gagal menyetujui transfer",
          description: 
            err?.response?.data?.error ??
            err?.response?.data?.message ??
            "Terjadi kesalahan",
          variant: "destructive",
        });
      }
    };

    const handleRejectSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!rejectTarget) return;
      await rejectTransfer(rejectTarget.id_transfer, rejectReason);
      setIsRejectOpen(false);
      setRejectTarget(null);
      setRejectReason("");
    };

    const openEditModal = (t: Transfer) => {
      setEditTarget(t);

      setForm({
        kode_barang: Number(t.detail?.[0]?.kode_barang ?? 0),
        jumlah: t.detail?.[0]?.quantity ?? 1,
        dariLab: t.kode_ruangan_dari,
        keLab: t.kode_ruangan_tujuan,
        tanggal: t.tanggal,
        catatan: t.keterangan ?? "",
      });

      setIsEditOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editTarget) return;

      try {
        await api.put(`/transfer-barang/${editTarget.id_transfer}`, {
          kode_ruangan_dari: form.dariLab,
          kode_ruangan_tujuan: form.keLab,
          tanggal: form.tanggal,
          keterangan: form.catatan,
          detail: [{ kode_barang: form.kode_barang, quantity: form.jumlah }],
        });

        toast({ title: "Transfer berhasil diperbarui" });
        setIsEditOpen(false);
        setEditTarget(null);
        loadAll();
      } catch (err: any) {
        toast({
          title: "Gagal memperbarui transfer",
          description: err?.response?.data?.message,
          variant: "destructive",
        });
      }
    };

    const confirmDeleteTransfer = async () => {
      if (!deleteTarget) return;

      try {
        await api.delete(`/transfer-barang/${deleteTarget.id_transfer}`);

        toast({ title: "Transfer berhasil dihapus" });
        setIsDeleteOpen(false);
        setDeleteTarget(null);
        loadAll();
      } catch (err: any) {
        toast({
          title: "Gagal menghapus transfer",
          description: err?.response?.data?.message,
          variant: "destructive",
        });
      }
    };
    
    // lab yang sedang "di-view" di tabel
    const viewKodeRuangan = isSuperAdmin
      ? selectedLab?.kode_ruangan ?? ""
      : userLab;

    const outbound = transfers.filter(
      (t) =>
        String(t.kode_ruangan_dari).toUpperCase() ===
        String(viewKodeRuangan).toUpperCase()
    );

    const inbound = transfers.filter(
      (t) =>
        String(t.kode_ruangan_tujuan).toUpperCase() ===
        String(viewKodeRuangan).toUpperCase()
    );

    const currentTransfers =
      viewKodeRuangan && (isAdminLab || selectedLab)
        ? activeTab === "out"
          ? outbound
          : inbound
        : [];

    // Flatten
    const rawRows = currentTransfers.flatMap((t) =>
      t.detail?.length
        ? t.detail.map((d) => ({ transfer: t, detail: d }))
        : [{ transfer: t, detail: null }]
    );

    // Filter
    const tableRows = rawRows.filter((row) => {
      const t = row.transfer;
      const d = row.detail;

      const q = search.toLowerCase();

      // SEARCH 
      const matchSearch =
        !search ||
        t.tanggal.toLowerCase().includes(q) ||
        (d?.kode_barang?.toLowerCase().includes(q) ?? false) ||
        (d?.nama_barang?.toLowerCase().includes(q) ?? false) ||
        (t.keterangan?.toLowerCase().includes(q) ?? false);

      // KODE BARANG 
      const kodeOk =
        !filterKodeBarang ||
        (d?.kode_barang ?? "")
          .toLowerCase()
          .includes(filterKodeBarang.toLowerCase());

      // TANGGAL 
      const dt = new Date(t.tanggal);

      const awalOk =
        !filterTanggalAwal || dt >= new Date(filterTanggalAwal);

      const akhirOk =
        !filterTanggalAkhir || dt <= new Date(filterTanggalAkhir);

      return matchSearch && kodeOk && awalOk && akhirOk;
    });

    if (loading) {
      return (
        <p className="text-center p-6 text-muted-foreground">Memuat data...</p>
      );
    }

    return (
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Transfer Barang</h1>
            {isSuperAdmin && (
              <p className="text-xs text-muted-foreground mt-1"> </p>
            )}
          </div>

          {/* Button Buat Transfer hanya di Permintaan Keluar & hanya admin_lab */}
          {isAdminLab && activeTab === "out" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/80">
                  <Plus className="w-4 h-4 mr-2" /> Buat Transfer
                </Button>
              </DialogTrigger>

              {/* FORM DIALOG */}
              <DialogContent className="max-w-2xl" aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>Buat Transfer Barang</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                  {/* BARANG */}
                  <div className="flex flex-col">
                    <label htmlFor="barang" className="text-sm font-medium mb-1">
                      Barang
                    </label>
                    <select
                      id="barang"
                      name="barang"
                      value={form.kode_barang}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          kode_barang: Number(e.target.value),
                        }))
                      }
                      className="w-full border rounded-md p-2"
                    >
                      <option value="">Pilih barang</option>
                      {barangs.map((b) => (
                        <option key={b.kode_barang} value={b.kode_barang}>
                          {b.nama_barang} ({b.satuan})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* JUMLAH */}
                  <div className="flex flex-col">
                    <label htmlFor="jumlah" className="text-sm font-medium mb-1">
                      Jumlah
                    </label>
                    <Input
                      id="jumlah"
                      name="jumlah"
                      type="number"
                      min={1}
                      value={form.jumlah}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          jumlah: Number(e.target.value),
                        }))
                      }
                    />
                  </div>

                  {/* LAB (DARI • KE) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label htmlFor="dariLab" className="text-sm font-medium mb-1">
                        Dari Lab
                      </label>
                      <select
                        id="dariLab"
                        name="dariLab"
                        value={form.dariLab}
                        disabled={isAdminLab}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, dariLab: e.target.value }))
                        }
                        className="w-full border rounded-md p-2"
                      >
                        <option value="">Pilih lab</option>
                        {labs.map((l) => (
                          <option key={l.kode_ruangan} value={l.kode_ruangan}>
                            {l.nama_lab}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="keLab" className="text-sm font-medium mb-1">
                        Ke Lab
                      </label>
                      <select
                        id="keLab"
                        name="keLab"
                        value={form.keLab}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, keLab: e.target.value }))
                        }
                        className="w-full border rounded-md p-2"
                      >
                        <option value="">Pilih lab</option>
                        {labs.map((l) => (
                          <option key={l.kode_ruangan} value={l.kode_ruangan}>
                            {l.nama_lab}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* TANGGAL & CATATAN */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label htmlFor="tanggal" className="text-sm font-medium mb-1">
                        Tanggal
                      </label>
                      <Input
                        id="tanggal"
                        name="tanggal"
                        type="date"
                        value={form.tanggal}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, tanggal: e.target.value }))
                        }
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="catatan" className="text-sm font-medium mb-1">
                        Catatan (opsional)
                      </label>
                      <Input
                        id="catatan"
                        name="catatan"
                        value={form.catatan}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, catatan: e.target.value }))
                        }
                        placeholder="Opsional"
                      />
                    </div>
                  </div>

                  {/* BUTTON */}
                  <div className="flex justify-end gap-2 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button type="submit" className="bg-primary text-white">
                      Simpan
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* PILIH LAB (KHUSUS SUPERADMIN) */}
        {isSuperAdmin && !selectedLab && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {labs
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
                      {lab.kode_ruangan} - {lab.kode_bagian}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB & TABEL: ADMIN_LAB ATAU SUPERADMIN YANG SUDAH PILIH LAB */}
        {(isAdminLab || selectedLab) && (
          <>
            {isSuperAdmin && (
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
                  <h1 className="text-lg font-bold text-primary">
                    {resolvedLab?.nama_lab ?? ""}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {resolvedLab?.kode_ruangan ?? ""} - {resolvedLab?.kode_bagian ?? ""}
                  </p>
                </div>
              </div>
            )}

            {/* TAB SWITCHER */}
            <div className="flex justify-between items-center gap-2 border-b pb-2">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "out" ? "default" : "outline"}
                  onClick={() => setActiveTab("out")}
                >
                  Permintaan Keluar
                </Button>

                <Button
                  variant={activeTab === "in" ? "default" : "outline"}
                  onClick={() => setActiveTab("in")}
                >
                  Permintaan Masuk
                </Button>
              </div>
            </div>

            {/* FILTER BAR */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 px-1">

              {/* SEARCH */}
              <div className="flex flex-col">
                <label htmlFor="searchTransfer" className="text-xs text-muted-foreground mb-1">
                  Pencarian
                </label>
                <Input
                  id="searchTransfer"
                  name="searchTransfer"
                  placeholder="Cari..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* TANGGAL AWAL */}
              <div className="flex flex-col">
                <label htmlFor="filterTanggalAwal" className="text-xs text-muted-foreground mb-1">
                  Tanggal Awal
                </label>
                <Input
                  id="filterTanggalAwal"
                  name="filterTanggalAwal"
                  type="date"
                  value={filterTanggalAwal}
                  onChange={(e) => setFilterTanggalAwal(e.target.value)}
                />
              </div>

              {/* TANGGAL AKHIR */}
              <div className="flex flex-col">
                <label htmlFor="filterTanggalAkhir" className="text-xs text-muted-foreground mb-1">
                  Tanggal Akhir
                </label>
                <Input
                  id="filterTanggalAkhir"
                  name="filterTanggalAkhir"
                  type="date"
                  value={filterTanggalAkhir}
                  onChange={(e) => setFilterTanggalAkhir(e.target.value)}
                />
              </div>
            </div>

            {/* TABEL */}
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm border rounded-md overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left">Tanggal</th>
                    <th className="p-3 text-left">Dari</th>
                    <th className="p-3 text-left">Ke</th>
                    <th className="p-3 text-left">Kode</th>
                    <th className="p-3 text-left">Nama</th>
                    <th className="p-3 text-left">Qty</th>
                    <th className="p-3 text-left">Satuan</th>
                    <th className="p-3 text-left">Keterangan</th>
                    <th className="p-3 text-left">Status</th>
                    {isAdminLab && (
                      <th className="p-3 text-left w-[90px]">Aksi</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {tableRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdminLab && activeTab === "in" ? 10 : 9}
                        className="p-4 text-center text-muted-foreground"
                      >
                        Belum ada data transfer untuk tampilan ini.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((row, idx) => {
                      const t = row.transfer;
                      const d = row.detail;

                      return (
                        <tr
                          key={`${t.id_transfer}-${d?.kode_barang ?? idx}`}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="p-3">{formatTanggal(t.tanggal)}</td>
                          <td className="p-3">
                            {t.lab_asal ?? t.kode_ruangan_dari}
                          </td>
                          <td className="p-3">
                            {t.lab_tujuan ?? t.kode_ruangan_tujuan}
                          </td>
                          <td className="p-3">{d?.kode_barang ?? "-"}</td>
                          <td className="p-3">{d?.nama_barang ?? "-"}</td>
                          <td className="p-3">
                            {t.status === "partial_approved"
                              ? `${d?.qty_approved ?? 0} / ${d?.quantity}`
                              : d?.quantity ?? "-"}
                          </td>
                          <td className="p-3">{d?.satuan ?? "-"}</td>
                          <td className="p-3">{t.keterangan ?? "-"}</td>
                          <td className="p-3">
                            <StatusBadge status={t.status} />
                          </td>

                          {/* Aksi */}
                          {isAdminLab && (
                            <td className="p-3 w-[90px]">
                              <div className="flex items-center gap-1">

                                {/* TAB MASUK: ACC / TOLAK */}
                                {activeTab === "in" && t.status === "pending" && (
                                  <>
                                    <Button
                                      size="icon"
                                      className="bg-green-600 text-white hover:bg-green-700"
                                      onClick={() => openApproveModal(t)}
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </Button>

                                    <Button
                                      size="icon"
                                      variant="destructive"
                                      onClick={() => openRejectModal(t)}
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}

                                {/* TAB KELUAR: EDIT / DELETE */}
                                {activeTab === "out" && t.status === "pending" && (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      onClick={() => openEditModal(t)}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>

                                    <Button
                                      size="icon"
                                      variant="destructive"
                                      onClick={() => {
                                        setDeleteTarget(t);
                                        setIsDeleteOpen(true);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}

                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* MODAL ACC */}
        <Dialog
          open={isApproveOpen}
          onOpenChange={(open) => {
            setIsApproveOpen(open);
            if (!open) {
              setApproveTarget(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Setujui Permintaan Transfer</DialogTitle>
            </DialogHeader>

            {approveTarget && (
              <form onSubmit={handleApproveSubmit} className="space-y-4">
                <div className="text-sm space-y-1">
                  <p><strong>
                    Tanggal:</strong> {formatTanggal(approveTarget.tanggal)}
                  </p>
                  <p>
                    <strong>Dari:</strong>{" "}
                    {approveTarget.lab_asal ?? approveTarget.kode_ruangan_dari}
                  </p>
                  <p>
                    <strong>Ke:</strong>{" "}
                    {approveTarget.lab_tujuan ??
                      approveTarget.kode_ruangan_tujuan}
                  </p>
                  <p>
                    <strong>Keterangan:</strong>{" "}
                    {approveTarget.keterangan ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm mb-2">
                    Atur jumlah yang akan disetujui untuk tiap barang.
                    <br />
                    <span className="text-muted-foreground">
                      0 = tidak disetujui, sama dengan qty diminta = Setuju penuh.
                    </span>
                  </p>

                  <table className="w-full text-sm border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="border p-2 text-left">Kode</th>
                        <th className="border p-2 text-left">Nama</th>
                        <th className="border p-2 text-right">Qty Diminta</th>
                        <th className="border p-2 text-right">
                          Qty Disetujui
                        </th>
                        <th className="border p-2 text-left">Satuan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approveDetails.map((d) => (
                        <tr key={d.kode_barang}>
                          <td className="border p-2">{d.kode_barang}</td>
                          <td className="border p-2">
                            {d.nama_barang ?? "-"}
                          </td>
                          <td className="border p-2 text-right">
                            {d.quantity}
                          </td>
                          <td className="border p-2 text-right">
                            <Input
                              type="number"
                              min={0}
                              max={d.quantity}
                              value={d.qty_approved}
                              onChange={(e) =>
                                handleApproveQtyChange(
                                  d.kode_barang,
                                  e.target.value
                                )
                              }
                              className="w-24 text-right"
                            />
                          </td>
                          <td className="border p-2">
                            {d.satuan ?? "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsApproveOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    Simpan
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* MODAL TOLAK */}
        <Dialog
          open={isRejectOpen}
          onOpenChange={(open) => {
            setIsRejectOpen(open);
            if (!open) {
              setRejectTarget(null);
              setRejectReason("");
            }
          }}
        >
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Tolak Permintaan Transfer</DialogTitle>
            </DialogHeader>

            {rejectTarget && (
              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <p className="text-sm">
                  Apakah Anda yakin ingin{" "}
                  <span className="font-semibold text-red-600">menolak</span>{" "}
                  permintaan ini?
                </p>

                <div className="text-sm space-y-1">
                  <p>
                    <strong>Dari:</strong>{" "}
                    {rejectTarget.lab_asal ?? rejectTarget.kode_ruangan_dari}
                  </p>
                  <p>
                    <strong>Ke:</strong>{" "}
                    {rejectTarget.lab_tujuan ??
                      rejectTarget.kode_ruangan_tujuan}
                  </p>
                  <p>
                    <strong>Tanggal:</strong> {formatTanggal(rejectTarget.tanggal)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm mb-1">
                    Alasan penolakan (opsional)
                  </label>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm"
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Contoh: stok tidak mencukupi, barang sedang digunakan, dll."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRejectOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" variant="destructive">
                    Tolak Permintaan
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>

          {/* MODAL EDIT TRANSFER */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl" aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>Edit Transfer Barang</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
                <div className="flex flex-col">
                  <label htmlFor="editBarang">Barang</label>
                  <select
                    id="editBarang"
                    value={form.kode_barang}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        kode_barang: Number(e.target.value),
                      }))
                    }
                    className="w-full border rounded-md p-2"
                  >
                    <option value="">Pilih barang</option>
                    {barangs.map((b) => (
                      <option key={b.kode_barang} value={b.kode_barang}>
                        {b.nama_barang} ({b.satuan})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label htmlFor="editJumlah">Jumlah</label>
                  <Input
                    id="editJumlah"
                    type="number"
                    min={1}
                    value={form.jumlah}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, jumlah: Number(e.target.value) }))
                    }
                  />
                </div>

                <div className="flex flex-col">
                  <label htmlFor="editKeLab">Ke Lab</label>
                  <select
                    id="editKeLab"
                    value={form.keLab}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, keLab: e.target.value }))
                    }
                    className="w-full border rounded-md p-2"
                  >
                    <option value="">Pilih lab</option>
                    {labs.map((l) => (
                      <option key={l.kode_ruangan} value={l.kode_ruangan}>
                        {l.nama_lab}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label htmlFor="editTanggal">Tanggal</label>
                  <Input
                    id="editTanggal"
                    type="date"
                    value={form.tanggal}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tanggal: e.target.value }))
                    }
                  />
                </div>

                <div className="flex flex-col">
                  <label htmlFor="editCatatan">Catatan</label>
                  <Input
                    id="editCatatan"
                    value={form.catatan}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, catatan: e.target.value }))
                    }
                    placeholder="Opsional"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Simpan Perubahan</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* MODAL DELETE TRANSFER */}
          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent className="max-w-sm text-center" aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>Hapus Transfer?</DialogTitle>
              </DialogHeader>

              <p className="text-sm">Apakah Anda yakin ingin menghapus transfer ini?</p>

              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                  Batal
                </Button>
                <Button variant="destructive" onClick={confirmDeleteTransfer}>
                  <Trash2 className="w-4 h-4 mr-2" /> Hapus
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Dialog>
      </div>
    );
  }
