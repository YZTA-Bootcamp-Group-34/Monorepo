import React, { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  ScrollView, 
  TouchableOpacity 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

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

export default function HistoryScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const recordsData: GroupedRecords[] = [
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

      {/* Scrollable list of records */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
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
});
