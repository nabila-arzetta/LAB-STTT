import { api } from "@/lib/api";

export type Peminjaman = {
  id: number;
  tanggal: string;
  barang_id: number;
  lab_id?: number;
  jumlah?: number;
  status: string;
};

export async function listPeminjaman(): Promise<Peminjaman[]> {
  try {
    const res = await api.get("/peminjaman");
    if (res.data && Array.isArray(res.data)) {
      return res.data as Peminjaman[];
    }
    if (res.data?.data && Array.isArray(res.data.data)) {
      return res.data.data as Peminjaman[];
    }
    return [];
  } catch (err) {
    console.error("❌ Gagal ambil data peminjaman:", err);
    return [];
  }
}
