import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { ArrowLeft, AlertTriangle, Building2, ChevronRight, Search,Package } from "lucide-react";
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

  const { user: authUser } = useAuth();

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

  // AUTO PILIH LAB UNTUK ADMIN LAB
  useEffect(() => {
    if (!authUser) return;
    if (authUser.role !== "admin_lab") return;
    if (labs.length === 0) return;

    const kodeUser = String(authUser.kode_bagian ?? "").toLowerCase();

    const userLab = labs.find((l) =>
      String(l.kode_ruangan ?? l.kode_bagian ?? l.kode ?? "")
        .toLowerCase() === kodeUser
    );

    if (userLab) {
      const pick = userLab.kode_ruangan ?? userLab.kode_bagian ?? userLab.kode;
      if (pick) setSelectedLabKode(String(pick));
    }
  }, [labs, authUser]);


  useEffect(() => {
    const reload = () => {
      listInventaris().then((data) => {
        setInventaris(Array.isArray(data) ? data : []);
      });
    };

    window.addEventListener("stok-updated", reload);
    return () => window.removeEventListener("stok-updated", reload);
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

  useEffect(() => {
    setLoadingTransfer(true);
    setErrorTransfer(null);

    listTransfer()
      .then((all) => {
        if (!Array.isArray(all)) {
          setTransferData([]);
          return;
        }

        if (isAdmin()) {
          // kalau superadmin tapi BELUM pilih lab → tampilkan SEMUA dulu
          if (!selectedLabKode) {
            setTransferData(all);
            return;
          }

          const kode = selectedLabKode.toUpperCase();

          const filtered = all.filter((t: any) => {
            const dari =
              t.kode_ruangan_dari ||
              t.kode_bagian_dari ||
              t.lab_asal ||
              "";

            const tujuan =
              t.kode_ruangan_tujuan ||
              t.kode_bagian_tujuan ||
              t.lab_tujuan ||
              "";

            return (
              String(dari).toUpperCase() === kode ||
              String(tujuan).toUpperCase() === kode
            );
          });

          setTransferData(filtered);
        } else {
          setTransferData(all);
        }
      })
      .catch(() => setErrorTransfer("Gagal memuat data transfer barang"))
      .finally(() => setLoadingTransfer(false));
  }, [selectedLabKode]);

  const userLabId = getUserLab();

  const availableLabs = useMemo(() => {
    return labs;
  }, [labs]);

  // Jika belum pilih lab, tampilkan kartu lab; kalau udah pilih, tampilkan data item di lab tersebut
  const baseData = useMemo(() => {
    if (!selectedLabKode) return inventaris;

    const kode = String(selectedLabKode).toLowerCase();
    return inventaris
      .filter((i) =>
        String(i.kode_ruangan ?? i.lab ?? i.kode_bagian ?? "").toLowerCase() === kode
        || String(i.kode_bagian ?? "").toLowerCase() === kode
        || String(i.lab ?? "").toLowerCase() === kode
      )
      .map((item) => ({
        ...item,
        stok_akhir: Number(item.stok_akhir ?? 0),
      }));
  }, [inventaris, selectedLabKode]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return baseData;
    const q = searchTerm.toLowerCase();
    return baseData.filter((item) => (item.nama_barang || "").toLowerCase().includes(q));
  }, [baseData, searchTerm]);

  const totalInventarisPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedInventaris = useMemo(() => {
    const start = (inventarisPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, inventarisPage]);

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

  if (loading) {
    return (
      <p className="text-center p-6 text-muted-foreground">
        Memuat data...
      </p>
    );
  }

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-primary">
        Inventaris Barang
      </h1>

      {authUser?.role === "superadmin" && selectedLab && (
        <div className="flex items-center gap-4 mt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedLabKode(null)}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div>
            <h2 className="text-lg font-bold text-primary">
              {selectedLab.nama}
            </h2>
            <p className="text-xs text-muted-foreground">
              {selectedLab.kode_ruangan} - {selectedLab.kode_bagian}
            </p>
          </div>
        </div>
      )}

      {authUser?.role === "superadmin" && !selectedLabKode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {availableLabs.map((lab, index) => {
            const pick =
              lab.kode_ruangan ?? lab.kode_bagian ?? lab.kode ?? null;

            return (
              <div
                key={lab.id ?? `lab-${index}`}
                className="p-6 border rounded-lg cursor-pointer hover:shadow-md transition-all"
                onClick={() => pick && setSelectedLabKode(String(pick))}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary/20 rounded-lg">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>

                <h3 className="font-semibold text-lg">{lab.nama}</h3>
                <p className="text-sm text-muted-foreground">
                  {lab.kode_ruangan} - {lab.kode_bagian}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 border-b pb-2 mt-4">
        <Button
          variant={activeTab === "inventaris" ? "default" : "outline"}
          className="rounded-xl px-4"
          onClick={() => setActiveTab("inventaris")}
        >
          Inventaris Barang
        </Button>

        <Button
          variant={activeTab === "transfer" ? "default" : "outline"}
          className="rounded-xl px-4"
          onClick={() => setActiveTab("transfer")}
        >
          Transfer Barang
        </Button>
      </div>

      {activeTab === "inventaris" ? (
        <>
          {/* ===== FILTER BAR INVENTARIS ===== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 px-1">
            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">
                Pencarian
              </label>
              <input
                type="text"
                placeholder="Cari barang..."
                className="border px-3 py-2 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* TABLE INVENTARIS */}
          <div className="overflow-x-auto mt-4 border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">Nama Barang</th>
                  <th className="p-3 text-left">Stok Akhir</th>
                  <th className="p-3 text-left">Satuan</th>
                  <th className="p-3 text-left">Kategori</th>
                  <th className="p-3 text-left">Deskripsi</th>
                </tr>
              </thead>

              <tbody>
                {paginatedInventaris.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      Tidak ada data inventaris
                    </td>
                  </tr>
                ) : (
                  paginatedInventaris.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{item.nama_barang}</td>
                      <td className="p-3">{item.stok_akhir}</td>
                      <td className="p-3">{item.satuan}</td>
                      <td className="p-3">{item.kategori}</td>
                      <td className="p-3">{item.deskripsi ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
        </>
      ) : (
        <>
          {/* FILTER BAR TRANSFER */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 px-1">

            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">
                Pencarian
              </label>
              <input
                type="text"
                placeholder="Cari barang / lab..."
                className="border px-3 py-2 rounded-md"
                value={searchTransfer}
                onChange={(e) => setSearchTransfer(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">
                Tanggal Awal
              </label>
              <input
                type="date"
                className="border px-3 py-2 rounded-md"
                value={filterTanggalAwal}
                onChange={(e) => setFilterTanggalAwal(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">
                Tanggal Akhir
              </label>
              <input
                type="date"
                className="border px-3 py-2 rounded-md"
                value={filterTanggalAkhir}
                onChange={(e) => setFilterTanggalAkhir(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-muted-foreground mb-1">
                Status
              </label>
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

          {/* TABLE TRANSFER */}
          <div className="overflow-x-auto mt-4 border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
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
                  ) : null
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  ); 
}