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
  ActivityIndicator,
  Animated
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch, MOCK_TOKEN } from "@/lib/api";
import { useAuth } from "@/context/auth";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: string[];
}

// Rotating phrases for the simulated voice dictation demo.
const DEMO_DICTATION_PHRASES = [
  "Ateşim var ve halsizim",
  "Başım ağrıyor ve midem bulanıyor",
  "Göğsümde baskı hissediyorum",
  "Öksürüğüm var ve nefes almakta zorlanıyorum"
];

const WAVE_BASE_HEIGHTS = [35, 50, 25, 60, 40, 30];

export default function ChatbotScreen() {
  const { profile, token } = useAuth();
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
    // Mock-token / guest mode has no backend identity: skip polling entirely
    // to avoid silent 401 spam every 6 seconds.
    if (!profile || token === MOCK_TOKEN) return;
    const patientId = profile.id;
    const checkReferrals = async () => {
      try {
        const res = await apiFetch(`/api/patients/${patientId}`);
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
  }, [profile, token]);

  // Stable chat session id: real patient id when authenticated, random guest id otherwise.
  const guestSessionRef = useRef(`guest-${Math.random().toString(36).slice(2, 10)}`);
  const sessionId = profile ? `patient-${profile.id}` : guestSessionRef.current;

  // --- Simulated voice dictation (demo) ---
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const phraseIndexRef = useRef(0);
  const listenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waveAnims = useRef(WAVE_BASE_HEIGHTS.map(() => new Animated.Value(0))).current;
  const micPulse = useRef(new Animated.Value(1)).current;

  const stopListeningAnimations = () => {
    waveAnims.forEach((anim) => {
      anim.stopAnimation();
      anim.setValue(0);
    });
    micPulse.stopAnimation();
    micPulse.setValue(1);
  };

  const startListeningAnimations = () => {
    waveAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 220 + i * 55, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0, duration: 220 + i * 55, useNativeDriver: false })
        ])
      ).start();
    });
    Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1, duration: 500, useNativeDriver: true })
      ])
    ).start();
  };

  const handleMicPress = () => {
    if (isListening) {
      // Cancel the ongoing "listening" session.
      if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
      stopListeningAnimations();
      setIsListening(false);
      return;
    }
    setIsListening(true);
    startListeningAnimations();
    listenTimeoutRef.current = setTimeout(() => {
      const phrase = DEMO_DICTATION_PHRASES[phraseIndexRef.current % DEMO_DICTATION_PHRASES.length];
      phraseIndexRef.current += 1;
      setTranscript(phrase);
      stopListeningAnimations();
      setIsListening(false);
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
    };
  }, []);

  const handleSendTranscript = () => {
    const text = transcript.trim();
    if (!text || isListening) return;
    setTranscript("");
    handleSendMessage(text);
  };

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
      const response = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: textToSend, session_id: sessionId })
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
                {WAVE_BASE_HEIGHTS.map((h, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height: isListening
                          ? waveAnims[i].interpolate({ inputRange: [0, 1], outputRange: [h * 0.4, h] })
                          : h,
                        backgroundColor: isListening ? "#BA1A1A" : "#003C90"
                      }
                    ]}
                  />
                ))}
              </View>
              <View style={styles.voiceStatusContainer}>
                <View style={[styles.statusDot, isListening && { backgroundColor: "#BA1A1A" }]} />
                <Text style={[styles.voiceStatusText, isListening && { color: "#BA1A1A" }]}>
                  {isListening ? "DİNLENİYOR..." : "SANAL ASİSTAN AKTİF"}
                </Text>
              </View>
              <Text style={styles.voiceHintText}>(Demo dikte)</Text>
            </View>

            {/* Editable transcript bubble filled by the simulated dictation */}
            {transcript !== "" && !isListening && (
              <View style={styles.transcriptBubble}>
                <Text style={styles.transcriptLabel}>Algılanan metin — düzenleyip gönderebilirsiniz:</Text>
                <TextInput
                  value={transcript}
                  onChangeText={setTranscript}
                  multiline
                  style={styles.transcriptInput}
                  placeholder="Dikte metni..."
                  placeholderTextColor="#737784"
                />
              </View>
            )}

            <View style={styles.voiceInputArea}>
              <Animated.View style={{ transform: [{ scale: micPulse }] }}>
                <TouchableOpacity
                  style={[styles.micCircleButton, isListening && { backgroundColor: "#BA1A1A" }]}
                  onPress={handleMicPress}
                >
                  <Ionicons name={isListening ? "stop" : "mic"} size={24} color="white" />
                </TouchableOpacity>
              </Animated.View>
              <TouchableOpacity
                style={[styles.sendButton, (!transcript.trim() || isListening) && { opacity: 0.4 }]}
                disabled={!transcript.trim() || isListening}
                onPress={handleSendTranscript}
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
  voiceHintText: {
    fontSize: 10,
    color: "#737784",
    marginTop: 4,
  },
  transcriptBubble: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#E7EEFF",
    borderWidth: 1,
    borderColor: "#C3C6D5",
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  transcriptLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#003C90",
    letterSpacing: 0.3,
  },
  transcriptInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E7EEFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111C2C",
    minHeight: 40,
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
