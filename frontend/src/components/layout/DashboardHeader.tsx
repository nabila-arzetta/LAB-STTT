import React, { useState } from "react"; 
import { useAuth } from "@/contexts/AuthContext"; 
import { LogOut, Loader2 } from "lucide-react"; 
import { useNavigate } from "react-router-dom"; 
 
export const DashboardHeader: React.FC = () => { 
  const { user, logout } = useAuth(); 
  const navigate = useNavigate(); 
  const [isLoggingOut, setIsLoggingOut] = useState(false);
 
  const email = (user as any)?.email ?? "-"; 
  const role = (user as any)?.role ?? "-"; 
 
  const handleLogout = async () => { 
    try {
      setIsLoggingOut(true);
      await logout(); 
      navigate("/", { replace: true }); 
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  }; 
 
  return ( 
    <header className="w-full border-b bg-white/80 backdrop-blur shadow-sm"> 
      <div className="mx-auto flex items-center justify-between px-6 py-4"> 
 
        <div className="min-w-0"> 
          <h2 className="text-xl font-bold text-primary leading-tight"> 
            Inventaris STTT 
          </h2> 
        </div> 
 
        <button 
          onClick={handleLogout} 
          disabled={isLoggingOut}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border-2 border-red-200 bg-white hover:bg-red-50 hover:border-red-300 text-red-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white shadow-sm hover:shadow"
        > 
          {isLoggingOut ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4" /> 
              <span>Keluar</span>
            </>
          )}
        </button> 
 
      </div> 
    </header> 
  ); 
};