import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
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
      await login(email, password);

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
    <div
      className="
        min-h-screen w-full flex items-center justify-center 
        bg-gradient-to-br from-primary/90 via-primary-light/80 to-primary-dark/90 
        relative overflow-hidden px-4
      "
    >
      {/* Background Glowing Effects */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/40 blur-3xl rounded-full" />

      <button
        onClick={() => navigate(-1)}
        className="
          absolute top-6 left-6 
          text-white/90 hover:text-white 
          bg-white/10 hover:bg-white/20
          px-3 py-2 rounded-xl 
          backdrop-blur-md border border-white/30
          transition
        "
      >
        ← Kembali
      </button>

      <Card
        className="
          w-full sm:w-[420px] bg-white/20 backdrop-blur-2xl 
          shadow-2xl border border-white/30 rounded-2xl 
          animate-fadeIn relative
        "
      >
        <CardContent className="p-8 space-y-8">
          {/* LOGO + TITLE */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto rounded-full bg-white shadow-md flex items-center justify-center">
              <img src="/images/Logo.png" className="w-14 h-14" />
            </div>

            <h1 className="text-2xl font-extrabold text-white drop-shadow">
              Sistem Inventaris Laboratorium
            </h1>

            <p className="text-white/80 text-sm">Politeknik STTT Bandung</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* EMAIL */}
            <div className="space-y-2">
              <Label className="text-white/90">Email</Label>

              <div className="relative">
                <Input
                  type="email"
                  placeholder="admin@test.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    bg-white/60 border-white/40 text-black
                    placeholder:text-black/50
                    focus:ring-2 focus:ring-white focus:border-transparent
                    pl-11 h-12 rounded-xl
                  "
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60 text-lg">
                  📧
                </span>
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label className="text-white/90">Password</Label>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    bg-white/40 border-white/40 text-black 
                    placeholder:text-black/50
                    focus:ring-2 focus:ring-white focus:border-transparent
                    pr-12 h-12 rounded-xl
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2 
                    text-black/70 hover:text-black 
                    transition duration-150
                  "
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* LOGIN BUTTON */}
            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="
                w-full 
                bg-white/60 backdrop-blur-xl
                text-primary font-semibold 
                hover:bg-white 
                transition-all duration-300 
                shadow-lg hover:shadow-2xl
                py-5 text-base rounded-xl
                border border-white/40
              "
            >
              {isLoading ? "Memproses..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
