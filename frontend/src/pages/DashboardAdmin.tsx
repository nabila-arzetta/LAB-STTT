import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  AlertTriangle,
  Eye,
  CheckCircle,
  ActivitySquare,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDashboardSummary } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";

// Type untuk transaksi
type TxType = "masuk" | "keluar" | "update";

interface Transaction {
  type: TxType;
  id: number;
  item: string;
  quantity: number;
  time: string;
  status: string;
}

// Fungsi bantu format tanggal
function formatTimeSafe(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

// Komponen Badge status transaksi
function StatusBadge({ status }: { status?: string }) {
  switch (status) {
    case "menunggu":
      return (
        <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
          Menunggu
        </Badge>
      );
    case "diterima":
    case "selesai":
      return (
        <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
          Selesai
        </Badge>
      );
    case "diproses":
      return (
        <Badge variant="secondary" className="bg-primary-accent/20 text-primary-accent border-primary-accent/30">
          Diterima
        </Badge>
      );
    case "update":
      return <Badge variant="outline">Update</Badge>;
    default:
      return <Badge variant="outline">{status ?? "-"}</Badge>;
  }
}

export const DashboardAdmin: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth(); // ✅ ambil role dari konteks auth
  const isSuperAdmin = user?.role === "superadmin";
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useDashboardSummary();

  const stats = data?.stats ?? {
    totalBarang: 0,
    barangMasuk: 0,
    barangKeluar: 0,
    antrianBarang: 0,
  };

  const lowStockItems = data?.lowStock ?? [];
  const recentTransactions: Transaction[] = data?.recent ?? [];

  useEffect(() => {
    if (isError) {
      toast({
        title: "Gagal memuat data",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Memuat dashboard...</div>;
  }

  if (isError) {
    return (
      <div className="p-6 text-destructive">
        Gagal memuat dashboard.{" "}
        <Button variant="outline" size="sm" className="ml-2" onClick={() => refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ====================== */}
      {/* Header */}
      {/* ====================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {isSuperAdmin ? "Dashboard Superadmin" : "Dashboard Lab Admin"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isSuperAdmin
              ? "Pantau seluruh inventaris dari semua laboratorium"
              : "Kelola inventaris laboratorium yang Anda pegang"}
          </p>
        </div>
      </div>

      {/* ====================== */}
      {/* Statistik */}
      {/* ====================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Barang" value={stats.totalBarang} icon={Package} variant="default" />
        <StatsCard title="Barang Masuk" value={stats.barangMasuk} subtitle="bulan ini" icon={ArrowUpCircle} variant="success" />
        <StatsCard title="Barang Keluar" value={stats.barangKeluar} subtitle="bulan ini" icon={ArrowDownCircle} variant="primary" />
        <StatsCard title="Antrian Barang" value={stats.antrianBarang} subtitle="perlu restock" icon={Clock} variant="warning" />
      </div>

      {/* ====================== */}
      {/* Transaksi & Low Stock */}
      {/* ====================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaksi terbaru */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-primary">
              <Clock className="w-5 h-5 inline mr-2" />
              Transaksi Terbaru
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="text-primary-accent"
              onClick={() => navigate("/status-penggunaan")}
            >
              Lihat Semua →
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-sm text-muted-foreground">Belum ada transaksi.</div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((t) => {
                  const type = t.type ?? "update";
                  const Icon =
                    type === "masuk" ? ArrowUpCircle : type === "keluar" ? ArrowDownCircle : ActivitySquare;
                  const bubble =
                    type === "masuk"
                      ? "bg-success/20 text-success"
                      : type === "keluar"
                      ? "bg-primary-accent/20 text-primary-accent"
                      : "bg-muted text-foreground/70";
                  return (
                    <div
                      key={`${t.type}-${t.id}`}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${bubble}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.item ?? "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {t.quantity ?? 0} • {formatTimeSafe(t.time)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Peringatan stok */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-destructive">
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              Peringatan Stok
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="text-primary-accent"
              onClick={() => navigate("/master/barang")}
            >
              Lihat Semua →
            </Button>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">Tidak ada barang mendekati stok minimum.</div>
            ) : (
              <div className="space-y-4">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div
                    key={item.barang_id}
                    className="flex items-center justify-between p-3 border-l-4 border-l-destructive bg-destructive/5 rounded-r-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{item.nama_barang ?? "-"}</p>
                    </div>
                    <Badge variant="destructive" className="font-bold">
                      {item.stok ?? 0}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardAdmin;
