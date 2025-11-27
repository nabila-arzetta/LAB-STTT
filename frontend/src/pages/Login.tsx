import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft, Phone, MapPin, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

type FromState = { from?: { pathname?: string } };

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Email dan password wajib diisi");

    setIsLoading(true);
    try {
    // LOGIN SUPERADMIN (email)
    if (email.includes("@")) {
      await login(email, password); // memakai AuthContext
      }
      // tambahan rafa
      // LOGIN SIMAK (username)
      else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/simak/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: email,
            password: password,
          }),
        });

        if (!res.ok) throw new Error("Login SIMAK gagal");

        const data = await res.json();

        // Simpan token manual
        localStorage.setItem("token", data.token);
      }

      toast.success("Login berhasil!");
      const redirect =
        (location.state as FromState | undefined)?.from?.pathname ?? "/dashboard";

      navigate(redirect, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Login gagal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#092044] via-[#1a4d7a] to-[#A7BDD2]"></div>

      {/* Building Image - Mobile */}
      <div 
        className="absolute left-1/2 -translate-x-1/3 w-full pointer-events-none md:hidden" 
        style={{ 
          bottom: "90px",
          height: "450px",
          maxWidth: "500px"
        }}
      >
        <img 
          src="/images/Gedung.png" 
          alt="STTT Building"
          className="absolute w-full h-full opacity-60"
          style={{ objectFit: "contain", objectPosition: "center bottom" }}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      </div>

      {/* Building Image - Tablet */}
      <div 
        className="absolute bottom-0 right-0 hidden md:block lg:hidden pointer-events-none" 
        style={{ width: "85%", height: "65%" }}
      >
        <img 
          src="/images/Gedung.png" 
          alt="STTT Building"
          className="absolute w-full h-full opacity-50"
          style={{ objectFit: "cover", objectPosition: "left bottom" }}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      </div>

      {/* Building Image - Desktop */}
      <div 
        className="absolute bottom-0 right-0 hidden lg:block pointer-events-none" 
        style={{ width: "50%", height: "100%" }}
      >
        <img 
          src="/images/Gedung.png" 
          alt="STTT Building"
          className="absolute w-full h-full opacity-70"
          style={{ objectFit: "cover", objectPosition: "left bottom" }}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      </div>

      {/* Overlay gelap - dikurangi opacity */}
      <div className="absolute inset-0 bg-[#092044]/30"></div>

      {/* Navbar */}
      <nav className="relative z-20 px-4 py-3.5 bg-[#092044] sm:px-6 lg:px-8 shadow-lg">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <img 
              src="/images/Logo.png" 
              alt="Logo STTT"
              className="object-contain w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14"
              onError={(e) => {
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<div class="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-white rounded-full flex items-center justify-center shadow-md"><span class="text-[#092044] font-bold text-xs sm:text-sm">STTT</span></div>';
                }
              }}
            />
            <h1 className="text-sm font-semibold text-white sm:text-base md:text-lg lg:text-xl">
              <span className="hidden sm:inline">Politeknik STTT Bandung</span>
              <span className="sm:hidden">STTT Bandung</span>
            </h1>
          </div>
        </div>
      </nav>

      {/* Form Login */}
      <main className="relative z-30 flex items-center justify-center flex-1 px-4 py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="w-full max-w-[95%] xs:max-w-[420px] sm:max-w-md md:max-w-lg lg:max-w-xl">
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-7 md:p-9 lg:p-10 border border-white/50">

            <div className="mb-5 sm:mb-7 md:mb-8 text-center">
              <button
                onClick={() => navigate("/")}
                className="absolute top-3 left-3 sm:top-5 sm:left-5 md:top-6 md:left-6 flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-1.5 md:py-2 text-xs sm:text-sm font-medium text-[#092044] hover:text-[#092044]/70 hover:bg-[#092044]/5 rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden xs:inline">Kembali</span>
              </button>

              <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-3 sm:mb-3.5 md:mb-4 bg-white rounded-full shadow-lg">
                <img 
                  src="/images/Logo.png" 
                  alt="Logo STTT"
                  className="object-contain w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                  onError={(e) => {
                    e.currentTarget.outerHTML =
                      '<div class="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#092044] rounded-full flex items-center justify-center"><span class="text-white font-bold text-xs sm:text-sm">STTT</span></div>';
                  }}
                />
              </div>

              <h2 
                className="text-[19px] xs:text-[21px] sm:text-[24px] md:text-[28px] lg:text-[30px] font-bold leading-tight text-[#092044] mb-1.5 sm:mb-2 tracking-tight px-2"
                style={{ textShadow: "1px 1px 4px rgba(0,0,0,0.1)" }}
              >
                Sistem Inventaris Laboratorium
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-[#092044]/70 font-medium">
                Politeknik STTT Bandung
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 md:space-y-5">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-[#092044]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@test.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 sm:h-11 md:h-12 bg-white border-2 border-[#092044]/20 focus:border-[#092044] focus:ring-0 rounded-lg text-[#092044] placeholder:text-[#092044]/40 text-sm sm:text-base transition-colors"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-[#092044]">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 sm:h-11 md:h-12 pr-10 sm:pr-11 md:pr-12 bg-white border-2 border-[#092044]/20 focus:border-[#092044] focus:ring-0 rounded-lg text-[#092044] placeholder:text-[#092044]/40 text-sm sm:text-base transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[#092044]/60 hover:text-[#092044] transition-colors p-1"
                    disabled={isLoading}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full h-10 sm:h-11 md:h-12 bg-[#092044] hover:bg-[#092044]/90 text-white font-semibold text-sm sm:text-base rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Memproses...
                  </span>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 sm:py-5 mt-auto bg-white shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 text-[#092044] text-xs sm:text-sm font-medium">
            <a 
              href="tel:+622272580" 
              className="flex items-center gap-2 transition-colors hover:text-blue-700 group"
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-center sm:text-left">Phone: +62-22-7272580</span>
            </a>

            <a 
              href="https://maps.google.com/?q=Jl.+Jakarta+No.+31,+Bandung+40272" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-center transition-colors hover:text-blue-700 group sm:text-left"
            >
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="max-w-[280px] sm:max-w-none">Jl. Jakarta No. 31, Bandung 40272</span>
            </a>

            <a 
              href="mailto:info@stttekstil.ac.id" 
              className="flex items-center gap-2 transition-colors hover:text-blue-700 group"
            >
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-center sm:text-left">Email: info@stttekstil.ac.id</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login; 