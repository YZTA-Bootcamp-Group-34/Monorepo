"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Users, CalendarDays, Settings, LogOut } from "lucide-react";
import { apiFetch, clearSession } from "@/lib/api";
import Avatar from "@/components/Avatar";

const navItems = [
  { href: "/", label: "Panel", icon: LayoutGrid },
  { href: "/patients", label: "Hasta Listesi", icon: Users },
  { href: "/appointments", label: "Randevular", icon: CalendarDays },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [doctorName, setDoctorName] = useState("Hekim");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [diplomaNo, setDiplomaNo] = useState<string | null>(null);

  useEffect(() => {
    setDoctorName(localStorage.getItem("doctor_name") || "Hekim");

    const token = localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;
    const fetchProfile = async () => {
      try {
        const res = await apiFetch("/api/auth/me");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const profile = data?.profile ?? data;
        if (cancelled) return;
        if (profile?.name) setDoctorName(profile.name);
        setAvatarUrl(profile?.avatar_url || null);
        setDiplomaNo(profile?.diploma_no || null);
      } catch {
        // Backend unreachable: keep localStorage name + fallbacks.
      }
    };
    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname === "" : pathname.startsWith(href);

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-[#F9F9FF] border-r border-[#E7EEFF] flex flex-col justify-between p-6 h-screen sticky top-0">
      <div className="flex flex-col gap-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#003C90]">PreClinic</span>
        </div>

        {/* Doctor Info Card */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-xs border border-[#E7EEFF]">
          <Avatar src={avatarUrl} name={doctorName} className="w-11 h-11 shrink-0" textClassName="text-sm" />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-[#111C2C] truncate">{doctorName}</span>
            <span className="text-[11px] text-slate-dark">Hekim Paneli</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive(href)
                  ? "bg-white text-[#003C90] shadow-xs border border-[#E7EEFF]"
                  : "text-slate-dark hover:bg-white/50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-4 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-urgency-red hover:bg-red-50 transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Çıkış Yap</span>
        </button>
        <div className="text-[10px] text-slate-dark font-mono">
          TIBBİ ID: {diplomaNo || "—"}
        </div>
      </div>
    </aside>
  );
}
