import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import SubPageHeader from "@/components/sub-page-header";
import { useAuth } from "@/context/auth";

function computeBmi(weight?: number, height?: number): { value: string; label: string; color: string } | null {
  if (!weight || !height || height <= 0) return null;
  const meters = height / 100;
  const bmi = weight / (meters * meters);
  let label = "Normal";
  let color = "#006C4D";
  if (bmi < 18.5) {
    label = "Zayıf";
    color = "#003C90";
  } else if (bmi >= 25 && bmi < 30) {
    label = "Fazla Kilolu";
    color = "#B45309";
  } else if (bmi >= 30) {
    label = "Obezite";
    color = "#BA1A1A";
  }
  return { value: bmi.toFixed(1), label, color };
}

export default function HealthFileScreen() {
  const { profile } = useAuth();

  // Demo fallback when offline / mock mode.
  const bloodType = profile?.blood_type || "0 Rh+";
  const weight = profile?.weight ?? 47;
  const height = profile?.height ?? 172;
  const chronic = profile?.chronic_conditions?.trim();
  const bmi = computeBmi(weight, height);

  const referralConfirmed = profile?.referral_status === "CONFIRMED";

  return (
    <SafeAreaView style={styles.container}>
      <SubPageHeader title="Sağlık Dosyam" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="water" size={18} color="#BA1A1A" />
            <Text style={styles.statLabel}>KAN GRUBU</Text>
            <Text style={styles.statValue}>{bloodType}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="scale-outline" size={18} color="#003C90" />
            <Text style={styles.statLabel}>KİLO</Text>
            <Text style={styles.statValue}>{weight} kg</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="resize-outline" size={18} color="#006C4D" />
            <Text style={styles.statLabel}>BOY</Text>
            <Text style={styles.statValue}>{height} cm</Text>
          </View>
        </View>

        {/* BMI card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="fitness-outline" size={20} color="#003C90" />
            <Text style={styles.cardTitle}>Vücut Kitle İndeksi (VKİ)</Text>
          </View>
          {bmi ? (
            <View style={styles.bmiRow}>
              <Text style={styles.bmiValue}>{bmi.value}</Text>
              <View style={[styles.bmiBadge, { backgroundColor: `${bmi.color}1A` }]}>
                <View style={[styles.bmiDot, { backgroundColor: bmi.color }]} />
                <Text style={[styles.bmiLabel, { color: bmi.color }]}>{bmi.label}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              VKİ hesaplaması için boy ve kilo bilgilerinizi Kişisel Bilgiler ekranından girin.
            </Text>
          )}
          <Text style={styles.cardNote}>
            VKİ, boy ve kilonuza göre hesaplanan bilgilendirme amaçlı bir değerdir; tıbbi tanı yerine geçmez.
          </Text>
        </View>

        {/* Chronic conditions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="medkit-outline" size={20} color="#BA1A1A" />
            <Text style={styles.cardTitle}>Kronik Rahatsızlıklar</Text>
          </View>
          {chronic ? (
            <View style={styles.chronicList}>
              {chronic.split(",").map((c, idx) => (
                <View key={idx} style={styles.chronicPill}>
                  <Ionicons name="alert-circle-outline" size={14} color="#BA1A1A" />
                  <Text style={styles.chronicText}>{c.trim()}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Kayıtlı kronik rahatsızlığınız bulunmamaktadır.</Text>
          )}
        </View>

        {/* Referral status */}
        <View style={[styles.card, referralConfirmed && styles.referralCardActive]}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={referralConfirmed ? "checkmark-circle" : "git-pull-request-outline"}
              size={20}
              color={referralConfirmed ? "#006C4D" : "#737784"}
            />
            <Text style={styles.cardTitle}>Sevk Durumu</Text>
          </View>
          {referralConfirmed ? (
            <View style={{ gap: 8 }}>
              <View style={styles.referralRow}>
                <Text style={styles.referralLabel}>Durum</Text>
                <Text style={[styles.referralValue, { color: "#006C4D" }]}>Onaylandı</Text>
              </View>
              <View style={styles.referralRow}>
                <Text style={styles.referralLabel}>Hekim</Text>
                <Text style={styles.referralValue}>{profile?.referral_doctor || "Poliklinik Hekimi"}</Text>
              </View>
              <View style={styles.referralRow}>
                <Text style={styles.referralLabel}>Tarih / Saat</Text>
                <Text style={styles.referralValue}>{profile?.referral_date || "Müsaitlik doğrultusunda"}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Şu anda aktif bir sevk kaydınız bulunmuyor. AI Asistan ile görüşerek uygun polikliniğe yönlendirme talep edebilirsiniz.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9FF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#737784",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111C2C",
  },
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  referralCardActive: {
    borderColor: "#86F8C8",
    backgroundColor: "#F4FEF9",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111C2C",
  },
  cardNote: {
    fontSize: 11,
    color: "#737784",
    lineHeight: 16,
  },
  bmiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111C2C",
  },
  bmiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bmiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bmiLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  chronicList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chronicPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FDEAEA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chronicText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#BA1A1A",
  },
  emptyText: {
    fontSize: 12,
    color: "#737784",
    lineHeight: 18,
  },
  referralRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  referralLabel: {
    fontSize: 12,
    color: "#737784",
    fontWeight: "600",
  },
  referralValue: {
    fontSize: 12,
    color: "#111C2C",
    fontWeight: "bold",
  },
});
