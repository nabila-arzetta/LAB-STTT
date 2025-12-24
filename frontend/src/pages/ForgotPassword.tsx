import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";

const ForgotPassword: React.FC = () => {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const validateUsername = (value: string): string => {
    if (!value) {
      return "Username wajib diisi";
    }
    return "";
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (error) {
      setError(validateUsername(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      toast.error(usernameError);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/forgot-password`,
        { username }
      );

      setIsSuccess(true);
      toast.success(response.data.message || "Link reset password telah dikirim ke email Anda!");

    } catch (err: any) {
      console.error("Forgot password error:", err);

      const response = err?.response;
      const status = response?.status;
      const data = response?.data;

      if (status === 422 && data?.errors) {
        const backendErrors = data.errors;
        const errorMessage = backendErrors.username?.[0] || "Validasi gagal";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      if (status === 429) {
        const message = data?.message || "Terlalu banyak permintaan. Silakan tunggu beberapa saat.";
        setError(message);
        toast.error(message, { duration: 5000 });
        return;
      }

      if (status === 500) {
        toast.error("Terjadi kesalahan pada server. Silakan coba lagi nanti.");
        return;
      }

      if (!response) {
        toast.error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
        return;
      }

      // For security, show success message even if user not found
      setIsSuccess(true);
      toast.success("Jika username terdaftar, link reset password akan dikirim ke email Anda.");

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#092044] via-[#1a4d7a] to-[#A7BDD2]"></div>

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
        />
      </div>

      <div 
        className="absolute bottom-0 right-0 hidden md:block lg:hidden pointer-events-none" 
        style={{ width: "85%", height: "65%" }}
      >
        <img 
          src="/images/Gedung.png" 
          alt="STTT Building"
          className="absolute w-full h-full opacity-50"
          style={{ objectFit: "cover", objectPosition: "left bottom" }}
        />
      </div>

      <div 
        className="absolute bottom-0 right-0 hidden lg:block pointer-events-none" 
        style={{ width: "50%", height: "100%" }}
      >
        <img 
          src="/images/Gedung.png" 
          alt="STTT Building"
          className="absolute w-full h-full opacity-70"
          style={{ objectFit: "cover", objectPosition: "left bottom" }}
        />
      </div>

      <div className="absolute inset-0 bg-[#092044]/30"></div>

      {/* Navbar */}
      <nav className="relative z-20 px-4 py-3.5 bg-[#092044] sm:px-6 lg:px-8 shadow-lg">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <img 
              src="/images/Logo.png" 
              alt="Logo STTT"
              className="object-contain w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14"
            />
            <h1 className="text-sm font-semibold text-white sm:text-base md:text-lg lg:text-xl">
              <span className="hidden sm:inline">Politeknik STTT Bandung</span>
              <span className="sm:hidden">STTT Bandung</span>
            </h1>
          </div>
        </div>
      </nav>

      {/* Form Forgot Password */}
      <main className="relative z-30 flex items-center justify-center flex-1 px-4 py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="w-full max-w-[95%] xs:max-w-[420px] sm:max-w-md md:max-w-lg lg:max-w-xl">
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-7 md:p-9 lg:p-10 border border-white/50">

            <div className="mb-5 sm:mb-7 md:mb-8 text-center">
              <button
                onClick={() => navigate("/login")}
                className="absolute top-3 left-3 sm:top-5 sm:left-5 md:top-6 md:left-6 flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-1.5 md:py-2 text-xs sm:text-sm font-medium text-[#092044] hover:text-[#092044]/70 hover:bg-[#092044]/5 rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden xs:inline">Kembali</span>
              </button>

              <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-3 sm:mb-3.5 md:mb-4 bg-white rounded-full shadow-lg">
                <Mail className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 text-[#092044]" />
              </div>

              <h2 
                className="text-[21px] xs:text-[23px] sm:text-[26px] md:text-[30px] lg:text-[32px] font-bold leading-tight text-[#092044] mb-1.5 sm:mb-2 tracking-tight px-2"
                style={{ textShadow: "1px 1px 4px rgba(0,0,0,0.1)" }}
              >
                Lupa Password?
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-[#092044]/70 font-medium px-4">
                {isSuccess 
                  ? "Periksa email Anda untuk link reset password"
                  : "Masukkan username Anda untuk reset password"
                }
              </p>
            </div>

            {isSuccess ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm sm:text-base text-[#092044] font-medium">
                      Email telah dikirim ke alamat email yang terdaftar dengan username <strong>{username}</strong>
                    </p>
                    <p className="text-xs sm:text-sm text-[#092044]/60">
                      Link reset password berlaku selama 24 jam
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#092044]/10">
                  <Button
                    onClick={() => navigate("/login")}
                    className="w-full h-10 sm:h-11 md:h-12 bg-[#092044] hover:bg-[#092044]/90 text-white font-semibold text-sm sm:text-base rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Kembali ke Login
                  </Button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setUsername("");
                    }}
                    className="text-xs sm:text-sm text-[#092044]/60 hover:text-[#092044] font-medium transition-colors"
                  >
                    Tidak menerima email? Kirim ulang
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="username" className="text-xs sm:text-sm font-semibold text-[#092044]">
                    Username
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="Masukkan username anda"
                      value={username}
                      onChange={handleUsernameChange}
                      className={`h-10 sm:h-11 md:h-12 bg-white border-2 focus:ring-0 rounded-lg text-[#092044] placeholder:text-[#092044]/40 text-sm sm:text-base transition-all duration-200 ${
                        error 
                          ? "border-red-500 focus:border-red-500 bg-red-50/30" 
                          : "border-[#092044]/20 focus:border-[#092044]"
                      }`}
                      disabled={isLoading}
                    />
                    {error && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-red-500 animate-pulse" />
                    )}
                  </div>
                  {error && (
                    <p className="text-xs sm:text-sm text-red-600 font-medium">{error}</p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-blue-900">
                    <strong>Catatan:</strong> Link reset password akan dikirim ke email yang terdaftar dengan username Anda. Untuk user SIMAK, email akan dikirim ke <strong>username@stttekstil.ac.id</strong>
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 sm:h-11 md:h-12 bg-[#092044] hover:bg-[#092044]/90 text-white font-semibold text-sm sm:text-base rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-90 disabled:cursor-wait disabled:hover:scale-100 relative overflow-hidden group"
                >
                  {isLoading ? (
                    <>
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></span>
                      <span className="relative flex items-center justify-center gap-2">
                        <span className="relative w-5 h-5 sm:w-5 sm:h-5">
                          <span className="absolute inset-0 border-2 border-white/30 rounded-full"></span>
                          <span className="absolute inset-0 border-2 border-transparent border-t-white border-r-white rounded-full animate-spin"></span>
                        </span>
                        <span>Mengirim Email...</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Kirim Link Reset Password
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-xs sm:text-sm text-[#092044]/60 hover:text-[#092044] font-medium transition-colors"
                  >
                    Ingat password Anda? <span className="underline">Login disini</span>
                  </button>
                </div>
              </form>
            )}

            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              .animate-shimmer {
                animation: shimmer 2s infinite;
              }
            `}</style>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 sm:py-5 mt-auto bg-white shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
          <div className="text-center text-[#092044] text-xs sm:text-sm font-medium">
            <p>&copy; 2024 Politeknik STTT Bandung. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ForgotPassword;