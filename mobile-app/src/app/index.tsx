import React, { useState, useRef, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: string[];
}

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Merhaba! Ben CarePulse. Bugün size nasıl yardımcı olabilirim? Herhangi bir belirtiniz veya sağlık sorununuz var mı?",
      options: ["Başım ağrıyor", "Göğüs sıkışması var", "Randevularım"]
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  interface ReferralNotification {
    doctor: string;
    date: string;
    department: string;
  }
  
  const [notification, setNotification] = useState<ReferralNotification | null>(null);

  useEffect(() => {
    const checkReferrals = async () => {
      try {
        const token = await AsyncStorage.getItem("user_token") || "";
        const res = await fetch("http://localhost:8000/api/patients/1", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.referral_status === "CONFIRMED") {
            setNotification({
              doctor: data.referral_doctor || "Poliklinik Hekimi",
              date: data.referral_date || "Müsaitlik doğrultusunda",
              department: data.action?.recommended_dept || "Sevk Edilen Poliklinik"
            });
          } else {
            setNotification(null);
          }
        }
      } catch (err) {
        // Silent error
      }
    };
    checkReferrals();
    const interval = setInterval(checkReferrals, 6000);
    return () => clearInterval(interval);
  }, []);

  const backendUrl = "http://localhost:8000/api/chat";

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMessageId = Date.now().toString();
    const newUserMsg: Message = {
      id: userMessageId,
      sender: "user",
      text: textToSend
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: data.text,
            options: data.options
          }
        ]);
      } else {
        throw new Error("API error");
      }
    } catch (err) {
      // Offline fallback dialog response simulation
      setTimeout(() => {
        let botText = "Belirtilerinizi anladım. Sistem şu an çevrimdışı çalışıyor. Sizi Dahiliye polikliniğine yönlendiriyorum.";
        let opts: string[] = ["Randevu Al", "Yeniden Başlat"];
        
        const lowered = textToSend.toLowerCase();
        if (lowered.includes("başım") || lowered.includes("halsiz")) {
          botText = "Geçmiş olsun. Bu belirtiler ne zaman başladı? Ayrıca ateşiniz var mı?";
          opts = ["Ateşim var", "Bugün başladı", "Randevu al"];
        } else if (lowered.includes("ateş")) {
          botText = "Anladım. Ateş derecenizi ölçtünüz mü? Baş ağrınızın şiddeti nedir?";
          opts = ["Şiddetli Baş Ağrısı", "Hafif, geçici", "Geri Dön"];
        } else if (lowered.includes("şiddetli")) {
          botText = "Şikayetleriniz şiddetli baş ağrısı ve halsizliği işaret ediyor. Sizi Nöroloji departmanına yönlendirmemi ister misiniz?";
          opts = ["Nöroloji Randevusu Al", "AI Analizini Kaydet", "İptal Et"];
        } else if (lowered.includes("göğüs") || lowered.includes("sıkışma")) {
          botText = "Göğüs sıkışması kritik bir semptomdur. Sol kolda uyuşma veya nefes darlığı eşlik ediyor mu?";
          opts = ["Nefes darlığı var", "Sadece sıkışma", "Kardiyoloji Randevusu Al"];
        }

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: botText,
            options: opts
          }
        ]);
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.botIconWrapper}>
            <Ionicons name="medical" size={16} color="#003C90" />
          </View>
          <Text style={styles.headerTitle}>CarePulse</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerVoiceToggle}
          onPress={() => setIsVoiceMode(!isVoiceMode)}
        >
          <Ionicons 
            name={isVoiceMode ? "chatbubble-ellipses-outline" : "mic-outline"} 
            size={22} 
            color="#003C90" 
          />
        </TouchableOpacity>
      </View>

      {/* Dynamic Referral Notification Banner */}
      {notification && (
        <View style={styles.notificationBanner}>
          <View style={styles.notificationHeader}>
            <Ionicons name="notifications" size={18} color="#BA1A1A" />
            <Text style={styles.notificationTitle}>Sevk Randevunuz Onaylandı!</Text>
          </View>
          <Text style={styles.notificationText}>
            <Text style={{ fontWeight: "bold" }}>Bölüm: </Text>{notification.department}{"\n"}
            <Text style={{ fontWeight: "bold" }}>Hekim: </Text>{notification.doctor}{"\n"}
            <Text style={{ fontWeight: "bold" }}>Tarih/Saat: </Text>{notification.date}
          </Text>
          <TouchableOpacity 
            style={styles.notificationCloseButton}
            onPress={() => setNotification(null)}
          >
            <Text style={styles.notificationCloseText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {isVoiceMode ? (
          /* Voice Mode View */
          <View style={styles.voiceContainer}>
            <ScrollView 
              ref={scrollViewRef}
              style={styles.chatArea}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} onOptionClick={handleOptionClick} />
              ))}
              {loading && <ActivityIndicator size="small" color="#003C90" style={{ margin: 10 }} />}
            </ScrollView>
            
            {/* Wave animation and microphone indicators */}
            <View style={styles.voiceIndicatorWrapper}>
              <View style={styles.waveContainer}>
                <View style={[styles.waveBar, { height: 35 }]} />
                <View style={[styles.waveBar, { height: 50 }]} />
                <View style={[styles.waveBar, { height: 25 }]} />
                <View style={[styles.waveBar, { height: 60 }]} />
                <View style={[styles.waveBar, { height: 40 }]} />
                <View style={[styles.waveBar, { height: 30 }]} />
              </View>
              <View style={styles.voiceStatusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.voiceStatusText}>SANAL ASİSTAN AKTİF</Text>
              </View>
            </View>

            <View style={styles.voiceInputArea}>
              <TouchableOpacity style={styles.micCircleButton}>
                <Ionicons name="mic" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={() => {
                  handleSendMessage("Ateşim var ve halsizim"); // Simulated voice input text
                }}
              >
                <Ionicons name="paper-plane" size={22} color="#003C90" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Text Mode View */
          <View style={styles.textContainer}>
            <ScrollView 
              ref={scrollViewRef}
              style={styles.chatArea}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} onOptionClick={handleOptionClick} />
              ))}
              {loading && <ActivityIndicator size="small" color="#003C90" style={{ margin: 10 }} />}
            </ScrollView>

            {/* TextInput bar */}
            <View style={styles.textInputArea}>
              <TouchableOpacity style={styles.attachButton}>
                <Ionicons name="attach-outline" size={24} color="#737784" />
              </TouchableOpacity>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Mesajınızı buraya yazın..."
                placeholderTextColor="#737784"
                style={styles.textInput}
                onSubmitEditing={() => handleSendMessage(inputText)}
              />
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={() => handleSendMessage(inputText)}
              >
                <Ionicons name="paper-plane" size={22} color="#003C90" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ msg, onOptionClick }: { msg: Message, onOptionClick: (opt: string) => void }) {
  const isBot = msg.sender === "bot";

  return (
    <View style={styles.bubbleContainer}>
      <View style={[styles.messageRow, { justifyContent: isBot ? "flex-start" : "flex-end" }]}>
        {isBot && (
          <View style={styles.avatarBot}>
            <Ionicons name="logo-android" size={16} color="white" />
          </View>
        )}
        <View style={[
          styles.bubble, 
          isBot ? styles.botBubble : styles.userBubble
        ]}>
          <Text style={[styles.messageText, { color: isBot ? "#111C2C" : "white" }]}>
            {msg.text}
          </Text>
        </View>
        {!isBot && (
          <View style={styles.avatarUser}>
            <Ionicons name="person" size={16} color="white" />
          </View>
        )}
      </View>

      {/* Option pills directly below bot bubbles if provided */}
      {isBot && msg.options && msg.options.length > 0 && (
        <View style={styles.optionsRow}>
          {msg.options.map((opt, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.optionPill}
              onPress={() => onOptionClick(opt)}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9FF",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EEFF",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  botIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#E7EEFF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111C2C",
  },
  headerVoiceToggle: {
    padding: 6,
  },
  chatArea: {
    flex: 1,
    padding: 16,
  },
  bubbleContainer: {
    marginBottom: 16,
    width: "100%",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    maxWidth: "85%",
    alignSelf: "flex-start",
  },
  avatarBot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#003C90",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#737784",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  bubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: "#E7EEFF",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#003C90",
    borderBottomRightRadius: 4,
    alignSelf: "flex-end",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    paddingLeft: 40,
  },
  optionPill: {
    backgroundColor: "white",
    borderColor: "#003C90",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1,
  },
  optionText: {
    color: "#003C90",
    fontSize: 13,
    fontWeight: "600",
  },
  textContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  textInputArea: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E7EEFF",
    gap: 12,
  },
  attachButton: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#F9F9FF",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    color: "#111C2C",
    fontSize: 14,
  },
  sendButton: {
    padding: 4,
  },
  voiceContainer: {
    flex: 1,
  },
  voiceIndicatorWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    backgroundColor: "#F9F9FF",
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 80,
  },
  waveBar: {
    width: 6,
    backgroundColor: "#003C90",
    borderRadius: 3,
  },
  voiceStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#006C4D",
  },
  voiceStatusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#006C4D",
    letterSpacing: 1,
  },
  voiceInputArea: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E7EEFF",
  },
  micCircleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#003C90",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBanner: {
    backgroundColor: "#FEEBEB",
    borderWidth: 1,
    borderColor: "#FAD2D2",
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: "#BA1A1A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#BA1A1A",
  },
  notificationText: {
    fontSize: 11,
    color: "#434653",
    lineHeight: 16,
  },
  notificationCloseButton: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#FAD2D2",
    borderRadius: 8,
  },
  notificationCloseText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#BA1A1A",
  },
});
