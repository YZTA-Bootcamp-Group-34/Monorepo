import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator, Image } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <SafeAreaView edges={["bottom"]} style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName = "chatbubble-outline";
          let activeIconName = "chatbubble";
          let displayName = "Chatbot";

          if (route.name === "index") {
            iconName = "chatbubble-outline";
            activeIconName = "chatbubble";
            displayName = "Chatbot";
          } else if (route.name === "departments") {
            iconName = "briefcase-outline";
            activeIconName = "briefcase";
            displayName = "Bölümler";
          } else if (route.name === "history") {
            iconName = "time-outline";
            activeIconName = "time";
            displayName = "Geçmiş";
          } else if (route.name === "profile") {
            iconName = "person-outline";
            activeIconName = "person";
            displayName = "Profil";
          }

          if (!["index", "departments", "history", "profile"].includes(route.name)) {
            return null;
          }

          if (isFocused) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.activeTabCapsule}
                activeOpacity={0.9}
              >
                <Ionicons name={activeIconName as any} size={18} color="#006C4D" />
                <Text style={styles.activeTabText}>{displayName}</Text>
              </TouchableOpacity>
            );
          } else {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.inactiveTab}
                activeOpacity={0.8}
              >
                <Ionicons name={iconName as any} size={18} color="#737784" />
                <Text style={styles.inactiveTabText}>{displayName}</Text>
              </TouchableOpacity>
            );
          }
        })}
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  const [token, setToken] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Auth flow states
  const [currentView, setCurrentView] = useState<"login" | "register" | "onboarding_slides" | "onboarding_form">("login");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Onboarding Slides states
  const [slideIndex, setSlideIndex] = useState(0);

  // Onboarding Form states
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Kadın");
  const [bloodType, setBloodType] = useState("A Rh(+)");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("user_token");
        const storedOnboarding = await AsyncStorage.getItem("user_onboarding_complete");
        setToken(storedToken);
        setOnboardingComplete(storedOnboarding === "true");
      } catch (err) {
        // Silent error
      } finally {
        setCheckingAuth(false);
      }
    };
    loadAuth();
  }, []);

  const handleLogin = async () => {
    if (!loginUsername || !loginPassword) {
      alert("Lütfen TC Kimlik numaranızı ve şifrenizi girin.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        await AsyncStorage.setItem("user_token", data.token);
        setToken(data.token);
        
        const meRes = await fetch("http://localhost:8000/api/auth/me?token=" + data.token);
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.profile && meData.profile.age > 0) {
            await AsyncStorage.setItem("user_onboarding_complete", "true");
            setOnboardingComplete(true);
          } else {
            setCurrentView("onboarding_slides");
          }
        } else {
          setCurrentView("onboarding_slides");
        }
      } else {
        alert(data.detail || "Giriş başarısız.");
      }
    } catch (err) {
      alert("Sunucuya bağlanılamadı. Çevrimdışı modda simüle ediliyor.");
      await AsyncStorage.setItem("user_token", "mock_token_123");
      setToken("mock_token_123");
      setCurrentView("onboarding_slides");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName || !regUsername || !regPassword || !regConfirmPassword) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          password: regPassword,
          role: "patient",
          name: regName
        })
      });
      const data = await res.json();
      if (res.ok) {
        await AsyncStorage.setItem("user_token", data.token);
        setToken(data.token);
        setCurrentView("onboarding_slides");
      } else {
        alert(data.detail || "Kayıt başarısız.");
      }
    } catch (err) {
      alert("Çevrimdışı modda simüle edilerek kayıt tamamlanıyor.");
      await AsyncStorage.setItem("user_token", "mock_token_123");
      setToken("mock_token_123");
      setCurrentView("onboarding_slides");
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async () => {
    if (!age || !weight || !height) {
      alert("Lütfen boy, kilo ve yaş bilgilerinizi giriniz.");
      return;
    }
    setLoading(true);
    try {
      const activeToken = token || (await AsyncStorage.getItem("user_token")) || "";
      const res = await fetch("http://localhost:8000/api/auth/onboarding?token=" + activeToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        await AsyncStorage.setItem("user_onboarding_complete", "true");
        setOnboardingComplete(true);
      } else {
        alert("Onboarding kaydedilemedi.");
      }
    } catch (err) {
      await AsyncStorage.setItem("user_onboarding_complete", "true");
      setOnboardingComplete(true);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003C90" />
      </View>
    );
  }

  // Render auth or onboarding overlay
  if (!token || !onboardingComplete) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.authContainer}>
          <ScrollView contentContainerStyle={styles.authScroll}>
            {currentView === "login" && (
              <View style={styles.authCard}>
                <View style={styles.logoWrapper}>
                  <Ionicons name="medical" size={32} color="#003C90" />
                  <Text style={styles.logoText}>CarePulse Patient</Text>
                </View>
                
                <Text style={styles.authTitle}>Hesabınıza Giriş Yapın</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>TC KİMLİK NO</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="card-outline" size={18} color="#737784" />
                    <TextInput 
                      value={loginUsername}
                      onChangeText={setLoginUsername}
                      placeholder="11 Haneli TC Kimlik"
                      placeholderTextColor="#737784"
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>ŞİFRE</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color="#737784" />
                    <TextInput 
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      placeholder="Şifreniz"
                      placeholderTextColor="#737784"
                      secureTextEntry
                      style={styles.textInput}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>{loading ? "Giriş Yapılıyor..." : "Giriş Yap"}</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.switchButton}
                  onPress={() => setCurrentView("register")}
                >
                  <Text style={styles.switchButtonText}>Hesabınız yok mu? <Text style={{fontWeight: "bold", color: "#003C90"}}>Kayıt Olun</Text></Text>
                </TouchableOpacity>
              </View>
            )}

            {currentView === "register" && (
              <View style={styles.authCard}>
                <View style={styles.logoWrapper}>
                  <Ionicons name="medical" size={32} color="#003C90" />
                  <Text style={styles.logoText}>CarePulse Kayıt</Text>
                </View>
                
                <Text style={styles.authTitle}>Yeni Hesap Oluşturun</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>AD SOYAD</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={18} color="#737784" />
                    <TextInput 
                      value={regName}
                      onChangeText={setRegName}
                      placeholder="Adınız Soyadınız"
                      placeholderTextColor="#737784"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>TC KİMLİK NO</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="card-outline" size={18} color="#737784" />
                    <TextInput 
                      value={regUsername}
                      onChangeText={setRegUsername}
                      placeholder="11 Haneli TC Kimlik"
                      placeholderTextColor="#737784"
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>ŞİFRE</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color="#737784" />
                    <TextInput 
                      value={regPassword}
                      onChangeText={setRegPassword}
                      placeholder="En az 6 karakter"
                      placeholderTextColor="#737784"
                      secureTextEntry
                      style={styles.textInput}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>ŞİFRE TEKRAR</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color="#737784" />
                    <TextInput 
                      value={regConfirmPassword}
                      onChangeText={setRegConfirmPassword}
                      placeholder="Şifrenizi tekrar girin"
                      placeholderTextColor="#737784"
                      secureTextEntry
                      style={styles.textInput}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>{loading ? "Kaydolunuyor..." : "Kayıt Ol ve Başlat"}</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.switchButton}
                  onPress={() => setCurrentView("login")}
                >
                  <Text style={styles.switchButtonText}>Zaten hesabınız var mı? <Text style={{fontWeight: "bold", color: "#003C90"}}>Giriş Yapın</Text></Text>
                </TouchableOpacity>
              </View>
            )}

            {currentView === "onboarding_slides" && (
              <View style={styles.authCard}>
                <Text style={styles.slideCounter}>ADIM {slideIndex + 1} / 3</Text>
                
                {slideIndex === 0 && (
                  <View style={styles.slideContent}>
                    <Ionicons name="sparkles" size={48} color="#003C90" />
                    <Text style={styles.slideTitle}>CarePulse AI Asistanı</Text>
                    <Text style={styles.slideText}>
                      Şikayetlerinizi doğal dille (sesli veya yazılı) asistanımıza anlatın. Yapay zekamız tıbbi bulguları analiz ederek sizi yönlendirir.
                    </Text>
                  </View>
                )}

                {slideIndex === 1 && (
                  <View style={styles.slideContent}>
                    <Ionicons name="git-pull-request" size={48} color="#006C4D" />
                    <Text style={styles.slideTitle}>Poliklinik Sevk Sistemi</Text>
                    <Text style={styles.slideText}>
                      AI yönlendirmesi doğrultusunda uygun hekimlerin saat dilimlerini listeleyebilir ve anında randevu kaydı oluşturabilirsiniz.
                    </Text>
                  </View>
                )}

                {slideIndex === 2 && (
                  <View style={styles.slideContent}>
                    <Ionicons name="shield-checkmark" size={48} color="#BA1A1A" />
                    <Text style={styles.slideTitle}>Proaktif İyileşme Takibi</Text>
                    <Text style={styles.slideText}>
                      Muayene sonrası iyileşme raporunuzu doldurarak hekiminizle paylaşın. Şiddetli bulgularda sisteme anında hekim takip alarmı iletilir.
                    </Text>
                  </View>
                )}

                <View style={styles.dotsRow}>
                  {[0,1,2].map((i) => (
                    <View key={i} style={[styles.dot, slideIndex === i && styles.dotActive]} />
                  ))}
                </View>

                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={() => {
                    if (slideIndex < 2) {
                      setSlideIndex(slideIndex + 1);
                    } else {
                      setCurrentView("onboarding_form");
                    }
                  }}
                >
                  <Text style={styles.primaryButtonText}>
                    {slideIndex < 2 ? "Sonraki Adım" : "Profil Kurulumuna Geç"}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {currentView === "onboarding_form" && (
              <View style={styles.authCard}>
                <Text style={styles.authTitle}>Sağlık Profilinizi Tamamlayın</Text>
                <Text style={styles.surveySubtitle}>
                  Size özel teşhis ve ön sevk kararları için biyometrik bilgilerinizi doldurun.
                </Text>

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
                    {["0 Rh(+)", "A Rh(+)", "B Rh(+)", "AB Rh(+)", "0 Rh(-)", "A Rh(-)", "B Rh(-)", "AB Rh(-)"].map((b) => (
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

                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: "#006C4D" }]}
                  onPress={handleOnboardingSubmit}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>{loading ? "Kaydediliyor..." : "Kurulumu Tamamla"}</Text>
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: "Chatbot" }} />
        <Tabs.Screen name="departments" options={{ title: "Bölümler" }} />
        <Tabs.Screen name="history" options={{ title: "Geçmiş" }} />
        <Tabs.Screen name="profile" options={{ title: "Profil" }} />
      </Tabs>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E7EEFF",
  },
  tabBar: {
    flexDirection: "row",
    height: 64,
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  activeTabCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#86F8C8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeTabText: {
    color: "#006C4D",
    fontSize: 12,
    fontWeight: "bold",
  },
  inactiveTab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  inactiveTabText: {
    color: "#737784",
    fontSize: 10,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9F9FF",
  },
  authContainer: {
    flex: 1,
    backgroundColor: "#F9F9FF",
  },
  authScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  authCard: {
    backgroundColor: "white",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E7EEFF",
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
    width: "100%",
  },
  logoWrapper: {
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111C2C",
  },
  authTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111C2C",
    textAlign: "center",
    marginBottom: 24,
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
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#111C2C",
    height: "100%",
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: "#003C90",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },
  switchButton: {
    marginTop: 16,
    alignItems: "center",
  },
  switchButtonText: {
    fontSize: 12,
    color: "#737784",
  },
  slideCounter: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#737784",
    textAlign: "center",
    letterSpacing: 1,
  },
  slideContent: {
    alignItems: "center",
    marginVertical: 24,
    gap: 12,
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111C2C",
    textAlign: "center",
  },
  slideText: {
    fontSize: 13,
    color: "#434653",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E7EEFF",
  },
  dotActive: {
    backgroundColor: "#003C90",
    width: 14,
  },
  surveySubtitle: {
    fontSize: 12,
    color: "#737784",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
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
});
