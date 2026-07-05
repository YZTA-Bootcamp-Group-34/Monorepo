"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users } from "lucide-react";
import Image from "next/image";

export default function Sidebar() {
  const pathname = usePathname();

  const isPanelActive = pathname === "/" || pathname === "";
  const isPatientListActive = pathname.startsWith("/patients");

  return (
    <aside className="w-64 bg-[#F9F9FF] border-r border-[#E7EEFF] flex flex-col justify-between p-6 h-screen sticky top-0">
      <div className="flex flex-col gap-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#003C90]">PreClinic</span>
        </div>

        {/* Doctor Info Card */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-xs border border-[#E7EEFF]">
          <div className="relative w-11 h-11 rounded-full overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"
              alt="Dr. Alper"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-[#111C2C]">Dr. Alper</span>
            <span className="text-[11px] text-slate-dark">Gastroenteroloji Uzmanı</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-2">
          <Link
            href="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isPanelActive
                ? "bg-white text-[#003C90] shadow-xs border border-[#E7EEFF]"
                : "text-slate-dark hover:bg-white/50"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span>Panel</span>
          </Link>
          <Link
            href="/patients/1" // For demonstration, default to Patient 1
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isPatientListActive
                ? "bg-white text-[#003C90] shadow-xs border border-[#E7EEFF]"
                : "text-slate-dark hover:bg-white/50"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Hasta Listesi</span>
          </Link>
        </nav>
      </div>

      {/* Footer Info */}
      <div className="text-[10px] text-slate-dark font-mono mt-auto">
        TIBBİ ID: 88291
      </div>
    </aside>
  );
}
