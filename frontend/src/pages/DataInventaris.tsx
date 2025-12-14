import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, ChevronRight } from "lucide-react";
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
  const { user: authUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLabKode, setSelectedLabKode] = useState<string | null>(null);

  const [inventaris, setInventaris] = useState<StokInventaris[]>([]);
  const [labs, setLabs] = useState<LabDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const itemsPerPage = 25;
  const [inventarisPage, setInventarisPage] = useState(1);

  // LOAD DATA
  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMsg(null);

    Promise.allSettled([listInventaris(), listLabs()])
      .then((results) => {
        if (!active) return;
        const [barangRes, labsRes] = results;

        if (barangRes.status === "fulfilled")
          setInventaris(Array.isArray(barangRes.value) ? barangRes.value : []);
        else setErrorMsg("Gagal memuat data inventaris.");

        if (labsRes.status === "fulfilled")
          setLabs(Array.isArray(labsRes.value) ? labsRes.value : []);
        else setErrorMsg((prev) => prev ?? "Gagal memuat data laboratorium.");
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  // AUTO PILIH LAB ADMIN LAB
  useEffect(() => {
    if (!authUser || authUser.role !== "admin_lab" || labs.length === 0) return;

    const kodeUser = String(authUser.kode_bagian ?? "").toLowerCase();

    const userLab = labs.find((l) =>
      String(l.kode_ruangan ?? "").toLowerCase() === kodeUser
    );

    if (userLab?.kode_ruangan) {
      setSelectedLabKode(String(userLab.kode_ruangan));
    }
  }, [labs, authUser]);

  // REALTIME UPDATE STOK
  useEffect(() => {
    const reload = () => {
      listInventaris().then((data) => {
        setInventaris(Array.isArray(data) ? data : []);
      });
    };

    window.addEventListener("stok-updated", reload);
    return () => window.removeEventListener("stok-updated", reload);
  }, []);

  // FILTER BERDASARKAN LAB
  const baseData = useMemo(() => {
    if (!selectedLabKode) return inventaris;

    const kode = selectedLabKode.toLowerCase();
    return inventaris
      .filter(
        (i) =>
          String(i.kode_ruangan ?? "").toLowerCase() === kode
      )
      .map((item) => ({
        ...item,
        stok_akhir: Number(item.stok_akhir ?? 0),
      }));
  }, [inventaris, selectedLabKode]);

  // FILTER PENCARIAN
  const filteredData = useMemo(() => {
    if (!searchTerm) return baseData;
    const q = searchTerm.toLowerCase();
    return baseData.filter((item) =>
      (item.nama_barang || "").toLowerCase().includes(q)
    );
  }, [baseData, searchTerm]);

  // PAGINATION
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedInventaris = useMemo(() => {
    const start = (inventarisPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, inventarisPage]);

  const selectedLab = labs.find(
    (l) =>
      String(l.kode_ruangan ?? "").toLowerCase() ===
      (selectedLabKode ?? "").toLowerCase()
  );

  if (loading) {
    return (
      <p className="text-center p-6 text-muted-foreground">Memuat data...</p>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Inventaris Barang</h1>

      {/* HEADER LAB SUPERADMIN */}
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

      {/* KARTU PILIH LAB (SUPERADMIN) */}
      {authUser?.role === "superadmin" && !selectedLabKode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {labs.map((lab, index) => (
            <div
              key={lab.id ?? `lab-${index}`}
              className="p-6 border rounded-lg cursor-pointer hover:shadow-md transition-all"
              onClick={() =>
                lab.kode_ruangan && setSelectedLabKode(String(lab.kode_ruangan))
              }
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
          ))}
        </div>
      )}

      {/* FILTER */}
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

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <Button
            variant="outline"
            disabled={inventarisPage === 1}
            onClick={() => setInventarisPage((p) => p - 1)}
          >
            Prev
          </Button>

          {Array.from({ length: totalPages }).map((_, i) => (
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
            disabled={inventarisPage === totalPages}
            onClick={() => setInventarisPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
