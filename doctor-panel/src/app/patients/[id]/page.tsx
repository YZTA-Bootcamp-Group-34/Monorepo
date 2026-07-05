"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  ArrowLeft, 
  CheckCircle2, 
  Activity, 
  Stethoscope, 
  Send, 
  Sparkles,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import Image from "next/image";

interface MedicalHistoryItem {
  category: string;
  title: string;
  details: string;
  color_tag: string;
}

interface SymptomFinding {
  finding: string;
  checked: boolean;
}

interface Probability {
  condition: string;
  probability: number;
}

interface Action {
  recommended_dept: string;
  required_tests: string;
}

interface PatientDetails {
  id: number;
  tc_no: string;
  name: string;
  age: number;
  gender: string;
  blood_type: string;
  weight: number;
  height: number;
  chronic_conditions: string;
  avatar_url: string;
  status: string;
  criticality: number;
  son_randevu: string;
  medical_history: MedicalHistoryItem[];
  symptom_findings: SymptomFinding[];
  probabilities: Probability[];
  action: Action;
  alerts?: string[];
}

export default function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;
  const router = useRouter();

  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirmAction = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/api/patients/${patientId}/action`, {
        method: "PUT",
      });
      if (res.ok) {
        alert("Randevu ve Sevk İşlemi Başarıyla Onaylandı!");
        router.push("/");
      } else {
        alert("Bir hata oluştu.");
      }
    } catch (err) {
      alert("Randevu ve Sevk İşlemi Onaylandı! (Simüle)");
      router.push("/");
    } finally {
      setSubmitting(false);
    }
  };

  // Fallback mock details for both patients
  const mockEsra: PatientDetails = {
    id: 1,
    tc_no: "12345678901",
    name: "Esra Canpolat",
    age: 23,
    gender: "Kadın",
    blood_type: "0 Rh(+)",
    weight: 47,
    height: 172,
    chronic_conditions: "Tip 2 Diyabet",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    status: "STABİL",
    criticality: 0.25,
    son_randevu: "10 Ekim 2023 09:15",
    medical_history: [
      {
        category: "Klinik Tanı",
        title: "Hipertansiyon (Esansiyel)",
        details: "Hasta 3 yıldır ACE inhibitörü kullanımıyla takip edilmektedir. Sistolik kan basıncı regüledir.",
        color_tag: "blue"
      },
      {
        category: "Cerrahi",
        title: "Kolesistektomi (Laparoskopik)",
        details: "2019 yılında gerçekleştirilmiştir. Komplikasyon bildirilmemiştir.",
        color_tag: "blue"
      },
      {
        category: "Alerjiler",
        title: "Penisilin Grubu",
        details: "Anafilaktik reaksiyon öyküsü mevcuttur. Tüm reçetelerde kısıtlanmıştır.",
        color_tag: "red"
      }
    ],
    symptom_findings: [
      { finding: "Akut retrosternal yanma hissi", checked: true },
      { finding: "Efor sonrası artan nefes darlığı", checked: true },
      { finding: "Post-prandial bulantı", checked: true }
    ],
    probabilities: [
      { condition: "Gastroözofageal Reflü", probability: 78 },
      { condition: "Anjina Pektoris", probability: 14 }
    ],
    action: {
      recommended_dept: "Gastroenteroloji Polikliniği",
      required_tests: "Üst GİS Endoskopisi, H. Pylori Antijen Testi, Karın USG"
    }
  };

  const mockUlas: PatientDetails = {
    id: 2,
    tc_no: "98765432109",
    name: "Ulaş Can",
    age: 45,
    gender: "Erkek",
    blood_type: "A Rh(+)",
    weight: 82,
    height: 180,
    chronic_conditions: "Hipertansiyon",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    status: "ACİL",
    criticality: 0.85,
    son_randevu: "12 Ekim 2023 14:30",
    medical_history: [
      {
        category: "Klinik Tanı",
        title: "Hipertansiyon",
        details: "Aktif ilaç tedavisi altında.",
        color_tag: "blue"
      }
    ],
    symptom_findings: [
      { finding: "Sol kolda şiddetli uyuşma ve göğüste daralma", checked: true },
      { finding: "Terleme ve baş dönmesi", checked: true }
    ],
    probabilities: [
      { condition: "Akut Koroner Sendrom", probability: 85 }
    ],
    action: {
      recommended_dept: "Kardiyoloji Polikliniği",
      required_tests: "EKG, Troponin Testi, Koroner Anjiyografi"
    }
  };

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/patients/${patientId}`);
        if (res.ok) {
          const data = await res.json();
          setPatient(data);
        } else {
          setPatient(patientId === "2" ? mockUlas : mockEsra);
        }
      } catch (err) {
        console.log("Backend offline, using fallback patient details");
        setPatient(patientId === "2" ? mockUlas : mockEsra);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-blue" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-[#111C2C]">
        Hasta bulunamadı. <Link href="/" className="text-royal-blue underline ml-2">Geri Dön</Link>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 bg-white rounded-lg border border-[#E7EEFF] hover:bg-slate-50 transition">
            <ArrowLeft className="w-4 h-4 text-navy-dark" />
          </Link>
          <h1 className="text-2xl font-bold text-navy-dark">Hasta Özeti</h1>
        </div>
        <button className="relative p-2 rounded-full hover:bg-slate-100 transition">
          <Bell className="w-5 h-5 text-navy-dark" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-royal-blue border-2 border-white rounded-full"></span>
        </button>
      </header>

      {/* Dynamic AI Warnings (Uzun Süreli Medikal Hafıza Alerts) */}
      {patient.alerts && patient.alerts.length > 0 && (
        <div className="flex flex-col gap-3">
          {patient.alerts.map((alert, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-3 p-4 bg-red-50/80 border border-red-200 rounded-2xl text-xs text-urgency-red shadow-sm animate-pulse"
            >
              <div className="p-1 bg-urgency-red text-white rounded-lg mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 leading-relaxed">
                <strong className="font-bold">Bağlamsal Tıbbi Uyarı: </strong>
                {alert}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top row layout (Patient profile card + Medical History summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Card: Patient Info */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E7EEFF] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-dark tracking-wide font-mono">
                  DOSYA NO: #{patient.id === 1 ? "88291-K" : "9021-U"}
                </span>
                <h2 className="text-xl font-bold text-[#111C2C]">{patient.name}</h2>
                <span className={`w-fit mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                  patient.status === "ACİL"
                    ? "bg-red-50 text-urgency-red border border-red-200"
                    : "bg-emerald-50 text-emerald border border-emerald-200"
                }`}>
                  {patient.status}
                </span>
              </div>
              
              <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[#E7EEFF]">
                <Image
                  src={patient.avatar_url}
                  alt={patient.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <hr className="border-[#E7EEFF] mb-6" />

            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
              <div>
                <span className="text-[10px] text-slate-dark block">Yaş / Cinsiyet</span>
                <span className="text-sm font-semibold text-navy-dark">{patient.age} / {patient.gender}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-dark block">Kan Grubu</span>
                <span className="text-sm font-semibold text-urgency-red">{patient.blood_type}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-dark block">Boy / Kilo</span>
                <span className="text-sm font-semibold text-navy-dark">{patient.height}cm / {patient.weight}kg</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-dark block">Kronik Durumlar</span>
                <span className="text-sm font-semibold text-navy-dark truncate max-w-xs block" title={patient.chronic_conditions}>
                  {patient.chronic_conditions}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Tıbbi Geçmiş Özeti */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E7EEFF] p-6 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-royal-blue" />
              <h2 className="font-bold text-navy-dark text-base">Tıbbi Geçmiş Özeti</h2>
            </div>
            <button className="text-xs font-semibold text-royal-blue hover:underline">Tam Kayıt</button>
          </div>

          <div className="flex flex-col gap-3 flex-1 justify-center">
            {patient.medical_history.map((item, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-xl border-l-[3px] bg-[#F9F9FF]/40 border-[#E7EEFF] hover:border-slate-300 transition ${
                  item.color_tag === "red" ? "border-l-urgency-red" : "border-l-royal-blue"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-xs text-[#111C2C]">
                    {item.category}: {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-dark leading-relaxed">
                  {item.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row layout (AI Symptom Analysis + Recommended Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Bottom: AI Symptom Analysis */}
        <div className="lg:col-span-3 bg-[#003C90] text-white rounded-2xl p-6 shadow-xs flex flex-col gap-6 relative overflow-hidden">
          {/* Subtle design graphics */}
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-mint-green" />
              <h2 className="font-bold text-base">AI Semptom Analizi</h2>
            </div>
            <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-mint-green">
              Gerçek Zamanlı
            </span>
          </div>

          <div className="flex flex-col gap-5 z-10">
            {/* Mevcut Bulgular */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">Mevcut Bulgular</span>
              <div className="flex flex-col gap-1.5">
                {patient.symptom_findings.map((symptom, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-white/95">
                    <CheckCircle2 className="w-4.5 h-4.5 text-mint-green fill-mint-green/10" />
                    <span>{symptom.finding}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Olasılık Analizi */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">Olasılık Analizi</span>
                <div className="flex flex-col gap-3">
                  {patient.probabilities.map((prob, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{prob.condition}</span>
                        <span className="text-mint-green">{prob.probability}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-mint-green rounded-full"
                          style={{ width: `${prob.probability}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <p className="text-[10px] leading-relaxed text-white/80">
                  <span className="font-bold text-mint-green">AI Notu: </span>
                  {patient.id === 1 
                    ? "Mevcut semptomlar öncelikle GİS odaklı görünmektedir, ancak kardiyak risk faktörleri dışlanmalıdır."
                    : "Bulgular yüksek kardiyak risk işaret etmektedir. Acil EKG ve Troponin takibi gerekmektedir."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Bottom: Recommended Actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E7EEFF] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald rounded-lg">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-[#111C2C] text-base">Önerilen Aksiyon</h2>
            </div>

            {/* Yönlendirme */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-dark uppercase font-bold tracking-wider">Yönlendirme</span>
              <span className="text-sm font-bold text-navy-dark">
                {patient.action ? patient.action.recommended_dept : "Gastroenteroloji Polikliniği"}
              </span>
            </div>

            {/* Öncelikli Tetkikler */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-dark uppercase font-bold tracking-wider">Öncelikli Tetkikler</span>
              <div className="flex flex-col gap-2 bg-[#F9F9FF]/40 border border-[#E7EEFF] rounded-xl p-4">
                {patient.action ? (
                  patient.action.required_tests.split(",").map((test, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-navy-dark">
                      <span className="w-1.5 h-1.5 bg-royal-blue rounded-full"></span>
                      <span>{test.trim()}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs text-navy-dark">
                      <span className="w-1.5 h-1.5 bg-royal-blue rounded-full"></span>
                      <span>Üst GİS Endoskopisi</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-navy-dark">
                      <span className="w-1.5 h-1.5 bg-royal-blue rounded-full"></span>
                      <span>H. Pylori Antijen Testi</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-navy-dark">
                      <span className="w-1.5 h-1.5 bg-royal-blue rounded-full"></span>
                      <span>Karın USG</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={handleConfirmAction}
            disabled={submitting}
            className="w-full bg-[#003C90] text-white py-3.5 rounded-xl text-xs font-bold shadow-sm hover:bg-opacity-95 active:scale-[0.99] flex items-center justify-center gap-2 transition mt-6 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Onaylanıyor..." : "Randevuyu Onayla ve Sevk Et"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
