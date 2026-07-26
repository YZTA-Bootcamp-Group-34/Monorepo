"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, Award, ClipboardList, Save, LogOut } from "lucide-react";
import Image from "next/image";
import { apiFetch, clearSession } from "@/lib/api";

interface DoctorProfile {
  id: number;
  username: string;
  role: string;
  profile: {
    name: string;
    diploma_no: string;
    branch: string;
    bio: string;
    avatar_url: string;
  };
}

const BRANCHES = [
  "Kardiyoloji Polikliniği",
  "Nöroloji Polikliniği",
  "Dermatoloji Polikliniği",
  "Göz Hastalıkları Polikliniği",
  "Dahiliye Polikliniği",
  "Onkoloji Polikliniği",
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [diplomaNo, setDiplomaNo] = useState("");
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await apiFetch(`/api/auth/me?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const data: DoctorProfile = await res.json();
          setName(data.profile?.name || localStorage.getItem("doctor_name") || "");
          setUsername(data.username || "");
          setDiplomaNo(data.profile?.diploma_no || "");
          if (data.profile?.branch) setBranch(data.profile.branch);
          setBio(data.profile?.bio || "");
          setAvatarUrl(data.profile?.avatar_url || "");
        } else {
          toast.error("Profil bilgileri yüklenemedi.");
        }
      } catch {
        toast.error("Sunucuya bağlanılamadı.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSave = async () => {
    if (!diplomaNo) {
      toast.error("Diploma / Tescil numarası boş bırakılamaz.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await apiFetch(`/api/auth/onboarding?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diploma_no: diplomaNo, branch, bio }),
      });
      if (res.ok) {
        toast.success("Profil bilgileriniz güncellendi.");
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.detail || "Profil güncellenemedi.");
      }
    } catch {
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <div className="p-8 flex flex-col gap-8 w-full max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Ayarlar</h1>
          <span className="text-xs text-slate-dark block mt-0.5 font-medium">
            Hekim profilinizi görüntüleyin ve düzenleyin
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-urgency-red border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 active:scale-[0.99] transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Çıkış Yap</span>
        </button>
      </header>

      {loading ? (
        /* Skeleton */
        <section className="bg-white rounded-2xl border border-[#E7EEFF] p-6 shadow-xs animate-pulse flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100" />
            <div className="flex flex-col gap-2">
              <div className="w-40 h-5 bg-slate-100 rounded-md" />
              <div className="w-28 h-3 bg-slate-100 rounded-md" />
            </div>
          </div>
          <div className="w-full h-12 bg-slate-100 rounded-xl" />
          <div className="w-full h-12 bg-slate-100 rounded-xl" />
          <div className="w-full h-24 bg-slate-100 rounded-xl" />
        </section>
      ) : (
        <section className="bg-white rounded-2xl border border-[#E7EEFF] p-6 shadow-xs flex flex-col gap-6">
          {/* Profile header */}
          <div className="flex items-center gap-4 pb-6 border-b border-[#E7EEFF]">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[#E7EEFF]">
              <Image
                src={avatarUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"}
                alt={name || "Hekim"}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-[#111C2C]">{name || "Hekim"}</h2>
              <span className="text-xs text-slate-dark">{username}</span>
            </div>
          </div>

          {/* Ad Soyad (readonly) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wide flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Ad Soyad
            </label>
            <input
              type="text"
              value={name}
              readOnly
              className="w-full px-4 py-3 bg-slate-50 border border-[#E7EEFF] rounded-xl text-sm text-slate-dark cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-dark">
              İsim bilgisi kurumsal kayıtlardan gelir, değiştirilemez.
            </span>
          </div>

          {/* Diploma No */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wide flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Diploma / Uzmanlık Tescil No
            </label>
            <input
              type="text"
              value={diplomaNo}
              onChange={(e) => setDiplomaNo(e.target.value)}
              placeholder="Örn: T-9821-K"
              className="w-full px-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] placeholder-[#737784] focus:outline-hidden focus:border-[#003C90] transition"
            />
          </div>

          {/* Branş */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wide flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" /> Görevli Poliklinik Branşı
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] focus:outline-hidden focus:border-[#003C90] transition"
            >
              {!BRANCHES.includes(branch) && <option value={branch}>{branch}</option>}
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-dark uppercase tracking-wide">
              Hekim Biyografisi (Kısa Özgeçmiş)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Hastalarınıza ve asistan panelinize kendinizi kısaca tanıtın..."
              rows={4}
              className="w-full px-4 py-3 bg-[#F9F9FF] border border-[#E7EEFF] rounded-xl text-sm text-[#111C2C] placeholder-[#737784] focus:outline-hidden focus:border-[#003C90] transition resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex justify-center items-center gap-2 py-3.5 bg-[#003C90] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-opacity-95 active:scale-[0.99] transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
          </button>
        </section>
      )}
    </div>
  );
}
