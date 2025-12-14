import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type Barang = {
  kode_barang: string;
  nama_barang: string;
  satuan?: string;
};

type DetailPermintaan = {
  kode_barang: string;
  qty_diminta: number;
  qty_dikirim?: number;
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

const LogistikRole: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [listPermintaan, setListPermintaan] = useState<Permintaan[]>([]);

  // ============================
  // LOAD DATA PERMINTAAN
  // ============================
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/permintaan-logistik");
      const data: Permintaan[] = res.data.data ?? [];

      setListPermintaan(
        data.sort((a, b) => {
          const order = { menunggu: 1, dikirim: 2, selesai: 3 };
          return order[a.status] - order[b.status];
        })
      );
    } catch (err: any) {
      toast({
        title: "Gagal memuat permintaan",
        description: err?.response?.data?.message ?? err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================
  // UPDATE QTY DIKIRIM
  // ============================
  const updateQty = (
    id: number,
    kode: string,
    qty: number
  ) => {
    setListPermintaan((prev) =>
      prev.map((p) =>
        p.id_permintaan !== id
          ? p
          : {
              ...p,
              detail: p.detail.map((d) =>
                d.kode_barang === kode
                  ? { ...d, qty_dikirim: qty }
                  : d
              ),
            }
      )
    );
  };

  // ============================
  // KIRIM BARANG
  // ============================
  const handleKirim = async (p: Permintaan) => {
    try {
      await api.put(`/permintaan-logistik/${p.id_permintaan}/kirim`, {
        detail: p.detail.map((d) => ({
          kode_barang: d.kode_barang,
          qty_dikirim: d.qty_dikirim ?? d.qty_diminta,
        })),
      });

      toast({ title: "Barang berhasil dikirim" });
      loadData();
    } catch (err: any) {
      toast({
        title: "Gagal mengirim",
        description: err?.response?.data?.message ?? err.message,
        variant: "destructive",
      });
    }
  };

  const formatTanggal = (tgl: string) => {
    const d = new Date(tgl);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading)
    return (
      <p className="text-center p-6 text-muted-foreground">
        Memuat data...
      </p>
    );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2">
          Selamat Datang Logistik
        </h1>
        <p className="text-blue-100 text-sm">
          Kelola dan proses permintaan barang dari laboratorium
        </p>
      </div>

      <div className="space-y-4">
        {listPermintaan.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center shadow">
            <p className="text-muted-foreground text-sm">
              Tidak ada permintaan yang harus diproses.
            </p>
          </div>
        )}

        {listPermintaan.map((p) => (
          <div
            key={p.id_permintaan}
            className={`bg-white text-gray-900 rounded-xl p-5 shadow space-y-3 
            ${p.status === "selesai" ? "opacity-70" : ""}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                    Permintaan - {p.nama_lab ?? p.kode_ruangan}
                </h3>
                <p className="text-xs text-black">
                  Tanggal: {formatTanggal(p.tanggal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Lab: {p.nama_lab}
                </p>
                {p.keterangan && (
                  <p className="text-xs text-blue-700 mt-1">
                    Keterangan: {p.keterangan}
                  </p>
                )}
              </div>

              <span
                className={`px-3 py-1 text-xs rounded-full text-white 
                ${p.status === "menunggu" ? "bg-orange-500" : 
                  p.status === "dikirim" ? "bg-blue-500" : 
                  "bg-green-600"}`}
              >
                {p.status}
              </span>
            </div>

            {/* LIST BARANG */}
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-2">Daftar Barang</p>
              {p.detail.map((d, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-white p-3 rounded-md border"
                >
                <div className="flex-1">
                    {/* Nama Barang */}
                    <p className="font-semibold text-gray-900">
                        {d.barang?.nama_barang}
                    </p>

                    {/* Qty diminta */}
                    <p className="text-xs text-gray-600 mt-1">
                        Diminta: {d.qty_diminta} {d.barang?.satuan}
                    </p>
                </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Qty Dikirim</p>
                      <Input
                        type="number"
                        min={0}
                        value={d.qty_dikirim ?? d.qty_diminta}
                        onChange={(e) =>
                          updateQty(
                            p.id_permintaan,
                            d.kode_barang,
                            Number(e.target.value)
                          )
                        }
                        className="w-24 mt-1"
                        disabled={p.status === "dikirim"}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ACTION */}
            {p.status === "menunggu" && (
              <div className="flex justify-end">
                <Button onClick={() => handleKirim(p)}>
                  Kirim Barang
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogistikRole;
