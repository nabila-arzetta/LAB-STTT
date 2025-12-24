import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({ password: "", password_confirmation: "" });
  const [tokenValid, setTokenValid] = useState(true);
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      toast.error("Link reset password tidak valid");
      setTokenValid(false);
    }
  }, [token, email]);

  const validatePassword = (value: string): string => {
    if (!value) {
      return "Password wajib diisi";
    }
    if (value.length < 5) {
      return "Password minimal 5 karakter";
    }
    return "";
  };

  const validatePasswordConfirmation = (value: string): string => {
    if (!value) {
      return "Konfirmasi password wajib diisi";
    }
    if (value !== password) {
      return "Password tidak cocok";
    }
    return "";
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
    // Re-validate confirmation if it has value
    if (passwordConfirmation) {
      setErrors(prev => ({ 
        ...prev, 
        password_confirmation: value !== passwordConfirmation ? "Password tidak cocok" : "" 
      }));
    }
  };

  const handlePasswordConfirmationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPasswordConfirmation(value);
    if (errors.password_confirmation) {
      setErrors(prev => ({ ...prev, password_confirmation: validatePasswordConfirmation(value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !email) {
      toast.error("Link reset password tidak valid");
      return;
    }

    const passwordError = validatePassword(password);
    const confirmationError = validatePasswordConfirmation(passwordConfirmation);

    if (passwordError || confirmationError) {
      setErrors({ 
        password: passwordError, 
        password_confirmation: confirmationError 
      });
      
      if (passwordError) {
        toast.error(passwordError);
      } else if (confirmationError) {
        toast.error(confirmationError);
      }
      return;
    }

    setErrors({ password: "", password_confirmation: "" });
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/reset-password`,
        {
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }
      );

      setIsSuccess(true);
      toast.success(response.data.message || "Password berhasil diubah!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);

    } catch (err: any) {
      console.error("Reset password error:", err);

      const response = err?.response;
      const status = response?.status;
      const data = response?.data;

      if (status === 422 && data?.errors) {
        const backendErrors = data.errors;
        setErrors({
          password: backendErrors.password?.[0] || "",
          password_confirmation: backendErrors.password_confirmation?.[0] || "",
        });
        toast.error(data.message || "Validasi gagal. Periksa input Anda.");
        return;
      }

      if (status === 400) {
        toast.error(data?.message || "Token reset password tidak valid atau sudah kadaluarsa.", {
          duration: 5000,
        });
        setTokenValid(false);
        return;
      }

      if (status === 404) {
        toast.error("User tidak ditemukan.");
        return;
      }

      if (status === 429) {
        toast.error(data?.message || "Terlalu banyak percobaan. Silakan tunggu beberapa saat.", {
          duration: 5000,
        });
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

      toast.error(data?.message || "Reset password gagal. Silakan coba lagi.");

    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="relative flex flex-col min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#092044] via-[#1a4d7a] to-[#A7BDD2]"></div>
        <div className="absolute inset-0 bg-[#092044]/30"></div>

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

        <main className="relative z-30 flex items-center justify-center flex-1 px-4 py-6">
          <div className="w-full max-w-md">
            <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/50 text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#092044] mb-2">Link Tidak Valid</h2>
              <p className="text-[#092044]/70 mb-6">
                Link reset password tidak valid atau sudah kadaluarsa. Silakan request ulang.
              </p>
              <Button
                onClick={() => navigate("/forgot-password")}
                className="w-full bg-[#092044] hover:bg-[#092044]/90 text-white font-semibold"
              >
                Request Reset Password Baru
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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

      {/* Form Reset Password */}
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
                {isSuccess ? (
                  <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 text-green-600" />
                ) : (
                  <Lock className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 text-[#092044]" />
                )}
              </div>

              <h2 
                className="text-[21px] xs:text-[23px] sm:text-[26px] md:text-[30px] lg:text-[32px] font-bold leading-tight text-[#092044] mb-1.5 sm:mb-2 tracking-tight px-2"
                style={{ textShadow: "1px 1px 4px rgba(0,0,0,0.1)" }}
              >
                {isSuccess ? "Password Berhasil Diubah!" : "Reset Password"}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-[#092044]/70 font-medium px-4">
                {isSuccess 
                  ? "Silakan login dengan password baru Anda"
                  : "Masukkan password baru Anda"
                }
              </p>
            </div>

            {isSuccess ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="text-center space-y-2">
                    <p className="text-sm sm:text-base text-[#092044] font-medium">
                      Password Anda telah berhasil diubah!
                    </p>
                    <p className="text-xs sm:text-sm text-[#092044]/60">
                      Anda akan dialihkan ke halaman login dalam 3 detik...
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/login")}
                  className="w-full h-10 sm:h-11 md:h-12 bg-[#092044] hover:bg-[#092044]/90 text-white font-semibold text-sm sm:text-base rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Login Sekarang
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Email Display */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-blue-900">
                    Reset password untuk: <strong>{email}</strong>
                  </p>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-[#092044]">
                    Password Baru
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password baru (min. 5 karakter)"
                      value={password}
                      onChange={handlePasswordChange}
                      className={`h-10 sm:h-11 md:h-12 pr-10 sm:pr-11 md:pr-12 bg-white border-2 focus:ring-0 rounded-lg text-[#092044] placeholder:text-[#092044]/40 text-sm sm:text-base transition-all duration-200 ${
                        errors.password 
                          ? "border-red-500 focus:border-red-500 bg-red-50/30" 
                          : "border-[#092044]/20 focus:border-[#092044]"
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[#092044]/60 hover:text-[#092044] transition-colors p-1"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs sm:text-sm text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Password Confirmation Field */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="password_confirmation" className="text-xs sm:text-sm font-semibold text-[#092044]">
                    Konfirmasi Password Baru
                  </Label>
                  <div className="relative">
                    <Input
                      id="password_confirmation"
                      type={showPasswordConfirmation ? "text" : "password"}
                      placeholder="Ulangi password baru"
                      value={passwordConfirmation}
                      onChange={handlePasswordConfirmationChange}
                      className={`h-10 sm:h-11 md:h-12 pr-10 sm:pr-11 md:pr-12 bg-white border-2 focus:ring-0 rounded-lg text-[#092044] placeholder:text-[#092044]/40 text-sm sm:text-base transition-all duration-200 ${
                        errors.password_confirmation 
                          ? "border-red-500 focus:border-red-500 bg-red-50/30" 
                          : "border-[#092044]/20 focus:border-[#092044]"
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[#092044]/60 hover:text-[#092044] transition-colors p-1"
                      disabled={isLoading}
                    >
                      {showPasswordConfirmation ? (
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <p className="text-xs sm:text-sm text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {errors.password_confirmation}
                    </p>
                  )}
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
                        <span>Memproses...</span>
                      </span>
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
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

export default ResetPassword;