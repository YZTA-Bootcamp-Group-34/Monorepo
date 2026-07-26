import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Switch, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

import SubPageHeader from "@/components/sub-page-header";
import { API_URL, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth";

export default function SettingsScreen() {
  const { signOut, token, profile, refreshProfile } = useAuth();

  // Notification preference persisted server-side via /api/auth/onboarding.
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled ?? true);
  const [notifError, setNotifError] = useState<string | null>(null);
  // Dark mode stays a labeled "Yakında" placeholder.
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  // Keep the switch in sync when the profile (re)loads.
  useEffect(() => {
    setNotificationsEnabled(profile?.notifications_enabled ?? true);
  }, [profile?.notifications_enabled]);

  const handleToggleNotifications = async (value: boolean) => {
    // Optimistic UI: flip immediately, revert on failure.
    setNotificationsEnabled(value);
    setNotifError(null);
    try {
      const res = await apiFetch("/api/auth/onboarding?token=" + encodeURIComponent(token || ""), {
        method: "POST",
        body: JSON.stringify({ notifications_enabled: value })
      });
      if (!res.ok) throw new Error("save failed");
      await refreshProfile();
    } catch (err) {
      setNotificationsEnabled(!value);
      setNotifError("Sunucuya ulaşılamadı, tercih kaydedilemedi.");
      setTimeout(() => setNotifError(null), 4000);
    }
  };

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const handleLogout = async () => {
    try {
      // Clears storage and resets auth context; the login overlay appears immediately.
      await signOut();
    } catch (err) {
      alert("Çıkış yapılırken hata oluştu.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SubPageHeader title="Ayarlar" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Preferences */}
        <Text style={styles.sectionTitle}>TERCİHLER</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons name="notifications-outline" size={18} color="#003C90" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Bildirimler</Text>
                <Text style={styles.rowSub}>Sevk ve randevu bildirimleri</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: "#E7EEFF", true: "#86F8C8" }}
              thumbColor={notificationsEnabled ? "#006C4D" : "#737784"}
            />
          </View>
          {notifError && <Text style={styles.notifErrorText}>{notifError}</Text>}
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons name="moon-outline" size={18} color="#003C90" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Karanlık Mod</Text>
                <Text style={styles.rowSub}>Yakında kullanıma sunulacak</Text>
              </View>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: "#E7EEFF", true: "#86F8C8" }}
              thumbColor={darkModeEnabled ? "#006C4D" : "#737784"}
            />
          </View>
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>UYGULAMA HAKKINDA</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons name="information-circle-outline" size={18} color="#003C90" />
              </View>
              <Text style={styles.rowLabel}>Sürüm</Text>
            </View>
            <Text style={styles.rowValue}>v{appVersion}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons name="server-outline" size={18} color="#003C90" />
              </View>
              <Text style={styles.rowLabel}>Sunucu Adresi</Text>
            </View>
            <Text style={styles.rowValueSmall} numberOfLines={1}>{API_URL}</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#BA1A1A" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>PreClinic CarePulse • Hasta Uygulaması</Text>
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
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F0F4FA",
    justifyContent: "center",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 14,
    color: "#111C2C",
    fontWeight: "600",
  },
  rowSub: {
    fontSize: 11,
    color: "#737784",
    marginTop: 2,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#003C90",
  },
  rowValueSmall: {
    fontSize: 11,
    fontWeight: "600",
    color: "#737784",
    maxWidth: 160,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F5",
    marginLeft: 56,
  },
  notifErrorText: {
    fontSize: 11,
    color: "#BA1A1A",
    paddingHorizontal: 16,
    paddingBottom: 10,
    marginLeft: 40,
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
    marginTop: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#BA1A1A",
  },
  footerText: {
    fontSize: 11,
    color: "#737784",
    textAlign: "center",
    marginTop: 20,
  },
});
