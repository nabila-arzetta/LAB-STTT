import { api } from "@/lib/api";

export type LabDTO = {
  id: number;
  nama: string;
  kode_bagian?: string | null;
  lokasi?: string | null;
  status?: string;
  can_manage?: boolean;
  kode_ruangan?: string | null;
  kode?: string | null;
};


export async function listLabs(): Promise<LabDTO[]> {
  try {
    // Ambil user dari localStorage
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;

    const isSuperadmin = user?.role === "superadmin";

    // Jika admin_lab, backend hanya mengembalikan lab miliknya
    const endpoint = isSuperadmin ? "/labs" : "/labs?onlyManage=true";

    const res = await api.get(endpoint);
    const data = res.data?.data ?? res.data ?? [];

    if (!Array.isArray(data)) return [];

    // mapping tetap sama seperti sebelumnya
    return data.map((lab: any) => ({
      id: lab.id_lab ?? lab.id ?? 0,
      nama: lab.nama_lab ?? lab.nama ?? "",
      kode_bagian: lab.kode_bagian ?? lab.kode ?? null,
      lokasi: lab.lokasi ?? null,
      status: lab.status ?? "aktif",
      can_manage: lab.can_manage ?? false,
      kode_ruangan: lab.kode_ruangan ?? lab.kode_ruangan ?? null,
      kode: lab.kode_bagian ?? lab.kode ?? null,
    })) as LabDTO[];

  } catch (err) {
    console.error("Gagal mengambil lab:", err);
    return [];
  }
}
