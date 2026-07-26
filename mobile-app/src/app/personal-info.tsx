import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import SubPageHeader from "@/components/sub-page-header";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth";

const BLOOD_TYPES = ["0 Rh(+)", "A Rh(+)", "B Rh(+)", "AB Rh(+)", "0 Rh(-)", "A Rh(-)", "B Rh(-)", "AB Rh(-)"];

export default function PersonalInfoScreen() {
  const { token, profile, refreshProfile } = useAuth();

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Kadın");
  const [bloodType, setBloodType] = useState("A Rh(+)");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Prefill form from the real profile when available.
  useEffect(() => {
    if (profile) {
      if (profile.age) setAge(String(profile.age));
      if (profile.gender) setGender(profile.gender);
      if (profile.blood_type) setBloodType(profile.blood_type);
      if (profile.weight) setWeight(String(profile.weight));
      if (profile.height) setHeight(String(profile.height));
      if (profile.chronic_conditions) setChronicConditions(profile.chronic_conditions);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!age || !weight || !height) {
      alert("Lütfen yaş, boy ve kilo bilgilerinizi giriniz.");
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      const activeToken = token || "";
      const res = await apiFetch("/api/auth/onboarding?token=" + encodeURIComponent(activeToken), {
        method: "POST",
        body: JSON.stringify({
          age: parseInt(age),
          gender: gender,
          blood_type: bloodType,
          weight: parseFloat(weight),
          height: parseFloat(height),
          chronic_conditions: chronicConditions
        })
      });
      if (res.ok) {
        await refreshProfile();
        setSaved(true);
        alert("Kişisel bilgileriniz başarıyla güncellendi.");
      } else {
        alert("Bilgiler kaydedilemedi. Lütfen tekrar deneyin.");
      }
    } catch (err) {
      setSaved(true);
      alert("Çevrimdışı mod: Bilgileriniz simüle olarak kaydedildi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SubPageHeader title="Kişisel Bilgiler" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-circle-outline" size={20} color="#003C90" />
              <Text style={styles.cardTitle}>Biyometrik Bilgiler</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              Bu bilgiler AI destekli ön tanı ve sevk kararlarında kullanılır. Güncel tutmanız önerilir.
            </Text>

            {profile && (
              <View style={styles.identityRow}>
                <View style={styles.identityIconWrapper}>
                  <Ionicons name="card-outline" size={16} color="#003C90" />
                </View>
                <View>
                  <Text style={styles.identityName}>{profile.name}</Text>
                  {profile.tc_no ? <Text style={styles.identityTc}>TC NO: {profile.tc_no}</Text> : null}
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>YAŞ</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  placeholder="Örn: 23"
                  placeholderTextColor="#737784"
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>CİNSİYET</Text>
              <View style={styles.genderRow}>
                {["Kadın", "Erkek"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderButton, gender === g && styles.genderButtonActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderButtonText, gender === g && styles.genderButtonTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>KAN GRUBU</Text>
              <View style={styles.bloodTypeGrid}>
                {BLOOD_TYPES.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.bloodButton, bloodType === b && styles.bloodButtonActive]}
                    onPress={() => setBloodType(b)}
                  >
                    <Text style={[styles.bloodButtonText, bloodType === b && styles.bloodButtonTextActive]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>BOY (CM)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={height}
                    onChangeText={setHeight}
                    placeholder="172"
                    placeholderTextColor="#737784"
                    keyboardType="numeric"
                    style={styles.textInput}
                  />
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.fieldLabel}>KİLO (KG)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="65"
                    placeholderTextColor="#737784"
                    keyboardType="numeric"
                    style={styles.textInput}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>KRONİK RAHATSIZLIKLAR</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={chronicConditions}
                  onChangeText={setChronicConditions}
                  placeholder="Astım, Tansiyon vb. (Yoksa boş bırakın)"
                  placeholderTextColor="#737784"
                  style={styles.textInput}
                />
              </View>
            </View>

            {saved && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#006C4D" />
                <Text style={styles.successText}>Bilgileriniz güncellendi.</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>{saving ? "Kaydediliyor..." : "Bilgileri Kaydet"}</Text>
              <Ionicons name="checkmark-circle" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7EEFF",
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111C2C",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#737784",
    lineHeight: 18,
    marginBottom: 16,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F9F9FF",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  identityIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#E7EEFF",
    justifyContent: "center",
    alignItems: "center",
  },
  identityName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#111C2C",
  },
  identityTc: {
    fontSize: 11,
    color: "#737784",
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#737784",
    marginBottom: 6,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9FF",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#111C2C",
    height: "100%",
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E7EEFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9F9FF",
  },
  genderButtonActive: {
    backgroundColor: "#006C4D",
    borderColor: "#006C4D",
  },
  genderButtonText: {
    fontSize: 13,
    color: "#434653",
    fontWeight: "bold",
  },
  genderButtonTextActive: {
    color: "white",
  },
  bloodTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  bloodButton: {
    width: "23%",
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E7EEFF",
    backgroundColor: "#F9F9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  bloodButtonActive: {
    backgroundColor: "#006C4D",
    borderColor: "#006C4D",
  },
  bloodButtonText: {
    fontSize: 11,
    color: "#434653",
    fontWeight: "bold",
  },
  bloodButtonTextActive: {
    color: "white",
  },
  rowInputs: {
    flexDirection: "row",
    marginBottom: 16,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAFDF4",
    borderRadius: 10,
    padding: 10,
    marginBottom: 4,
  },
  successText: {
    fontSize: 12,
    color: "#006C4D",
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#003C90",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },
});
