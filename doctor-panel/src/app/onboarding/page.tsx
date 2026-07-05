"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, Award, ClipboardList, CheckCircle2, AlertCircle } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [diplomaNo, setDiplomaNo] = useState("");
  const [branch, setBranch] = useState("Kardiyoloji Polikliniği");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Check if token exists
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.push("/login");
    }
  }, [router]);

  const branches = [
    "Kardiyoloji Polikliniği",
    "Nöroloji Polikliniği",
    "Dermatoloji Polikliniği",
    "Göz Hastalıkları Polikliniği",
    "Dahiliye Polikliniği",
    "Onkoloji Polikliniği"
  ];

  const handleOnboardingSubmit = async () => {
    if (!diplomaNo) {
      setError("Lütfen Diploma / Lisans numaranızı girin.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("http://localhost:8000/api/auth/onboarding?token=" + token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diploma_no: diplomaNo,
          branch: branch,
          bio: bio
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStep(3); // Success step
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setError(data.detail || "Onboarding kaydedilemedi.");
      }
    } catch (err) {
      setError("Sunucu bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FF] flex items-center justify-center p-4">
      <div className="bg-white border border-[#E7EEFF] rounded-3xl w-full max-w-lg p-8 shadow-xs relative overflow-hidden">
        {/* Decorative graphic background */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-40 h-40 bg-[#E7EEFF]/30 rounded-full pointer-events-none" />

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-[#003C90] text-white' : 'bg-slate-100 text-slate-dark'}`}>1</span>
          <div className="flex-1 h-0.5 bg-[#E7EEFF]" />
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-[#003C90] text-white' : 'bg-slate-100 text-slate-dark'}`}>2</span>
          <div className="flex-1 h-0.5 bg-[#E7EEFF]" />
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-[#006C4D] text-white' : 'bg-slate-100 text-slate-dark'}`}>✓</span>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-navy-dark flex items-center gap-2">
                <Award className="w-5 h-5 text-[#003C90]" />
                Klinik Lisans Bilgileri
              </h2>
              <p className="text-xs text-slate-dark leading-relaxed">
                Tıbbi yetkilendirme ve sevk onay süreçlerinde geçerli olmak üzere diploma ve tescil numaranızı doğrulayın.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-urgency-red">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-dark uppercase tracking-wide">
                Diploma / Uzmanlık Tescil No
              </label>
              <input
                type="text"
                required
                value={diplomaNo}
                onChange={(e) => setDiplomaNo(e.target.value)}
                placeholder="Örn: T-9821-K"
                className="w-full px-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] placeholder-[#737784] focus:outline-hidden focus:border-[#003C90] transition"
              />
            </div>

            <button
              onClick={() => {
                if (!diplomaNo) {
                  setError("Lütfen Diploma numaranızı girin.");
                } else {
                  setError("");
                  setStep(2);
                }
              }}
              className="w-full py-3.5 bg-[#003C90] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-opacity-95 active:scale-[0.99] transition mt-2"
            >
              Devam Et
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-navy-dark flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#003C90]" />
                Branş ve Klinik Seçimi
              </h2>
              <p className="text-xs text-slate-dark leading-relaxed">
                Hizmet verdiğiniz polikliniği belirleyerek size sevk edilecek hasta havuzunu yapılandırın.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-urgency-red">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-dark uppercase tracking-wide">
                Görevli Poliklinik Branşı
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] focus:outline-hidden focus:border-[#003C90] transition"
              >
                {branches.map((b, idx) => (
                  <option key={idx} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-dark uppercase tracking-wide">
                Hekim Biyografisi (Kısa Özgeçmiş)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Hastalarınıza ve asistan panelinize kendinizi kısaca tanıtın..."
                rows={3}
                className="w-full px-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] placeholder-[#737784] focus:outline-hidden focus:border-[#003C90] transition resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 border border-[#E7EEFF] text-slate-dark rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                Geri Dön
              </button>
              <button
                onClick={handleOnboardingSubmit}
                disabled={loading}
                className="flex-1 py-3.5 bg-[#003C90] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-opacity-95 active:scale-[0.99] transition disabled:opacity-50"
              >
                {loading ? "Kaydediliyor..." : "Kurulumu Tamamla"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-4 animate-bounce">
            <CheckCircle2 className="w-16 h-16 text-[#006C4D]" />
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-navy-dark">Kurulum Başarılı!</h2>
              <p className="text-xs text-slate-dark leading-relaxed">
                Hekim profiliniz oluşturuldu. Dashboard paneline yönlendiriliyorsunuz...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
