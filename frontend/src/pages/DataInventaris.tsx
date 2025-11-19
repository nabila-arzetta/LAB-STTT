import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { ArrowLeft, AlertTriangle, Building2, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listInventaris, type StokInventaris } from "@/services/inventaris.service";
import { listLabs, type LabDTO } from "@/services/lab.service";

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

        {errorMsg && <Card className="border-destructive/40"><CardContent className="p-4 text-destructive">{errorMsg}</CardContent></Card>}

        {loading ? (
          <div className="text-sm text-muted-foreground">Memuat data…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableLabs.map((lab, index) => {
              const totalBarang = inventaris.filter(i =>
                String(i.kode_ruangan ?? "").toLowerCase() === String(lab.kode_ruangan ?? lab.kode_bagian ?? lab.kode ?? "").toLowerCase()
                || String(i.kode_bagian ?? "").toLowerCase() === String(lab.kode_bagian ?? lab.kode ?? "").toLowerCase()
              ).length;

              const lowStock = inventaris.filter(i =>
                (String(i.kode_ruangan ?? "").toLowerCase() === String(lab.kode_ruangan ?? lab.kode_bagian ?? lab.kode ?? "").toLowerCase()
                  || String(i.kode_bagian ?? "").toLowerCase() === String(lab.kode_bagian ?? lab.kode ?? "").toLowerCase())
                && (i.stok_akhir ?? 0) <= 5
              ).length;

              return (
                <Card
                  key={lab.id ?? `lab-${index}`}
                  className="shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer group"
                  onClick={() => {
                    const pick = lab.kode_ruangan ?? lab.kode_bagian ?? lab.kode ?? null;
                    if (pick) setSelectedLabKode(String(pick));
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-primary/20 rounded-lg"><Building2 className="w-6 h-6 text-primary" /></div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{lab.nama}</h3>
                      <p className="text-sm text-muted-foreground">{lab.kode_bagian ?? lab.kode ?? "-"}</p>
                      <p className="text-sm text-muted-foreground">{lab.lokasi}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Barang</p>
                        <p className="text-xl font-bold">{totalBarang}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Stok Rendah</p>
                        <div className="flex items-center gap-1">
                          {lowStock > 0 && <AlertTriangle className="w-4 h-4 text-destructive" />}
                          <p className="text-xl font-bold">{lowStock}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setSelectedLabKode(null)} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">{selectedLab?.nama ?? "Laboratorium"}</h1>
          <p className="text-muted-foreground mt-1">{selectedLab?.kode_bagian ?? ""}{selectedLab?.lokasi ? ` - ${selectedLab.lokasi}` : ""}</p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle>Daftar Inventaris Barang</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            data={filteredData}
            columns={columnsAdapter}
            searchPlaceholder="Cari nama barang..."
            onSearch={setSearchTerm}
            searchTerm={searchTerm}
            emptyMessage={searchTerm ? "Tidak ada barang yang ditemukan" : "Belum ada data inventaris"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
