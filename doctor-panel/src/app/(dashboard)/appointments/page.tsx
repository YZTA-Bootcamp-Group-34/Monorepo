"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CalendarDays } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Appointment {
  id: number;
  date_str: string;
  title: string;
  detail: string;
  rec_code: string;
  doctor_name: string;
  status: string;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.push("/login");
      return;
    }

    const fetchAppointments = async () => {
      try {
        const res = await apiFetch("/api/appointments/history");
        if (res.ok) {
          setAppointments(await res.json());
        } else {
          toast.error("Randevu geçmişi yüklenemedi.");
        }
      } catch {
        toast.error("Sunucuya bağlanılamadı.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [router]);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "tamamlandı":
        return { dot: "bg-emerald", text: "text-emerald" };
      case "iptal":
      case "iptal edildi":
        return { dot: "bg-urgency-red", text: "text-urgency-red" };
      default:
        return { dot: "bg-royal-blue", text: "text-royal-blue" };
    }
  };

  return (
    <div className="p-8 flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-navy-dark">Randevular</h1>
        <span className="text-xs text-slate-dark block mt-0.5 font-medium">
          Geçmiş randevu ve muayene kayıtlarınız
        </span>
      </header>

      {/* Appointment List */}
      <section className="bg-white rounded-2xl border border-[#E7EEFF] p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-6">
          <CalendarDays className="w-5 h-5 text-royal-blue" />
          <h2 className="font-bold text-[#111C2C] text-base">Randevu Geçmişi</h2>
          {!loading && (
            <span className="text-xs font-semibold text-slate-dark bg-slate-50 px-2 py-0.5 rounded-full ml-1">
              {appointments.length}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {loading ? (
            [1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-[#F9F9FF]/40 border border-[#E7EEFF] rounded-xl animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-14 bg-slate-100 rounded-xl" />
                  <div className="flex flex-col gap-2">
                    <div className="w-40 h-4 bg-slate-100 rounded-md" />
                    <div className="w-28 h-3 bg-slate-100 rounded-md" />
                    <div className="w-24 h-3 bg-slate-100 rounded-md" />
                  </div>
                </div>
                <div className="w-20 h-4 bg-slate-100 rounded-md" />
              </div>
            ))
          ) : (
            appointments.map((appt) => {
              const style = getStatusStyle(appt.status);
              return (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-4 bg-[#F9F9FF]/40 border border-[#E7EEFF] rounded-xl hover:border-slate-300 transition"
                >
                  <div className="flex items-center gap-4">
                    {/* Calendar Widget */}
                    <div className="flex flex-col items-center justify-center bg-[#E7EEFF]/60 text-royal-blue font-bold px-3 py-2 rounded-xl text-center min-w-16">
                      <span className="text-[10px] uppercase tracking-wider">{appt.date_str.split(" ")[0]}</span>
                      <span className="text-base">{appt.date_str.split(" ")[1]}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-[#111C2C]">{appt.title}</span>
                      <span className="text-[11px] text-slate-dark">{appt.detail}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono bg-slate-100 text-slate-dark px-1.5 py-0.5 rounded">
                          {appt.rec_code}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-dark px-1.5 py-0.5 rounded bg-slate-100">
                          {appt.doctor_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 ${style.dot} rounded-full`}></span>
                    <span className={`text-xs font-semibold ${style.text}`}>{appt.status}</span>
                  </div>
                </div>
              );
            })
          )}
          {!loading && appointments.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-dark">
              Henüz randevu kaydı bulunmuyor.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
