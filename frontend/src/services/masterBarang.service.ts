import { api } from "@/lib/api";

export type MasterBarang = {
  id: number;
  nama_barang: string;
  satuan?: string|null;
  stok_minimum: number;
  lokasi_penyimpanan?: string|null;
  status?: string; 
  deskripsi?: string|null;
};

export const listMasterBarang = () => api.get<MasterBarang[]>("/master-barang");
export const createMasterBarang = (data: Partial<MasterBarang>) => api.post("/master-barang", data);
export const updateMasterBarang = (id: number, data: Partial<MasterBarang>) => api.put(`/master-barang/${id}`, data);
export const deleteMasterBarang = (id: number) => api.delete(`/master-barang/${id}`);
