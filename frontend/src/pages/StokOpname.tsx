import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Building2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* -------------------- Types -------------------- */
type Barang = {
  kode_barang: string;
  nama_barang: string;
  satuan: string | null;
  stok_akhir?: number | null;
  stok_sistem?: number | null;
};

type OpnameItem = {
  kode_barang: string;
  nama_barang: string;
  stok_sistem: number;
  stok_fisik: number;
};

type OpnameRowFromApi = {
  id_opname: number;
  tanggal: string;
  kode_ruangan: string;
  nama_lab: string;
  id_detail: number;
  kode_barang: string;
  nama_barang: string;
  kategori: string | null;
  satuan: string | null;
  stok_sistem: number;
  stok_fisik: number;
  selisih: number;
  tipe: "plus" | "minus" | "sesuai";
};

type Lab = {
  id_lab: number;
  kode_ruangan: string;
  kode_bagian?: string | null;
  nama_lab: string;
  lokasi?: string;
};

/* -------------------- Component -------------------- */
export default function StokOpname() {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [userLoaded, setUserLoaded] = useState(false);

  // peran
  const isSuperadmin = authUser?.role === "superadmin";
  const isAdminLab = authUser?.role === "admin_lab";

  // ADMIN LAB: kode ruangan (real kode_ruangan jika diset)
  const [adminLabKodeRuangan, setAdminLabKodeRuangan] = useState<string | null>(
    authUser?.kode_ruangan ?? null
  );

  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [opnameData, setOpnameData] = useState<OpnameRowFromApi[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [opnameItems, setOpnameItems] = useState<OpnameItem[]>([]);
  const [selectedLabKode, setSelectedLabKode] = useState<string | null>(
    isAdminLab ? adminLabKodeRuangan : null
  );
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : { "Content-Type": "application/json" };

  /* ------------------ Helper: fetch profile if needed ------------------ */
  const fetchProfileIfNeeded = async () => {
    if (!isAdminLab) {
      setUserLoaded(true);
      return;
    }

    if (!token) {
      setUserLoaded(true);
      return;
    }

    try {
      const res = await fetch("/api/me", { headers });
      const json = await res.json();

      const dataUser = json?.data?.user ?? json?.data ?? json;

      // CARI KODE LAB DI BANYAK TEMPAT
      const kodeRuangan =
        dataUser?.kode_ruangan ?? dataUser?.lab?.kode_ruangan ?? null;

      // fallback: cocokkan kode_bagian dengan master_lab via /api/labs/options
      if (!kodeRuangan && dataUser?.kode_bagian) {
        try {
          const labRes = await fetch("/api/labs/options", { headers });
          const labJson = await labRes.json();
          const allLabs = labJson?.data ?? [];

          const labFound = allLabs.find(
            (l: any) =>
              String(l.kode_bagian).toUpperCase() ===
              String(dataUser.kode_bagian).toUpperCase()
          );

          if (labFound) {
            setAdminLabKodeRuangan(labFound.kode_ruangan);

            if (setAuthUser) {
              setAuthUser({
                ...authUser,
                kode_ruangan: labFound.kode_ruangan,
              });
            }
          }
        } catch (e) {
          console.warn("Gagal fallback cari lab:", e);
        }
      }

      if (kodeRuangan) {
        const normalized = String(kodeRuangan).toUpperCase();
        setAdminLabKodeRuangan(normalized);

        if (setAuthUser) {
          setAuthUser({ ...authUser, kode_ruangan: normalized });
        }
      }
    } catch (e) {
      console.warn("fetchProfileIfNeeded:", e);
    } finally {
      setUserLoaded(true);
    }
  };

  /* ------------------ API LOAD FUNCTIONS ------------------ */
  // LOAD OPNAME
  const loadOpname = async (labParam?: string | null) => {
    if (!token) {
      setHasToken(false);
      toast.error("Sesi login berakhir, silakan login kembali");
      return;
    }

    try {
      setLoading(true);

      let url = "/api/stok-opname";

      if (isSuperadmin) {
        if (!labParam) {
          setOpnameData([]);
          return;
        }
        url = `/api/stok-opname?lab=${encodeURIComponent(labParam.toUpperCase())}`;
      }

      if (isAdminLab) {
        // Pastikan kita punya kode_ruangan admin
        if (!adminLabKodeRuangan) {
          setOpnameData([]);
          return;
        }
        url = `/api/stok-opname?lab=${encodeURIComponent(adminLabKodeRuangan)}`;
      }

      const res = await fetch(url, { headers });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Gagal memuat");

      const raw = Array.isArray(json.data) ? json.data : [];

      // GLOBAL SORTING — newest first
      const sorted = raw.sort(
        (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
      );

      setOpnameData(sorted);

    } catch (err: any) {
      toast.error(err?.message ?? "Gagal memuat data opname");
    } finally {
      setLoading(false);
    }
  };

  // LOAD BARANG PER LAB
  const loadBarangForLab = async (labKode: string | null) => {
    if (!token || !labKode) {
      setBarangList([]);
      return [];
    }

    try {
      const res = await fetch(
        `/api/stok-opname/barang?lab=${encodeURIComponent(labKode)}`,
        { headers }
      );
      const json = await res.json();

      if (!json.success) {
        setBarangList([]);
        return [];
      }

      const data: Barang[] = Array.isArray(json.data) ? json.data : [];
      setBarangList(data);
      return data;
    } catch (e) {
      console.error("loadBarangForLab error:", e);
      setBarangList([]);
      return [];
    }
  };

  // LOAD LABS (SUPERADMIN)
  const loadLabs = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/labs/options", { headers });
      const json = await res.json();
      if (!json.success) return;
      setLabs(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      console.error("loadLabs error:", e);
    }
  };

  /* ------------------ INITIAL / REACTIVE LOADS ------------------ */
  useEffect(() => {
    if (!token) {
      setHasToken(false);
      return;
    }

    setHasToken(true);

    const init = async () => {
      setInitialLoading(true);

      try {
        await Promise.all([
          fetchProfileIfNeeded(),
          isSuperadmin ? loadLabs() : Promise.resolve(),
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setUserLoaded(true);
        setInitialLoading(false); // ✅ INI YANG PENTING
      }
    };

    init();
  }, []);

  // setelah userLoaded, jalankan task awal yang depend pada role & kode_ruangan
  useEffect(() => {
    if (!userLoaded) return;
    if (!token) return;

    const loadData = async () => {
      setLoading(true);

      try {
        // ADMIN LAB
        if (isAdminLab && adminLabKodeRuangan) {
          setSelectedLabKode(adminLabKodeRuangan);

          await loadOpname(adminLabKodeRuangan); // hanya sekali
        }

        // SUPERADMIN → tidak load apa-apa disini (baru load saat pilih lab)
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userLoaded, adminLabKodeRuangan]);

  // SUPERADMIN: ketika pilih lab
  useEffect(() => {
    if (!isSuperadmin) return;
    if (!selectedLabKode) return;

    const loadForLab = async () => {
      try {
        setInitialLoading(true);   // ✅ tampilkan loader global
        await loadOpname(selectedLabKode);
      } finally {
        setInitialLoading(false);  // ✅ sembunyikan loader setelah data siap
      }
    };

    loadForLab();
  }, [selectedLabKode]);



  /* ------------------ Helpers ------------------ */
  const filterByMonthYear = (lab: string | null) => {
    if (!lab || !selectedMonth || !selectedYear) return [];
    const m = Number(selectedMonth);
    const y = Number(selectedYear);
    return opnameData.filter((item) => {
      const t = new Date(item.tanggal);
      return item.kode_ruangan === lab && t.getMonth() + 1 === m && t.getFullYear() === y;
    });
  };

  const getSelisihBadge = (selisih: number) => {
    if (selisih === 0) return <Badge variant="outline">Sesuai</Badge>;
    return (
      <Badge variant={selisih > 0 ? "default" : "destructive"} className="gap-1">
        {selisih > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {selisih > 0 ? `+${selisih}` : selisih}
      </Badge>
    );
  };

  /* ------------------ Export CSV/PDF ------------------ */
  const handleExportCsv = (labParam?: string | null) => {
    const lab = labParam ?? (isAdminLab ? adminLabKodeRuangan : selectedLabKode);
    if (!lab) return toast.error("Pilih lab terlebih dahulu.");

    const rows = selectedMonth && selectedYear ? filterByMonthYear(lab) : opnameData.filter((i) => i.kode_ruangan === lab);

    if (!rows || rows.length === 0) return toast.error("Tidak ada data untuk diekspor.");

    const header = ["Tanggal", "Nama Barang", "Stok Sistem", "Stok Fisik", "Selisih", "Tipe"];
    const dataRows = rows.map((r) => [
      format(new Date(r.tanggal), "dd/MM/yyyy HH:mm"),
      r.nama_barang,
      String(r.stok_sistem),
      String(r.stok_fisik),
      String(r.selisih),
      r.tipe,
    ]);

    const csvContent = [header, ...dataRows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const monthPart = selectedMonth ?? "all";
    const yearPart = selectedYear ?? "all";
    a.download = `stok-opname-${lab}-${monthPart}-${yearPart}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV berhasil dibuat dan diunduh.");
  };

  const handleExportPdf = (labParam?: string | null) => {
    const lab = labParam ?? (isAdminLab ? adminLabKodeRuangan : selectedLabKode);
    if (!lab) return toast.error("Pilih lab terlebih dahulu.");

    const rows = selectedMonth && selectedYear ? filterByMonthYear(lab) : opnameData.filter((i) => i.kode_ruangan === lab);
    if (!rows || rows.length === 0) return toast.error("Tidak ada data untuk diekspor.");

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`Laporan Stok Opname - ${lab}`, 14, 16);

    const body = rows.map((r) => [
      format(new Date(r.tanggal), "dd/MM/yyyy HH:mm"),
      r.nama_barang,
      r.stok_sistem,
      r.stok_fisik,
      r.selisih,
      r.tipe,
    ]);

    autoTable(doc, {
      startY: 24,
      head: [["Tanggal", "Nama Barang", "Stok Sistem", "Stok Fisik", "Selisih", "Tipe"]],
      body,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      tableLineColor: [180, 180, 180],
      tableLineWidth: 0.5,
    });

    const monthPart = selectedMonth ?? "all";
    const yearPart = selectedYear ?? "all";
    doc.save(`stok-opname-${lab}-${monthPart}-${yearPart}.pdf`);
    toast.success("PDF berhasil dibuat dan diunduh.");
  };

  /* ------------------ Opname start / submit ------------------ */
  const openStartOpname = async () => {
    const labKode = isAdminLab ? adminLabKodeRuangan : selectedLabKode;

    if (!labKode) {
      toast.error("Lab tidak ditemukan.");
      return;
    }

    // LOAD BARANG HANYA KETIKA UNTUK DIALOG
    const data = await loadBarangForLab(labKode);

    const items: OpnameItem[] = data.map((b: any) => ({
      kode_barang: b.kode_barang,
      nama_barang: b.nama_barang,
      stok_sistem: b.stok_sistem ?? b.stok_akhir ?? 0,
      stok_fisik: b.stok_sistem ?? b.stok_akhir ?? 0,
    }));

    setOpnameItems(items);
    setDialogOpen(true);
  };


  const handleChangeItem = (kode: string, newStokFisik: number) => {
    setOpnameItems((prev) => prev.map((p) => (p.kode_barang === kode ? { ...p, stok_fisik: Number(newStokFisik) } : p)));
  };

  const handleSubmitOpname = async () => {
    if (!token) {
      toast.error("Sesi tidak ditemukan, login ulang.");
      return;
    }

    if (!opnameItems || opnameItems.length === 0) {
      toast.error("Tidak ada barang untuk disimpan.");
      return;
    }

    for (const it of opnameItems) {
      if (Number.isNaN(it.stok_fisik) || it.stok_fisik < 0) {
        toast.error("Jumlah stok fisik harus bilangan >= 0.");
        return;
      }
    }

    const modifiedItems = opnameItems.filter((i) => i.stok_fisik !== i.stok_sistem);
    if (modifiedItems.length === 0) {
      toast.error("Tidak ada perubahan stok yang disimpan.");
      return;
    }

    // kodeRuanganToSend: backend expects FE to send kode_bagian as 'kode_ruangan' for admin case (controller maps it)
    const kodeRuanganToSend = isAdminLab ? authUser?.kode_bagian : selectedLabKode;
    if (!kodeRuanganToSend) return toast.error("Kode ruangan tidak ditemukan.");

    const payload = {
      kode_ruangan: kodeRuanganToSend,
      barang: modifiedItems.map((i) => ({
        kode_barang: i.kode_barang,
        stok_sistem: i.stok_sistem,
        stok_fisik: i.stok_fisik,
      })),
    };

    try {
      setLoading(true);
      const res = await fetch("/api/stok-opname", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Gagal menyimpan");

      toast.success("Stok Opname berhasil disimpan!");
      setDialogOpen(false);

      // reload opname list (use the lab code that loadOpname expects)
      const labToReload = isAdminLab ? adminLabKodeRuangan : selectedLabKode;
      await loadOpname(labToReload ?? undefined);
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal menyimpan opname");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ Render ------------------ */

  if (isSuperadmin && initialLoading) {
    return (
      <div className="flex justify-center pt-6">
        <p className="text-muted-foreground animate-pulse text-base">
          Memuat data...
        </p>
      </div>
    );
  }

  if (isAdminLab && (loading || hasToken === null || !userLoaded)) {
    return (
        <p className="flex justify-center pt-6 text-muted-foreground animate-pulse">
        Memuat data...
      </p>
    );
  }

  if (hasToken === false) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold">Sesi tidak ditemukan</h3>
            <p className="text-sm text-muted-foreground">Silakan login ulang untuk mengakses halaman stok opname.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Superadmin view
  if (isSuperadmin) {

    if (!selectedLabKode) {
      // Sort based on nama_lab ascending
      const sortedLabs = [...labs].sort((a, b) => a.nama_lab.localeCompare(b.nama_lab));

      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Stok Opname</h1>
            <p className="text-muted-foreground">Pilih laboratorium untuk melihat riwayat stok opname.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedLabs.map((lab) => (
              <div
                key={lab.kode_ruangan}
                className="p-6 border rounded-lg cursor-pointer hover:shadow-md"
                onClick={() => {
                  setInitialLoading(true);   
                  setSelectedLabKode(lab.kode_ruangan);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary/20 rounded-lg">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>

                <h3 className="font-semibold text-lg">{lab.nama_lab}</h3>
                <p className="text-sm text-muted-foreground">{lab.kode_ruangan}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const lab = labs.find((l) => l.kode_ruangan === selectedLabKode);
    const filteredByLab = opnameData.filter((o) => o.kode_ruangan === selectedLabKode);

    // sort newest first (tanggal DESC)
    const sortedOpname = [...filteredByLab].sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedLabKode(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">{lab?.nama_lab}</h1>
            <p className="text-muted-foreground">{lab?.kode_ruangan}</p>
          </div>
        </div>

        {/* FILTER */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Riwayat Stok Opname</h2>
          <div className="flex items-center gap-2">
            <Select onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Januari",
                  "Februari",
                  "Maret",
                  "April",
                  "Mei",
                  "Juni",
                  "Juli",
                  "Agustus",
                  "September",
                  "Oktober",
                  "November",
                  "Desember",
                ].map((bln, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {bln}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }).map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button onClick={() => handleExportCsv(selectedLabKode)} className="bg-primary text-white">
              Download CSV
            </Button>
            <Button onClick={() => handleExportPdf(selectedLabKode)} className="bg-red-600 text-white">
              Download PDF
            </Button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border rounded-md overflow-hidden">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">Tanggal</th>
                <th className="p-3 text-left">Barang</th>
                <th className="p-3 text-left">Sistem</th>
                <th className="p-3 text-left">Fisik</th>
                <th className="p-3 text-left">Selisih</th>
              </tr>
            </thead>
            <tbody>
              {sortedOpname.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Belum ada data stok opname
                  </td>
                </tr>
              ) : (
                sortedOpname.map((item) => (
                  <tr key={`${item.id_opname}-${item.id_detail}-${item.kode_barang}`} className="border-b hover:bg-muted/40">
                    <td className="p-3">{format(new Date(item.tanggal), "dd MMMM yyyy", { locale: idLocale })}</td>
                    <td className="p-3">{item.nama_barang}</td>
                    <td className="p-3">{item.stok_sistem}</td>
                    <td className="p-3">{item.stok_fisik}</td>
                    <td className="p-3">{getSelisihBadge(item.selisih)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ADMIN LAB VIEW
  if (isAdminLab) {
    // opnameData already loaded for this admin lab by loadOpname
    const filteredByLab = opnameData;

    const sortedOpname = [...filteredByLab].sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Stok Opname - {adminLabKodeRuangan ?? "—"}</h1>
            <p className="text-muted-foreground mt-2">Pengecekan dan penyesuaian stok.</p>
          </div>

          <Button onClick={openStartOpname}>
            <Plus className="w-4 h-4" /> Mulai Stok Opname
          </Button>
        </div>

        {/* Dialog Start */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Mulai Stok Opname</DialogTitle>
              <DialogDescription>Masukkan stok fisik setiap barang.</DialogDescription>
            </DialogHeader>

            <div className="max-h-[420px] overflow-y-auto border rounded-md p-3 mt-2">
              {opnameItems.length === 0 ? (
                <div className="p-4 text-muted-foreground">Tidak ada barang.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Barang</th>
                      <th className="p-2 text-left">Sistem</th>
                      <th className="p-2 text-left">Fisik</th>
                      <th className="p-2 text-left">Selisih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opnameItems.map((item) => {
                      const selisih = item.stok_fisik - item.stok_sistem;
                      return (
                        <tr key={item.kode_barang} className="border-b hover:bg-muted/30">
                          <td className="p-2">{item.nama_barang}</td>
                          <td className="p-2">{item.stok_sistem}</td>
                          <td className="p-2 w-40">
                            <Input
                              type="number"
                              min={0}
                              value={item.stok_fisik}
                              onChange={(e) => handleChangeItem(item.kode_barang, Number(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            {selisih === 0 ? (
                              <Badge variant="outline">Sesuai</Badge>
                            ) : (
                              <Badge variant={selisih > 0 ? "default" : "destructive"}>
                                {selisih > 0 ? `+${selisih}` : selisih}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmitOpname}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Riwayat Stok Opname</h2>
          <div className="flex items-center gap-2">
            <Select onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Januari",
                  "Februari",
                  "Maret",
                  "April",
                  "Mei",
                  "Juni",
                  "Juli",
                  "Agustus",
                  "September",
                  "Oktober",
                  "November",
                  "Desember",
                ].map((bln, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {bln}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }).map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button onClick={() => handleExportCsv(adminLabKodeRuangan)} className="bg-primary text-white">
              Download CSV
            </Button>
            <Button onClick={() => handleExportPdf(adminLabKodeRuangan)} className="bg-red-600 text-white">
              Download PDF
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border rounded-md overflow-hidden">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">Tanggal</th>
                <th className="p-3 text-left">Barang</th>
                <th className="p-3 text-left">Sistem</th>
                <th className="p-3 text-left">Fisik</th>
                <th className="p-3 text-left">Selisih</th>
              </tr>
            </thead>
            <tbody>
              {sortedOpname.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Belum ada data.
                  </td>
                </tr>
              ) : (
                sortedOpname.map((item) => (
                  <tr key={`${item.id_opname}-${item.id_detail}-${item.kode_barang}`} className="border-b hover:bg-muted/40">
                    <td className="p-3">{format(new Date(item.tanggal), "dd MMMM yyyy", { locale: idLocale })}</td>
                    <td className="p-3">{item.nama_barang}</td>
                    <td className="p-3">{item.stok_sistem}</td>
                    <td className="p-3">{item.stok_fisik}</td>
                    <td className="p-3">{getSelisihBadge(item.selisih)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return <p className="p-6">Tidak ada akses.</p>;
}
