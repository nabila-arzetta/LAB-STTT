import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DashboardHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const email = (user as any)?.email ?? "-";
  const role = (user as any)?.role ?? "-";

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex items-center justify-between px-6 py-3">

        {/* Kiri: Judul Sistem */}
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-primary leading-tight">
            Inventaris STTT
          </h2>
        </div>

        {/* Kanan: Logout */}
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border hover:bg-muted text-muted-foreground transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>

      </div>
    </header>
  );
};
