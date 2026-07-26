"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, UserPlus, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";

const GENDERS = ["Kadın", "Erkek"];
const BLOOD_TYPES = [
  "",
  "A Rh(+)",
  "A Rh(-)",
  "B Rh(+)",
  "B Rh(-)",
  "AB Rh(+)",
  "AB Rh(-)",
  "0 Rh(+)",
  "0 Rh(-)",
];
const STATUSES = ["RUTİN KONTROL", "TAKİP", "ACİL", "KRİTİK TAKİP"];

export default function NewPatientPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tcNo, setTcNo] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState(GENDERS[0]);
  const [bloodType, setBloodType] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [status, setStatus] = useState("RUTİN KONTROL");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Ad Soyad boş bırakılamaz.");
      return;
    }
    if (!/^\d{11}$/.test(tcNo)) {
      toast.error("TC Kimlik No 11 haneli rakamlardan oluşmalıdır.");
      return;
    }
    const ageNum = Number(age);
    if (!age || !Number.isInteger(ageNum) || ageNum < 0 || ageNum > 130) {
      toast.error("Geçerli bir yaş giriniz.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          tc_no: tcNo,
          age: ageNum,
          gender,
          blood_type: bloodType || undefined,
          chronic_conditions: chronicConditions.trim() || undefined,
          status,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        toast.success("Hasta kaydı başarıyla oluşturuldu.");
        router.push(data?.id ? `/patients/${data.id}` : "/patients");
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.detail || "Hasta kaydı oluşturulamadı.");
      }
    } catch {
      toast.error("Sunucuya ulaşılamadı, kayıt oluşturulamadı.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-8 w-full max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link
          href="/patients"
          className="p-2 bg-white rounded-lg border border-[#E7EEFF] hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4 text-navy-dark" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Yeni Hasta Kaydı</h1>
          <span className="text-xs text-slate-dark block mt-0.5 font-medium">
            Yeni hasta bilgilerini girerek sisteme kaydedin
          </span>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#E7EEFF] p-6 shadow-xs flex flex-col gap-6"
      >
        <div className="flex items-center gap-2 pb-4 border-b border-[#E7EEFF]">
          <div className="p-1.5 bg-[#E7EEFF]/50 text-royal-blue rounded-lg">
            <UserPlus className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-[#111C2C] text-base">Hasta Bilgileri</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Ad Soyad */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wide">
              Ad Soyad
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Ayşe Yılmaz"
              className="w-full px-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] placeholder-[#737784] focus:outline-hidden focus:border-[#003C90] transition"
            />
          </div>

          {/* TC Kimlik No */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wide">
              TC Kimlik No
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={tcNo}
              onChange={(e) => setTcNo(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="11 haneli TC kimlik numarası"
              className="w-full px-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] placeholder-[#737784] font-mono focus:outline-hidden focus:border-[#003C90] transition"
            />
          </div>

          {/* Yaş */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wide">
              Yaş
            </label>
            <input
              type="number"
              min={0}
              max={130}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Örn: 45"
              className="w-full px-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] placeholder-[#737784] focus:outline-hidden focus:border-[#003C90] transition"
            />
          </div>

          {/* Cinsiyet */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wide">
              Cinsiyet
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] focus:outline-hidden focus:border-[#003C90] transition"
            >
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Kan Grubu */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wide">
              Kan Grubu <span className="font-normal normal-case text-[#737784]">(opsiyonel)</span>
            </label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="w-full px-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] focus:outline-hidden focus:border-[#003C90] transition"
            >
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt === "" ? "Belirtilmedi" : bt}</option>
              ))}
            </select>
          </div>

          {/* Durum */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wide">
              Durum
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] focus:outline-hidden focus:border-[#003C90] transition"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Kronik Hastalıklar */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-dark uppercase tracking-wide">
            Kronik Hastalıklar <span className="font-normal normal-case text-[#737784]">(opsiyonel)</span>
          </label>
          <textarea
            value={chronicConditions}
            onChange={(e) => setChronicConditions(e.target.value)}
            placeholder="Örn: Tip 2 Diyabet, Hipertansiyon..."
            rows={3}
            className="w-full px-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] placeholder-[#737784] focus:outline-hidden focus:border-[#003C90] transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center items-center gap-2 py-3.5 bg-[#003C90] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-opacity-95 active:scale-[0.99] transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? "Kaydediliyor..." : "Hastayı Kaydet"}</span>
        </button>
      </form>
    </div>
  );
}
