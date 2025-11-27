import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Package,
  ActivitySquare,
  Users,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Box,
  Boxes,
  Clock,
  BarChart3,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDashboardSummary } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";

export const DashboardAdmin = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "superadmin";
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  const stats = data?.stats ?? {
    totalBarang: 0,
    totalUser: 0,
    totalLab: 0,
    antrianBarang: 0,
  };

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
    return (
      <div className="flex justify-center items-center pt-24">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground text-base">
            Memuat data dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <p className="text-destructive font-medium text-base">
          Gagal memuat dashboard
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

const menuItems = [
  { label: "Data Lab", desc: "Melihat data lab dan pengaturannya", icon: ActivitySquare },

  { label: "Master Barang", desc: "Melihat dan memperbarui daftar barang", icon: Package },

  { label: "Penerimaan Logistik", desc: "Mencatat barang masuk", icon: TrendingUp },

  { label: "Penggunaan Barang", desc: "Mencatat aktivitas pemakaian", icon: ActivitySquare },

  { label: "Transfer Barang", desc: "Memindahkan barang antar lab", icon: ArrowUpRight },

  { label: "Inventaris Barang", desc: "Memantau stok dan detail barang", icon: Boxes },

  { label: "Stok Opname", desc: "Melakukan pengecekan stok berkala", icon: BarChart3 },
];


  const superAdminStats = [
    { 
      title: "Total Barang", 
      value: stats.totalBarang, 
      icon: Package,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
      border: "border-blue-200",
      textColor: "text-blue-600"
    },
    { 
      title: "Total User", 
      value: stats.totalUser, 
      icon: Users,
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
      border: "border-emerald-200",
      textColor: "text-emerald-600"
    },
    { 
      title: "Total Lab", 
      value: stats.totalLab, 
      icon: ActivitySquare,
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-50 to-purple-50",
      border: "border-violet-200",
      textColor: "text-violet-600"
    },
  ];

  return (
    <div className="space-y-6 pb-10">

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="relative z-10">
          {isSuperAdmin ? (
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Selamat Datang, Superadmin
                </h1>
                <p className="text-gray-600 text-base">
                  Pantau seluruh inventaris & pengguna
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Selamat Datang Admin Lab {data?.labName ?? ""}
                  </h1>
                  <p className="text-base text-gray-600">
                    Kelola inventaris lab Anda di sini!
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Panduan Fitur
                </h3>

                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  {menuItems.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border"
                      >
                        <div className="p-2 bg-blue-50 rounded">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.label}
                          </p>
                          <p className="text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded border">
                  💡 Hubungi superadmin jika ada kendala.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {superAdminStats.map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={idx}
                className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-6 border ${stat.border} shadow-sm`}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-base font-bold text-gray-900">
                    {stat.title}
                  </p>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-5xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {stat.title === "Total Barang" ? "Jenis barang" : stat.title === "Total User" ? "Pengguna aktif" : "Lab terdaftar"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isSuperAdmin && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Ringkasan Inventaris
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* TOTAL BARANG */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Total Barang
                    </h3>
                    <p className="text-sm text-indigo-600">
                      Jumlah jenis barang
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {stats.totalBarang}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Jenis barang terdaftar
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-blue-200 shadow-sm">
                  <Box className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">
                    Master Barang
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-blue-200">
                <p className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">ℹ️</span>
                  <span>Daftar barang yang dapat dikelola di lab Anda</span>
                </p>
              </div>
            </div>

            {/* TRANSFER MASUK */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Transfer Masuk
                    </h3>
                    <p className="text-sm text-amber-600">
                      Menunggu persetujuan
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {stats.antrianBarang ?? 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Barang menunggu
                  </p>
                </div>
                {(stats.antrianBarang ?? 0) > 0 ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-amber-200 shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">
                      Perlu Tindakan
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-green-200 shadow-sm">
                    <span className="text-xs font-semibold text-green-700">
                      ✓ Semua Clear
                    </span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-amber-200">
                <p className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">⚠️</span>
                  <span>Barang dari lab lain yang menunggu diterima</span>
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;