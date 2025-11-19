import React, { useEffect } from "react";
import { StatsCard } from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/button";
import {
  Package,
  ActivitySquare,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDashboardSummary } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";

export const DashboardAdmin: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "superadmin";

  const { data, isLoading, isError, refetch } = useDashboardSummary();

  const stats = data?.stats ?? {
    totalBarang: 0,
    totalUser: 0,
    totalLab: 0,
  };

  useEffect(() => {
    if (isError) {
      toast({
        title: "Gagal memuat data",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
    }
  }, [isError]);

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Memuat dashboard...</div>;
  }

  if (isError) {
    return (
      <div className="p-6 text-destructive">
        Gagal memuat dashboard.
        <Button variant="outline" size="sm" className="ml-2" onClick={() => refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ====================== */}
      {/* HEADER */}
      {/* ====================== */}
      <div>
        {isSuperAdmin ? (
          <>
            <h1 className="text-3xl font-bold text-primary">
              Selamat Datang, Superadmin 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Pantau seluruh inventaris, pengguna, dan laboratorium dari satu tempat.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-primary">
              Selamat Datang, Admin Lab {data?.labName ?? ""}
            </h1>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              Berikut adalah panduan singkat penggunaan aplikasi:<br /><br />
              • Gunakan menu <b>Master Barang</b> untuk melihat dan memperbarui daftar barang.<br />
              • Gunakan menu <b>Inventaris Barang</b> untuk memantau stok dan detail barang.<br />
              • Gunakan menu <b>Penggunaan Barang</b> untuk mencatat aktivitas pemakaian.<br />
              • Gunakan menu <b>Penerimaan Logistik</b> untuk mencatat barang masuk.<br />
              • Gunakan menu <b>Transfer Barang</b> untuk memindahkan barang antar lab.<br />
              • Gunakan menu <b>Stok Opname</b> untuk melakukan pengecekan stok berkala.<br /><br />
              Jika ada kendala, hubungi superadmin untuk bantuan.
            </p>
          </>
        )}
      </div>

      {/* ====================== */}
      {/* SUPERADMIN STATS ONLY */}
      {/* ====================== */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Barang"
            value={stats.totalBarang}
            icon={Package}
          />

          <StatsCard
            title="Total User"
            value={stats.totalUser}
            icon={Users}
            variant="primary"
          />

          <StatsCard
            title="Total Lab"
            value={stats.totalLab}
            icon={ActivitySquare}
            variant="success"
          />

          <StatsCard
            title="Low Stock"
            value={data?.lowStock?.length ?? 0}
            icon={AlertTriangle}
            variant="warning"
          />
        </div>
      )}

      {/* ====================== */}
      {/* ADMIN = NO CARDS */}
      {/* ====================== */}
      {!isSuperAdmin && (
        <div className="text-muted-foreground text-sm">
          {/* Admin memang tidak ada card. */}
        </div>
      )}

    </div>
  );
};

export default DashboardAdmin;
