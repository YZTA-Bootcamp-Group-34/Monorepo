"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Search, Users as UsersIcon, Plus } from "lucide-react";
import Image from "next/image";
import { apiFetch } from "@/lib/api";

interface Patient {
  id: number;
  tc_no: string;
  name: string;
  age: number;
  gender: string;
  status: string;
  criticality: number;
  son_randevu: string;
  followup_status?: string;
}

const AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
];

export default function PatientListPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.push("/login");
      return;
    }

    const fetchPatients = async () => {
      try {
        const res = await apiFetch("/api/patients");
        if (res.ok) {
          setPatients(await res.json());
        } else {
          toast.error("Hasta listesi yüklenemedi.");
        }
      } catch {
        toast.error("Sunucuya bağlanılamadı.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACİL":
        return "bg-red-50 text-urgency-red border border-red-200";
      case "KRİTİK TAKİP":
        return "bg-red-600 text-white font-bold animate-pulse border border-red-700";
      case "SEVK EDİLDİ":
        return "bg-emerald-50 text-emerald border border-emerald-100";
      case "RUTİN KONTROL":
        return "bg-blue-50 text-royal-blue border border-blue-100";
      default:
        return "bg-slate-50 text-slate-dark border border-slate-200";
    }
  };

  const getCriticalityBarColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACİL":
      case "KRİTİK TAKİP":
        return "bg-urgency-red";
      case "SEVK EDİLDİ":
        return "bg-emerald";
      case "RUTİN KONTROL":
        return "bg-royal-blue";
      default:
        return "bg-slate-dark";
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tc_no.includes(searchQuery)
  );

  return (
    <div className="p-8 flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Hasta Listesi</h1>
          <span className="text-xs text-slate-dark block mt-0.5 font-medium">
            Kayıtlı tüm hastalarınızı görüntüleyin ve arayın
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-dark absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Hasta adı veya TC ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-72 bg-[#E7EEFF]/30 border border-[#E7EEFF] rounded-lg text-sm text-navy-dark focus:outline-none focus:border-royal-blue focus:ring-1 focus:ring-royal-blue transition"
            />
          </div>
          <Link
            href="/patients/new"
            className="bg-royal-blue text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm hover:bg-opacity-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Hasta</span>
          </Link>
        </div>
      </header>

      {/* Patient Table */}
      <section className="bg-white rounded-2xl border border-[#E7EEFF] overflow-hidden shadow-xs">
        <div className="p-6 border-b border-[#E7EEFF] flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-royal-blue" />
          <h2 className="font-bold text-[#111C2C] text-base">Tüm Hastalar</h2>
          {!loading && (
            <span className="text-xs font-semibold text-slate-dark bg-slate-50 px-2 py-0.5 rounded-full ml-1">
              {filteredPatients.length}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E7EEFF] text-xs font-semibold text-slate-dark">
                <th className="p-4 pl-6">Hasta Adı</th>
                <th className="p-4">TC Kimlik No</th>
                <th className="p-4">Son Randevu</th>
                <th className="p-4">Durum</th>
                <th className="p-4 pr-6 w-48">Kritiklik</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((idx) => (
                  <tr key={idx} className="border-b border-[#E7EEFF]/30 animate-pulse">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100" />
                        <div className="flex flex-col gap-1.5">
                          <div className="w-24 h-4 bg-slate-100 rounded-md" />
                          <div className="w-16 h-3 bg-slate-100 rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><div className="w-24 h-4 bg-slate-100 rounded-md" /></td>
                    <td className="p-4"><div className="w-24 h-4 bg-slate-100 rounded-md" /></td>
                    <td className="p-4"><div className="w-16 h-5 bg-slate-100 rounded-full" /></td>
                    <td className="p-4 pr-6"><div className="w-28 h-2 bg-slate-100 rounded-full" /></td>
                  </tr>
                ))
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => router.push(`/patients/${patient.id}`)}
                    className="border-b border-[#E7EEFF]/50 hover:bg-[#F9F9FF]/30 transition group cursor-pointer"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#E7EEFF]">
                          <Image
                            src={AVATARS[patient.id % AVATARS.length]}
                            alt={patient.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-sm text-[#111C2C] group-hover:text-royal-blue transition">
                            {patient.name}
                          </span>
                          {patient.followup_status && patient.followup_status.startsWith("ALARM") && (
                            <span className="text-[9px] bg-red-100 text-urgency-red border border-red-200 font-bold px-1.5 py-0.5 rounded-md w-fit animate-pulse">
                              🚨 {patient.followup_status}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-dark">
                            {patient.gender}, {patient.age} Yaş
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-dark">{patient.tc_no}</td>
                    <td className="p-4 text-xs text-[#111C2C]">{patient.son_randevu}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getCriticalityBarColor(patient.status)}`}
                            style={{ width: `${patient.criticality * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-dark w-6 text-right">
                          {Math.round(patient.criticality * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-slate-dark">
                    Aramanızla eşleşen hasta bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
