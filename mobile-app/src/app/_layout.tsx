import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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

          // If the route name is not one of our main tabs (e.g. explore or internal pages), skip it
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
});
