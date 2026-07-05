import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Department {
  id: number;
  name: string;
  doctor_count: number;
  description: string;
  status_text: string;
  status_type: string;
  icon?: string;
}

export default function DepartmentsScreen() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const mockDoctorsData: Record<string, { name: string; times: string[] }[]> = {
    "Kardiyoloji": [
      { name: "Dr. Alper Can", times: ["Bugün 14:00", "Bugün 15:30", "Yarın 10:00"] },
      { name: "Dr. Meltem Bal", times: ["Yarın 11:30", "Yarın 14:00"] }
    ],
    "Nöroloji": [
      { name: "Dr. Esra Kar", times: ["Yarın 09:00", "Yarın 14:30"] },
      { name: "Dr. Yusuf Şen", times: ["Bugün 16:00", "Cuma 11:00"] }
    ],
    "Dermatoloji": [
      { name: "Dr. Ahmet Kaya", times: ["Bugün 11:00", "Yarın 15:00"] }
    ],
    "Göz Hastalıkları": [
      { name: "Dr. Canan Yılmaz", times: ["Yarın 10:30", "Yarın 16:00"] }
    ],
    "Dahiliye": [
      { name: "Dr. Selim Tekin", times: ["Bugün 13:45", "Bugün 15:00"] },
      { name: "Dr. Zeynep Solak", times: ["Yarın 09:30", "Yarın 11:00"] }
    ],
    "Onkoloji": [
      { name: "Dr. Murat Akın", times: ["Cuma 14:00", "Pazartesi 10:00"] }
    ]
  };

  const handleBookAppointment = async (deptName: string, doctorName: string, timeStr: string) => {
    try {
      let dateString = "05.07.2026";
      if (timeStr.includes("Bugün")) {
        dateString = "Bugün, " + timeStr.replace("Bugün ", "");
      } else if (timeStr.includes("Yarın")) {
        dateString = "Yarın, " + timeStr.replace("Yarın ", "");
      } else {
        dateString = timeStr;
      }

      const token = await AsyncStorage.getItem("user_token") || "";
      const res = await fetch("http://localhost:8000/api/appointments/history", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          date_str: dateString,
          title: `${deptName} Randevusu`,
          detail: "Mobil uygulama üzerinden oluşturuldu.",
          rec_code: "REC-" + Math.floor(1000 + Math.random() * 9000),
          doctor_name: doctorName,
          status: "Aktif"
        })
      });

      if (res.ok) {
        alert(`Randevunuz başarıyla alınmıştır!\n\nHekim: ${doctorName}\nTarih/Saat: ${timeStr}\n\nGeçmiş sekmesinden takip edebilirsiniz.`);
        router.push("/history");
      } else {
        alert("Randevu alınırken bir hata oluştu.");
      }
    } catch (err) {
      alert(`Randevunuz simüle olarak alınmıştır!\n\nHekim: ${doctorName}\nTarih/Saat: ${timeStr}`);
      router.push("/history");
    }
  };

  const mockDepartments: Department[] = [
    {
      id: 1,
      name: "Kardiyoloji",
      doctor_count: 12,
      description: "Kalp ve damar hastalıkları tanı ve tedavisi.",
      status_text: "Şu an randevu alınabilir",
      status_type: "green",
      icon: "heart"
    },
    {
      id: 2,
      name: "Nöroloji",
      doctor_count: 8,
      description: "Beyin, sinir sistemi ve kas hastalıkları.",
      status_text: "Gelecek randevu: Yarın 09:00",
      status_type: "gray",
      icon: "pulse"
    },
    {
      id: 3,
      name: "Dermatoloji",
      doctor_count: 5,
      description: "Deri, tırnak ve saç sağlığı ile estetik çözümler.",
      status_text: "Şu an randevu alınabilir",
      status_type: "green",
      icon: "medkit"
    },
    {
      id: 4,
      name: "Göz Hastalıkları",
      doctor_count: 6,
      description: "Görme bozuklukları, katarakt ve lazer tedavi.",
      status_text: "Yoğun randevu talebi",
      status_type: "red",
      icon: "eye"
    },
    {
      id: 5,
      name: "Dahiliye",
      doctor_count: 15,
      description: "İç organ hastalıkları ve genel check-up.",
      status_text: "Müsait doktorlar var",
      status_type: "green",
      icon: "stethoscope"
    },
    {
      id: 6,
      name: "Onkoloji",
      doctor_count: 4,
      description: "Kanser tanı, evreleme ve tedavi süreçleri.",
      status_text: "Danışma hattı aktif",
      status_type: "gray",
      icon: "shield"
    }
  ];

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/departments");
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        } else {
          setDepartments(mockDepartments);
        }
      } catch (err) {
        setDepartments(mockDepartments);
      } finally {
        setLoading(false);
      }
    };

    fetchDepts();
  }, []);

  const getStatusColor = (type: string) => {
    switch (type) {
      case "green":
        return "#006C4D";
      case "red":
        return "#BA1A1A";
      default:
        return "#737784";
    }
  };

  const getStatusBg = (type: string) => {
    switch (type) {
      case "green":
        return "#EAFDF4";
      case "red":
        return "#FDEAEA";
      default:
        return "#F0F0F5";
    }
  };

  const filteredDepts = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Departmanlar</Text>
      </View>

      {/* Search area */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#737784" style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Klinik veya branş ara..."
          placeholderTextColor="#737784"
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003C90" />
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {filteredDepts.map((dept) => {
            const isSelected = selectedDept === dept.name;
            return (
              <TouchableOpacity 
                key={dept.id} 
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => setSelectedDept(isSelected ? null : dept.name)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <View style={styles.iconWrapper}>
                      <Ionicons 
                        name={
                          dept.name.includes("Kardiyoloji") ? "heart" :
                          dept.name.includes("Nöroloji") ? "pulse" :
                          dept.name.includes("Dermatoloji") ? "color-palette" :
                          dept.name.includes("Göz") ? "eye" :
                          dept.name.includes("Dahiliye") ? "medkit" : "shield-checkmark"
                        } 
                        size={20} 
                        color="#003C90" 
                      />
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.deptName}>{dept.name}</Text>
                      <Text style={styles.deptDesc}>{dept.description}</Text>
                    </View>
                  </View>
                  <View style={styles.doctorCountBadge}>
                    <Text style={styles.doctorCountText}>{dept.doctor_count} Doktor</Text>
                  </View>
                </View>

                <View style={[styles.statusPill, { backgroundColor: getStatusBg(dept.status_type) }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(dept.status_type) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(dept.status_type) }]}>
                    {dept.status_text}
                  </Text>
                </View>

                {/* Expanded Doctors & Slots */}
                {isSelected && (
                  <View style={styles.expandedContent}>
                    <Text style={styles.expandedTitle}>Müsait Hekimler ve Randevu Saatleri:</Text>
                    {(mockDoctorsData[dept.name] || []).map((doc, docIdx) => (
                      <View key={docIdx} style={styles.doctorRow}>
                        <View style={styles.doctorInfo}>
                          <Ionicons name="person-circle-outline" size={20} color="#003C90" />
                          <Text style={styles.doctorNameText}>{doc.name}</Text>
                        </View>
                        <View style={styles.timesContainer}>
                          {doc.times.map((time, timeIdx) => (
                            <TouchableOpacity 
                              key={timeIdx} 
                              style={styles.timeButton}
                              onPress={() => handleBookAppointment(dept.name, doc.name, time)}
                            >
                              <Text style={styles.timeButtonText}>{time}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* AI Banner Help Card */}
          <View style={styles.aiBanner}>
            <View style={styles.aiBannerIconWrapper}>
              <Ionicons name="information-circle-outline" size={24} color="#003C90" />
            </View>
            <Text style={styles.aiBannerText}>
              Aradığınız departmanı bulamadınız mı? AI Asistanımıza semptomlarınızı sorarak doğru branşa yönlendirilebilirsiniz.
            </Text>
            <TouchableOpacity 
              style={styles.aiBannerButton}
              onPress={() => router.push("/")}
            >
              <Text style={styles.aiBannerButtonText}>AI Asistan ile Konuş</Text>
              <Ionicons name="arrow-forward" size={16} color="#003C90" />
            </TouchableOpacity>
          </View>
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
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EEFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111C2C",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitleRow: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F0F4FA",
    justifyContent: "center",
    alignItems: "center",
  },
  deptName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111C2C",
  },
  deptDesc: {
    fontSize: 12,
    color: "#737784",
    marginTop: 2,
    lineHeight: 16,
    maxWidth: "85%",
  },
  doctorCountBadge: {
    backgroundColor: "#E7FDF4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  doctorCountText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#006C4D",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  aiBanner: {
    backgroundColor: "#E7EEFF",
    borderWidth: 1,
    borderColor: "#C3C6D5",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  aiBannerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  aiBannerText: {
    fontSize: 12,
    textAlign: "center",
    color: "#434653",
    lineHeight: 18,
  },
  aiBannerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  aiBannerButtonText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#003C90",
  },
  expandedContent: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E7EEFF",
    paddingTop: 12,
    gap: 12,
  },
  expandedTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111C2C",
    marginBottom: 4,
  },
  doctorRow: {
    backgroundColor: "#F9F9FF",
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  doctorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  doctorNameText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111C2C",
  },
  timesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  timeButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  timeButtonText: {
    fontSize: 11,
    color: "#003C90",
    fontWeight: "500",
  },
});
