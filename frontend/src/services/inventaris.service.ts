import { api } from "@/lib/api";

export type StokInventaris = {
  id_barang: number;
  kode_barang?: string;
  nama_barang?: string;
  kategori?: string;
  satuan?: string;
  deskripsi?: string;
  stok_akhir: number;
  lab?: string; // mis. 'L-BHS'
  kode_ruangan?: string;
  kode_bagian?: string;
  can_manage?: boolean;
};

export async function listInventaris(): Promise<StokInventaris[]> {
  try {
    const res = await api.get("/inventaris"); // endpoint inventaris controller
    const data = res.data?.data ?? res.data ?? [];
    if (!Array.isArray(data)) return [];

    return data.map((it: any) => ({
      id_barang: it.id_barang ?? it.id ?? 0,
      kode_barang: it.kode_barang ?? null,
      nama_barang: it.nama_barang ?? it.nama_barang ?? "",
      kategori: it.kategori ?? "",
      satuan: it.satuan ?? "",
      deskripsi: it.deskripsi ?? "",
      stok_akhir: Number(it.stok_akhir ?? 0),
      lab: it.lab ?? (it.kode_ruangan ?? ""),
      kode_ruangan: it.kode_ruangan ?? null,
      kode_bagian: it.kode_bagian ?? null,
      can_manage: !!it.can_manage,
    })) as StokInventaris[];
  } catch (err) {
    console.error("Gagal ambil inventaris:", err);
    return [];
  }
}
