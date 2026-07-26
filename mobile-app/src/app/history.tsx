import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch } from "@/lib/api";

interface HistoryRecord {
  id: string;
  title: string;
  date: string;
  department: string;
  urgency: "urgent" | "normal" | "past";
  iconName: string;
}

interface GroupedRecords {
  year: string;
  records: HistoryRecord[];
}

interface ApiAppointment {
  id: number | string;
  date_str: string;
  title: string;
  detail: string;
  rec_code: string;
  doctor_name: string;
  status: string;
}

// Offline / mock fallback (previous static content).
const MOCK_RECORDS: GroupedRecords[] = [
  {
    year: "2025 Kayıtları",
    records: [
      {
        id: "1",
        title: "Şiddetli Baş Ağrısı",
        date: "12 Mayıs 2025",
        department: "Nöroloji Önerildi",
        urgency: "normal",
        iconName: "medical"
      },
      {
        id: "2",
        title: "Göğüs Sıkışması",
        date: "28 Nisan 2025",
        department: "Kardiyoloji (Acil)",
        urgency: "urgent",
        iconName: "heart-half"
      },
      {
        id: "3",
        title: "Kuru Öksürük",
        date: "05 Mart 2025",
        department: "Göğüs Hastalıkları Önerildi",
        urgency: "normal",
        iconName: "pulse"
      }
    ]
  },
  {
    year: "2024 Kayıtları",
    records: [
      {
        id: "4",
        title: "Diş Eti Kanaması",
        date: "14 Kasım 2024",
        department: "Diş Hekimliği",
        urgency: "past",
        iconName: "heart"
      },
      {
        id: "5",
        title: "Ciltte Kızarıklık",
        date: "22 Ağustos 2024",
        department: "Dermatoloji",
        urgency: "past",
        iconName: "flask"
      }
    ]
  }
];

function mapUrgency(status: string): "urgent" | "normal" | "past" {
  const s = (status || "").toLowerCase();
  if (s.includes("acil") || s.includes("kritik")) return "urgent";
  if (s.includes("aktif") || s.includes("onay") || s.includes("bekle")) return "normal";
  return "past";
}

function mapIcon(title: string): string {
  const t = (title || "").toLowerCase();
  if (t.includes("kardiyoloji") || t.includes("göğüs")) return "heart-half";
  if (t.includes("nöroloji") || t.includes("baş")) return "medical";
  if (t.includes("dermatoloji") || t.includes("cilt")) return "flask";
  return "pulse";
}

function groupAppointments(items: ApiAppointment[]): GroupedRecords[] {
  const groups: Record<string, HistoryRecord[]> = {};
  const order: string[] = [];

  items.forEach((item) => {
    const yearMatch = (item.date_str || "").match(/(20\d{2})/);
    const groupKey = yearMatch ? `${yearMatch[1]} Kayıtları` : "Güncel Kayıtlar";

    const record: HistoryRecord = {
      id: String(item.id),
      title: item.title || "Randevu Kaydı",
      date: item.date_str || "",
      department: [item.doctor_name, item.status].filter(Boolean).join(" • ") || item.detail || "",
      urgency: mapUrgency(item.status),
      iconName: mapIcon(item.title)
    };

    if (!groups[groupKey]) {
      groups[groupKey] = [];
      order.push(groupKey);
    }
    groups[groupKey].push(record);
  });

  // "Güncel Kayıtlar" (no year) first, then years descending.
  order.sort((a, b) => {
    if (a === "Güncel Kayıtlar") return -1;
    if (b === "Güncel Kayıtlar") return 1;
    return b.localeCompare(a);
  });

  return order.map((year) => ({ year, records: groups[year] }));
}

export default function HistoryScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recordsData, setRecordsData] = useState<GroupedRecords[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await apiFetch("/api/appointments/history");
      if (res.ok) {
        const data: ApiAppointment[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setRecordsData(groupAppointments(data));
        } else {
          setRecordsData(MOCK_RECORDS);
        }
      } else {
        setRecordsData(MOCK_RECORDS);
      }
    } catch (err) {
      // Offline fallback
      setRecordsData(MOCK_RECORDS);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchHistory();
      setLoading(false);
    })();
  }, [fetchHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, [fetchHistory]);

  // Filtering records by search input
  const filteredData = recordsData.map((group) => {
    const filteredRecords = group.records.filter((rec) =>
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...group, records: filteredRecords };
  }).filter((group) => group.records.length > 0);

  const getUrgencyColor = (urgency: "urgent" | "normal" | "past") => {
    switch (urgency) {
      case "urgent":
        return "#BA1A1A";
      case "normal":
        return "#006C4D";
      default:
        return "#737784";
    }
  };

  const getUrgencyIcon = (urgency: "urgent" | "normal" | "past") => {
    switch (urgency) {
      case "urgent":
        return "alert-circle";
      case "normal":
        return "checkmark-circle-outline";
      default:
        return "time-outline";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kayıt Geçmişi</Text>
        <Text style={styles.headerSub}>Geçmiş AI analizlerinizi ve önerilerinizi buradan inceleyebilirsiniz.</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#737784" style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Belirti veya bölüm ara..."
          placeholderTextColor="#737784"
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        /* Loading skeleton */
        <View style={styles.scrollContent}>
          <View style={styles.skeletonGroupHeader} />
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonIcon} />
              <View style={{ flex: 1, gap: 8 }}>
                <View style={[styles.skeletonLine, { width: "60%" }]} />
                <View style={[styles.skeletonLine, { width: "40%" }]} />
                <View style={[styles.skeletonLine, { width: "50%" }]} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        /* Scrollable list of records */
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#003C90" colors={["#003C90"]} />
          }
        >
          {filteredData.map((group) => (
            <View key={group.year} style={styles.groupSection}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{group.year}</Text>
                <Text style={styles.groupCount}>{group.records.length} Kayıt</Text>
              </View>

              {group.records.map((rec) => (
                <TouchableOpacity key={rec.id} style={styles.recordCard}>
                  <View style={styles.cardLeft}>
                    {/* Icon wrapper */}
                    <View style={styles.iconWrapper}>
                      <Ionicons
                        name={
                          rec.iconName === "medical" ? "bandage-outline" :
                          rec.iconName === "heart-half" ? "heart-dislike-outline" :
                          rec.iconName === "pulse" ? "fitness-outline" :
                          rec.iconName === "heart" ? "happy-outline" : "color-palette-outline"
                        }
                        size={20}
                        color="#003C90"
                      />
                    </View>
                    <View style={styles.textWrapper}>
                      <Text style={styles.recordTitle}>{rec.title}</Text>
                      <Text style={styles.recordDate}>{rec.date}</Text>
                      <View style={styles.urgencyRow}>
                        <Ionicons
                          name={getUrgencyIcon(rec.urgency)}
                          size={14}
                          color={getUrgencyColor(rec.urgency)}
                        />
                        <Text style={[styles.urgencyText, { color: getUrgencyColor(rec.urgency) }]}>
                          {rec.department}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#C3C6D5" />
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {filteredData.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aradığınız kriterlere uygun kayıt bulunamadı.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9FF",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EEFF",
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111C2C",
  },
  headerSub: {
    fontSize: 12,
    color: "#737784",
    lineHeight: 16,
  },
  searchContainer: {
    margin: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#111C2C",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  groupSection: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003C90",
    backgroundColor: "#E7EEFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  groupCount: {
    fontSize: 11,
    color: "#737784",
  },
  recordCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F0F4FA",
    justifyContent: "center",
    alignItems: "center",
  },
  textWrapper: {
    gap: 2,
    flex: 1,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111C2C",
  },
  recordDate: {
    fontSize: 11,
    color: "#737784",
  },
  urgencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#737784",
    textAlign: "center",
  },
  skeletonGroupHeader: {
    width: 110,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#E7EEFF",
    marginBottom: 12,
  },
  skeletonCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F0F4FA",
  },
  skeletonLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F0F0F5",
  },
});
