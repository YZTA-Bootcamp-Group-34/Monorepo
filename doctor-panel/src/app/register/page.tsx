"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, User, ArrowRight, Stethoscope, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Şifreler uyuşmuyor.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email,
          password,
          role: "doctor",
          name
        }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("doctor_name", data.name);
        
        // Redirect to onboarding to complete clinical credentials
        router.push("/onboarding");
      } else {
        setError(data.detail || "Kayıt işlemi başarısız.");
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
          Hekim Kayıt Formu
        </h2>
        <p className="mt-2 text-sm text-[#434653]">
          PreClinic ailesine hekim olarak katılın
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-[#E7EEFF] rounded-3xl sm:px-10 shadow-xs">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-urgency-red animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs font-bold text-[#434653] uppercase tracking-wide">
                Ad Soyad
              </label>
              <div className="mt-1 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737784]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] placeholder-[#737784] focus:outline-hidden focus:border-[#003C90] transition"
                  placeholder="Prof. Dr. Ahmet Yılmaz"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-[#434653] uppercase tracking-wide">
                Kurumsal E-posta
              </label>
              <div className="mt-1 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737784]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
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
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#434653] uppercase tracking-wide">
                Şifre Tekrar
              </label>
              <div className="mt-1 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737784]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? "Kaydolunuyor..." : "Kayıt Ol ve İlerle"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <span className="text-xs text-[#737784]">Zaten bir hesabınız var mı? </span>
            <Link href="/login" className="text-xs font-bold text-[#003C90] hover:underline">
              Giriş Yapın
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
