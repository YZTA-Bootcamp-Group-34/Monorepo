import React from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const user = {
    name: "Esra Canpolat",
    tc_no: "12345678901",
    blood: "0 Rh+",
    weight: "47 kg",
    height: "172 cm",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
  };

  const menuItems = [
    { id: "personal", label: "Kişisel Bilgiler", icon: "person-outline" },
    { id: "files", label: "Sağlık Dosyam", icon: "folder-open-outline" },
    { id: "settings", label: "Ayarlar", icon: "settings-outline" },
    { id: "help", label: "Yardım", icon: "help-circle-outline" }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card Top */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil" size={14} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userTc}>TC NO: {user.tc_no}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Blood Card */}
          <View style={styles.statCard}>
            <Ionicons name="water" size={18} color="#BA1A1A" style={styles.statIcon} />
            <Text style={styles.statLabel}>KAN</Text>
            <Text style={styles.statValue}>{user.blood}</Text>
          </View>
          {/* Weight Card */}
          <View style={styles.statCard}>
            <Ionicons name="scale-outline" size={18} color="#003C90" style={styles.statIcon} />
            <Text style={styles.statLabel}>KİLO</Text>
            <Text style={styles.statValue}>{user.weight}</Text>
          </View>
          {/* Height Card */}
          <View style={styles.statCard}>
            <Ionicons name="resize-outline" size={18} color="#006C4D" style={styles.statIcon} />
            <Text style={styles.statLabel}>BOY</Text>
            <Text style={styles.statValue}>{user.height}</Text>
          </View>
        </View>

        {/* Account Management Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>HESAP YÖNETİMİ</Text>
        </View>

        {/* Settings Menu List */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrapper}>
                  <Ionicons name={item.icon as any} size={18} color="#003C90" />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#C3C6D5" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={18} color="#BA1A1A" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#003C90",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111C2C",
    marginBottom: 4,
  },
  userTc: {
    fontSize: 12,
    color: "#737784",
    letterSpacing: 1,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 24,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  statIcon: {
    marginBottom: 2,
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
  sectionHeader: {
    width: "100%",
    marginBottom: 10,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#737784",
    letterSpacing: 1,
  },
  menuContainer: {
    width: "100%",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F5",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F0F4FA",
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemLabel: {
    fontSize: 14,
    color: "#111C2C",
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BA1A1A",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#BA1A1A",
  },
});
