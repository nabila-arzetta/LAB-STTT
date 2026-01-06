import { api } from "@/lib/api";

export type RecentTx = {
  id: number;
  type: "masuk" | "keluar" | "update";
  item: string;
  quantity: number;
  time: string;
  status: string;
};


export type DashboardSummary = {
  stats: {
    totalBarang: number;
    barangMasuk: number;
    barangKeluar: number;
    antrianBarang: number;
  };
  recent: RecentTx[];
};

export const DashboardService = {
  summary: async (): Promise<DashboardSummary> => {
    const { data } = await api.get("/dashboard/summary");
    return data;
  },
};
