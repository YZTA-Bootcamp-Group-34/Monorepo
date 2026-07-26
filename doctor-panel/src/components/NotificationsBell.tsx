"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, AlertCircle, Activity, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Notification {
  id: number;
  patient_id: number;
  type: "acil" | "kritik_takip" | "sevk" | string;
  title: string;
  detail: string;
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "acil":
      return (
        <span className="p-1.5 bg-red-50 text-urgency-red rounded-lg shrink-0">
          <AlertCircle className="w-4 h-4" />
        </span>
      );
    case "kritik_takip":
      return (
        <span className="p-1.5 bg-red-600 text-white rounded-lg shrink-0 animate-pulse">
          <Activity className="w-4 h-4" />
        </span>
      );
    case "sevk":
      return (
        <span className="p-1.5 bg-emerald-50 text-emerald rounded-lg shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </span>
      );
    default:
      return (
        <span className="p-1.5 bg-[#E7EEFF]/60 text-royal-blue rounded-lg shrink-0">
          <Bell className="w-4 h-4" />
        </span>
      );
  }
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch {
      // Backend unreachable: keep whatever we have; never invent notifications.
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleToggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next) fetchNotifications();
      return next;
    });
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-slate-100 transition"
        aria-label="Bildirimler"
      >
        <Bell className="w-5 h-5 text-navy-dark" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-urgency-red border-2 border-white rounded-full"></span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#E7EEFF] rounded-xl shadow-sm z-20 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E7EEFF] flex items-center justify-between">
            <span className="text-xs font-bold text-navy-dark">Bildirimler</span>
            {notifications.length > 0 && (
              <span className="text-[10px] font-semibold text-slate-dark bg-slate-50 px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-4">
              <span className="text-xs text-slate-dark">Yeni bildirim yok</span>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={`/patients/${n.patient_id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 border-b border-[#E7EEFF]/50 last:border-b-0 hover:bg-[#F9F9FF]/60 transition"
                >
                  <NotificationIcon type={n.type} />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-semibold text-[#111C2C] truncate">{n.title}</span>
                    <span className="text-[11px] text-slate-dark leading-relaxed">{n.detail}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
