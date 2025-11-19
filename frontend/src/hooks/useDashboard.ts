import { useQuery } from "@tanstack/react-query";
import { DashboardService } from "@/services/dashboard.service";
import { api } from "@/lib/api";

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const res = await api.get("/dashboard/summary");
      return res.data;
    },
  });
};