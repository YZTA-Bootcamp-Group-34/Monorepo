"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, Stethoscope, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect if already logged in
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      router.push("/");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("doctor_name", data.name);
        
        // Redirect to dashboard
        router.push("/");
      } else {
        setError(data.detail || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
      }
    } catch (err) {
      setError("Sunucuya bağlanılamadı. Lütfen API'nin çalıştığından emin olun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FF] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-[#E7EEFF] text-[#003C90] rounded-2xl mb-4">
          <Stethoscope className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-[#111C2C] tracking-tight">
          PreClinic Hekim Paneli
        </h2>
        <p className="mt-2 text-sm text-[#434653]">
          CarePulse sistemine hekim girişi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-[#E7EEFF] rounded-3xl sm:px-10 shadow-xs">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-urgency-red animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-[#434653] uppercase tracking-wide">
                E-posta Adresi
              </label>
              <div className="mt-1 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737784]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] placeholder-[#737784] focus:outline-hidden focus:border-[#003C90] transition"
                  placeholder="hekim@hastane.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-[#434653] uppercase tracking-wide">
                Şifre
              </label>
              <div className="mt-1 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737784]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] placeholder-[#737784] focus:outline-hidden focus:border-[#003C90] transition"
                  placeholder="••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-xs text-xs font-bold text-white bg-[#003C90] hover:bg-opacity-95 active:scale-[0.99] transition"
              >
                {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <span className="text-xs text-[#737784]">Hesabınız yok mu? </span>
            <Link href="/register" className="text-xs font-bold text-[#003C90] hover:underline">
              Hemen Kayıt Olun
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
