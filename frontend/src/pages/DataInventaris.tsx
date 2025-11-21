import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { ArrowLeft, AlertTriangle, Building2, ChevronRight, Search} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listInventaris, type StokInventaris } from "@/services/inventaris.service";
import { listLabs, type LabDTO } from "@/services/lab.service";
import { listTransfer } from "@/services/transfer.service";

type Column<T> = {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T) => ReactNode;
};

export default function DataInventaris() {
  const { isAdmin, getUserLab } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLabKode, setSelectedLabKode] = useState<string | null>(null);

  const [inventaris, setInventaris] = useState<StokInventaris[]>([]);
  const [labs, setLabs] = useState<LabDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"inventaris" | "transfer">("inventaris");

  const [transferData, setTransferData] = useState<any[]>([]);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [errorTransfer, setErrorTransfer] = useState<string | null>(null);

  const [searchTransfer, setSearchTransfer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTanggalAwal, setFilterTanggalAwal] = useState("");
  const [filterTanggalAkhir, setFilterTanggalAkhir] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const [inventarisPage, setInventarisPage] = useState(1);
  const [transferPage, setTransferPage] = useState(1);


  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMsg(null);

    Promise.allSettled([listInventaris(), listLabs()])
      .then((results) => {
        if (!active) return;
        const [barangRes, labsRes] = results;

        if (barangRes.status === "fulfilled") setInventaris(Array.isArray(barangRes.value) ? barangRes.value : []);
        else setErrorMsg("Gagal memuat data inventaris.");

        if (labsRes.status === "fulfilled") setLabs(Array.isArray(labsRes.value) ? labsRes.value : []);
        else setErrorMsg((prev) => prev ?? "Gagal memuat data laboratorium.");
      })
      .catch(() => setErrorMsg("Gagal memuat data dari server."))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, []);

  const filteredTransfer = useMemo(() => {
    let data = [...transferData];

    // search
    if (searchTransfer) {
      const q = searchTransfer.toLowerCase();
      data = data.filter(t =>
        t.lab_asal?.toLowerCase().includes(q) ||
        t.lab_tujuan?.toLowerCase().includes(q) ||
        t.detail?.some((d: any) =>
          d.nama_barang?.toLowerCase().includes(q) ||
          d.kode_barang?.toLowerCase().includes(q)
        )
      );
    }

    // filter status
    if (filterStatus) {
      data = data.filter(t => t.status === filterStatus);
    }

    // filter tanggal
    if (filterTanggalAwal) {
      data = data.filter(t => new Date(t.tanggal) >= new Date(filterTanggalAwal));
    }
    if (filterTanggalAkhir) {
      data = data.filter(t => new Date(t.tanggal) <= new Date(filterTanggalAkhir));
    }

    return data;
  }, [transferData, searchTransfer, filterStatus, filterTanggalAwal, filterTanggalAkhir]);

  function formatTanggalIndo(tgl: string) {
    if (!tgl) return "-";
    const d = new Date(tgl);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }


  function formatStatus(status: string) {
    const map: Record<string, string> = {
      pending: "Menunggu",
      approved: "Disetujui",
      partial_approved: "Disetujui Sebagian",
      rejected: "Ditolak",
      completed: "Selesai",
    };
    return map[status] ?? status;
  }

  // === LOAD TRANSFER BARANG ===
  useEffect(() => {
    // superadmin harus pilih lab dulu
    if (isAdmin() && !selectedLabKode) return;

    setLoadingTransfer(true);
    setErrorTransfer(null);

    listTransfer()
      .then((all) => {
        if (isAdmin()) {
          // filter berdasarkan lab yang dipilih
          const kode = selectedLabKode?.toUpperCase() ?? "";
          setTransferData(
            all.filter(
              (t: any) =>
                t.kode_ruangan_dari.toUpperCase() === kode ||
                t.kode_ruangan_tujuan.toUpperCase() === kode
            )
          );
        } else {
          // admin_lab: backend sudah filter otomatis
          setTransferData(all);
        }
      })
      .catch(() => setErrorTransfer("Gagal memuat data transfer barang"))
      .finally(() => setLoadingTransfer(false));
  }, [selectedLabKode]);

  const userLabId = getUserLab();

  // Filter lab aktif dan akses user
  const availableLabs = useMemo(() => {
    const activeLabs = labs.filter((l) => (l.status ?? "aktif") === "aktif");
    if (!isAdmin()) {
      // jika bukan superadmin, hanya lab yg sesuai userLabId (kode_bagian atau kode_ruangan)
      if (!userLabId) return activeLabs;
      return activeLabs.filter((l) =>
        String(l.kode_ruangan ?? "").toLowerCase() === String(userLabId).toLowerCase()
        || String(l.kode_bagian ?? "").toLowerCase() === String(userLabId).toLowerCase()
        || String(l.kode ?? "").toLowerCase() === String(userLabId).toLowerCase()
      );
    }
    // superadmin bisa lihat semua aktif
    return activeLabs;
  }, [labs, isAdmin, userLabId]);

  // Jika belum pilih lab, tampilkan kartu lab; kalau pilih, tampilkan data item di lab tersebut
  const baseData = useMemo(() => {
    if (!selectedLabKode) return inventaris;

    const kode = String(selectedLabKode).toLowerCase();
    return inventaris.filter((i) =>
      String(i.kode_ruangan ?? i.lab ?? i.kode_bagian ?? "").toLowerCase() === kode
      || String(i.kode_bagian ?? "").toLowerCase() === kode
      || String(i.lab ?? "").toLowerCase() === kode
    );
  }, [inventaris, selectedLabKode]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return baseData;
    const q = searchTerm.toLowerCase();
    return baseData.filter((item) => (item.nama_barang || "").toLowerCase().includes(q));
  }, [baseData, searchTerm]);

  // Pagination Inventaris
  const totalInventarisPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedInventaris = useMemo(() => {
    const start = (inventarisPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, inventarisPage]);

  // Pagination Transfer
  const totalTransferPages = Math.ceil(filteredTransfer.length / itemsPerPage);
  const paginatedTransfer = useMemo(() => {
    const start = (transferPage - 1) * itemsPerPage;
    return filteredTransfer.slice(start, start + itemsPerPage);
  }, [filteredTransfer, transferPage]);

  const columns: Column<StokInventaris>[] = [
    { key: "nama_barang", header: "Nama Barang", className: "font-medium" },
    {
      key: "stok_akhir",
      header: "Stok Akhir",
      render: (item) => getStockBadge(item.stok_akhir ?? 0),
    },
    { key: "satuan", header: "Satuan" },
    { key: "kategori", header: "Kategori" },
    {
      key: "deskripsi",
      header: "Deskripsi",
      render: (item) => <span className="block max-w-xs truncate" title={item.deskripsi ?? ""}>{item.deskripsi ?? "—"}</span>,
    },
  ];

  const columnsAdapter = columns.map((c) => c) as unknown as { key: string; header: string; className?: string; render?: (row: unknown) => ReactNode }[];

  const columnsTransfer = [
    {
      key: "tanggal",
      header: "Tanggal",
      render: (row: any) => formatTanggalIndo(row.tanggal),
    },
    {
      key: "lab_asal",
      header: "Dari",
    },
    {
      key: "lab_tujuan",
      header: "Ke",
    },
    {
      key: "kode_barang",
      header: "Kode Barang",
    },
    {
      key: "nama_barang",
      header: "Nama Barang",
    },
    {
      key: "quantity",
      header: "Qty",
    },
    {
      key: "status",
      header: "Status",
      render: (row: any) => formatStatus(row.status),
    },
  ];

  function getStockBadge(stok: number) {
    return <span>{stok}</span>;
  }

  const selectedLab = labs.find(l =>
    String(l.kode_ruangan ?? l.kode_bagian ?? l.kode ?? "").toLowerCase() === (selectedLabKode ?? "").toLowerCase()
  );

  // Render
  if (!selectedLabKode) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Data Inventaris</h1>
          <p className="text-muted-foreground mt-1">Pilih laboratorium untuk melihat daftar barang di lab tersebut</p>
        </div>

        {errorMsg && 
        <Card className="border-destructive/40">
          <CardContent 
          className="p-4 text-destructive">{errorMsg}
          </CardContent>
        </Card>}

        {loading ? (
          <div className="text-sm text-muted-foreground">Memuat data…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableLabs.map((lab, index) => {
              const pick = lab.kode_ruangan ?? lab.kode_bagian ?? lab.kode ?? null;

              return (
                <Card
                  key={lab.id ?? `lab-${index}`}
                  className="p-6 border rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-200
                    flex items-center justify-between
                  "
                  onClick={() => pick && setSelectedLabKode(String(pick))}
                >
                  <div className="flex items-center gap-4">
                    
                    <div className="w-16 h-16 rounded-2xl bg-gray-200/70 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-[#0C2340]">
                        {lab.nama}
                      </span>
                      <span className="text-base text-gray-400 font-medium -mt-1">
                        {lab.kode_bagian ?? lab.kode ?? "-"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Card>
              );
            })}

          </div>
        )}
      </div>
    );
  }

  // Detail lab: tabel inventaris lab
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedLabKode(null)}
          className="shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-primary">
            {selectedLab?.nama ?? "Laboratorium"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedLab?.kode_bagian ?? ""}
            {selectedLab?.lokasi ? ` - ${selectedLab.lokasi}` : ""}
          </p>
        </div>
      </div>

      {/* === TAB === */}
      <div className="flex justify-between items-center gap-2 border-b pb-2">
        <div className="flex gap-2">

          {/* TAB INVENTARIS */}
          <Button
            variant={activeTab === "inventaris" ? "default" : "outline"}
            className={`rounded-xl px-4 py-2 ${
              activeTab === "inventaris"
                ? "bg-primary text-white"
                : "border-primary text-primary"
            }`}
            onClick={() => setActiveTab("inventaris")}
          >
            Inventaris Barang
          </Button>

          {/* TAB TRANSFER */}
          <Button
            variant={activeTab === "transfer" ? "default" : "outline"}
            className={`rounded-xl px-4 py-2 ${
              activeTab === "transfer"
                ? "bg-primary text-white"
                : "border-primary text-primary"
            }`}
            onClick={() => setActiveTab("transfer")}
          >
            Transfer Barang
          </Button>
        </div>
      </div>

      {/* === FILTER BAR UNTUK SEMUA TAB === */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">

        {/* === Search Input === */}
        <div className="flex flex-col w-full md:w-1/3">
          <label className="text-xs text-muted-foreground mb-1">Pencarian</label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari barang / lab..."
              className="pl-10 border px-3 py-2 rounded-md w-full"
              value={searchTransfer}
              onChange={(e) => setSearchTransfer(e.target.value)}
            />
          </div>
        </div>

        {/* === Label Tanggal Awal === */}
        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground mb-1">Tanggal Awal</label>
          <input
            type="date"
            className="border px-3 py-2 rounded-md"
            value={filterTanggalAwal}
            onChange={(e) => setFilterTanggalAwal(e.target.value)}
          />
        </div>

        {/* === Label Tanggal Akhir === */}
        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground mb-1">Tanggal Akhir</label>
          <input
            type="date"
            className="border px-3 py-2 rounded-md"
            value={filterTanggalAkhir}
            onChange={(e) => setFilterTanggalAkhir(e.target.value)}
          />
        </div>

        {/* === Status Option === */}
        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground mb-1">Status</label>
          <select
            className="border px-3 py-2 rounded-md"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="partial_approved">Disetujui Sebagian</option>
            <option value="rejected">Ditolak</option>
            <option value="completed">Selesai</option>
          </select>
        </div>

      </div>

      {/* === TAB CONTENT === */}
      {activeTab === "inventaris" ? (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Daftar Inventaris Barang</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={paginatedInventaris}
              columns={columnsAdapter}
              emptyMessage={
                searchTerm
                  ? "Tidak ada barang yang ditemukan"
                  : "Belum ada data"
              }
            />

            {/* PAGINATION KHUSUS INVENTARIS */}
            {totalInventarisPages > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                <Button
                  variant="outline"
                  disabled={inventarisPage === 1}
                  onClick={() => setInventarisPage((p) => p - 1)}
                >
                  Prev
                </Button>

                {Array.from({ length: totalInventarisPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={inventarisPage === i + 1 ? "default" : "outline"}
                    onClick={() => setInventarisPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  disabled={inventarisPage === totalInventarisPages}
                  onClick={() => setInventarisPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}

            {/* PAGINATION KHUSUS TRANSFER */}
            {totalTransferPages > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                <Button
                  variant="outline"
                  disabled={transferPage === 1}
                  onClick={() => setTransferPage((p) => p - 1)}
                >
                  Prev
                </Button>

                {Array.from({ length: totalTransferPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={transferPage === i + 1 ? "default" : "outline"}
                    onClick={() => setTransferPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  disabled={transferPage === totalTransferPages}
                  onClick={() => setTransferPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Daftar Transfer Barang Antar Lab</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTransfer && (
              <p className="text-muted-foreground text-sm">Memuat data transfer…</p>
            )}

            {errorTransfer && (
              <p className="text-destructive">{errorTransfer}</p>
            )}

            {!loadingTransfer && transferData.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Belum ada data transfer barang.
              </p>
            )}

            {!loadingTransfer && transferData.length > 0 && (
              <div className="overflow-x-auto border rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="p-3 text-left">Tanggal</th>
                      <th className="p-3 text-left">Dari</th>
                      <th className="p-3 text-left">Ke</th>
                      <th className="p-3 text-left">Kode Barang</th>
                      <th className="p-3 text-left">Nama Barang</th>
                      <th className="p-3 text-left">Qty</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedTransfer.map((t) =>
                      t.detail.length > 0 ? (
                        t.detail.map((d: any) => (
                          <tr key={`${t.id_transfer}-${d.kode_barang}`} className="border-b">
                            <td className="p-3">{formatTanggalIndo(t.tanggal)}</td>
                            <td className="p-3">{t.lab_asal}</td>
                            <td className="p-3">{t.lab_tujuan}</td>
                            <td className="p-3">{d.kode_barang}</td>
                            <td className="p-3">{d.nama_barang}</td>
                            <td className="p-3">{d.quantity}</td>
                            <td className="p-3">{formatStatus(t.status)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr key={`single-${t.id_transfer}`} className="border-b">
                          <td className="p-3">{formatTanggalIndo(t.tanggal)}</td>
                          <td className="p-3">{t.lab_asal}</td>
                          <td className="p-3">{t.lab_tujuan}</td>
                          <td className="p-3">-</td>
                          <td className="p-3">-</td>
                          <td className="p-3">-</td>
                          <td className="p-3">{formatStatus(t.status)}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

