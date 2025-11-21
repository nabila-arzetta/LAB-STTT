import { api } from "@/lib/api";

export type TransferDetail = {
  kode_barang: string;
  nama_barang?: string;
  satuan?: string;
  quantity: number;
  qty_approved?: number;
};

export type Transfer = {
  id_transfer: number;
  kode_ruangan_dari: string;
  lab_asal?: string;

  kode_ruangan_tujuan: string;
  lab_tujuan?: string;

  tanggal: string;
  keterangan?: string;
  
  status: "pending" | "approved" | "partial_approved" | "rejected" | "completed";
  created_at?: string;

  detail: TransferDetail[];
};

// GET ALL TRANSFER BARANG
export async function listTransfer(): Promise<Transfer[]> {
  try {
    const res = await api.get("/transfer-barang"); // backend sudah filter role
    const data = res.data?.data ?? [];

    if (!Array.isArray(data)) return [];

    return data.map((t: any) => ({
      id_transfer: t.id_transfer,
      kode_ruangan_dari: t.kode_ruangan_dari,
      lab_asal: t.lab_asal,

      kode_ruangan_tujuan: t.kode_ruangan_tujuan,
      lab_tujuan: t.lab_tujuan,

      tanggal: t.tanggal,
      keterangan: t.keterangan,

      status: t.status,
      created_at: t.created_at,

      detail: Array.isArray(t.detail)
        ? t.detail.map((d: any) => ({
            kode_barang: d.kode_barang,
            nama_barang: d.nama_barang,
            satuan: d.satuan,
            quantity: Number(d.quantity ?? 0),
            qty_approved: d.qty_approved,
          }))
        : [],
    })) as Transfer[];

  } catch (err) {
    console.error("Gagal ambil transfer barang:", err);
    return [];
  }
}
