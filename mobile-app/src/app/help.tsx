import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import SubPageHeader from "@/components/sub-page-header";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "CarePulse AI Asistanı nasıl çalışır?",
    answer:
      "Şikayetlerinizi yazılı veya sesli olarak asistanımıza anlatın. Yapay zekamız belirtilerinizi analiz ederek sizi en uygun polikliniğe yönlendirir ve gerekirse ön sevk kaydı oluşturur."
  },
  {
    question: "Nasıl randevu alabilirim?",
    answer:
      "Bölümler sekmesinden ilgili polikliniği seçip müsait hekim ve saatlerden birine dokunarak randevu oluşturabilirsiniz. Ayrıca AI Asistan görüşmesi sonunda önerilen bölüme doğrudan randevu talep edebilirsiniz."
  },
  {
    question: "Sevk durumumu nereden takip edebilirim?",
    answer:
      "Sevkiniz hekim tarafından onaylandığında Chatbot ekranında bildirim kartı görürsünüz. Ayrıca Profil > Sağlık Dosyam ekranındaki Sevk Durumu kartından hekim ve tarih bilgilerini görüntüleyebilirsiniz."
  },
  {
    question: "Taburcu sonrası takip anketi nedir?",
    answer:
      "Muayene veya taburcu sonrası Profil ekranındaki takip anketi ile ağrı düzeyinizi, ateşinizi ve şikayetlerinizi hekiminize iletebilirsiniz. Kritik değerlerde hekim paneline otomatik takip alarmı gönderilir."
  },
  {
    question: "Kişisel bilgilerimi nasıl güncellerim?",
    answer:
      "Profil > Kişisel Bilgiler ekranından yaş, boy, kilo, kan grubu ve kronik rahatsızlık bilgilerinizi dilediğiniz zaman güncelleyebilirsiniz. Güncel bilgiler AI analizlerinin doğruluğunu artırır."
  },
  {
    question: "Verilerim güvende mi?",
    answer:
      "Sağlık verileriniz şifreli bağlantı üzerinden iletilir ve yalnızca sizin ve yetkili hekiminizin erişimine açıktır. Uygulama, verilerinizi üçüncü taraflarla paylaşmaz."
  }
];

export default function HelpScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SafeAreaView style={styles.container}>
      <SubPageHeader title="Yardım" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>SIKÇA SORULAN SORULAR</Text>

        <View style={styles.faqContainer}>
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <View key={idx}>
                {idx > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => setOpenIndex(isOpen ? null : idx)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqIconWrapper}>
                    <Ionicons name="help-circle-outline" size={16} color="#003C90" />
                  </View>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#737784"
                  />
                </TouchableOpacity>
                {isOpen && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>BİZE ULAŞIN</Text>
        <View style={styles.contactCard}>
          <View style={styles.contactRow}>
            <View style={styles.contactIconWrapper}>
              <Ionicons name="call-outline" size={18} color="#006C4D" />
            </View>
            <View>
              <Text style={styles.contactLabel}>Destek Hattı</Text>
              <Text style={styles.contactValue}>0850 000 34 34</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.contactRow}>
            <View style={styles.contactIconWrapper}>
              <Ionicons name="mail-outline" size={18} color="#006C4D" />
            </View>
            <View>
              <Text style={styles.contactLabel}>E-posta</Text>
              <Text style={styles.contactValue}>destek@preclinic.app</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.contactRow}>
            <View style={styles.contactIconWrapper}>
              <Ionicons name="time-outline" size={18} color="#006C4D" />
            </View>
            <View>
              <Text style={styles.contactLabel}>Çalışma Saatleri</Text>
              <Text style={styles.contactValue}>Hafta içi 09:00 - 18:00</Text>
            </View>
          </View>
        </View>

        <View style={styles.emergencyBanner}>
          <Ionicons name="warning-outline" size={18} color="#BA1A1A" />
          <Text style={styles.emergencyText}>
            Acil durumlarda lütfen uygulamayı kullanmak yerine 112 Acil Çağrı Merkezi'ni arayın.
          </Text>
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
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#737784",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
    paddingLeft: 4,
  },
  faqContainer: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  faqIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#F0F4FA",
    justifyContent: "center",
    alignItems: "center",
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#111C2C",
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingLeft: 52,
  },
  faqAnswer: {
    fontSize: 12,
    color: "#434653",
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F5",
  },
  contactCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contactIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EAFDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  contactLabel: {
    fontSize: 11,
    color: "#737784",
    fontWeight: "600",
  },
  contactValue: {
    fontSize: 13,
    color: "#111C2C",
    fontWeight: "bold",
    marginTop: 2,
  },
  emergencyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEEBEB",
    borderWidth: 1,
    borderColor: "#FAD2D2",
    borderRadius: 12,
    padding: 14,
  },
  emergencyText: {
    flex: 1,
    fontSize: 12,
    color: "#BA1A1A",
    fontWeight: "600",
    lineHeight: 17,
  },
});
