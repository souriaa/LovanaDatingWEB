import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Link, Redirect, router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../../constants/theme";
import { fetchConversations } from "../../../service/messageService";
import { useMyProfile } from "../../api/my-profile";
import { useLikes } from "../../api/profiles";
import { CountdownCircle } from "../../components/countdown-circle";
import { Loader } from "../../components/loader";
import { useAuth } from "../../store/auth";
import { EditProvider } from "../../store/edit";

export default function Layout() {
  const { session, isLoading } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: likes } = useLikes();
  const [conversations, setConversations] = useState([]);
  const [isHovered, setIsHovered] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!profile?.id) return;
    const data = await fetchConversations(profile.id);
    setConversations(data);
  }, [profile?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleAvatarPress = (conversation) => {
    console.log("Avatar pressed", conversation.id);
  };

  if (isLoading) return <Loader />;
  if (!session) return <Redirect href="/sign-in" />;

  return (
    <EditProvider>
      <View style={styles.container}>
        <View style={styles.leftPanel}>
          <View
            style={[styles.profileItem, { justifyContent: "space-between" }]}
          >
            <Pressable
              style={styles.homeButton}
              onPress={() => router.push("/")}
            >
              {/* <Ionicons
                name="home"
                size={30}
                color={theme.colors.primaryDark}
              /> */}
              <Text style={styles.homeButtonText}>Home</Text>
            </Pressable>
            <View style={{ flexDirection: "row" }}>
              <Link
                href="/preferences"
                suppressHighlighting
                style={{
                  padding: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="options-outline" size={30} />
              </Link>
            </View>
          </View>
          <View
            style={[styles.profileItem, { justifyContent: "space-between" }]}
          >
            <Pressable
              style={{ flexDirection: "row", alignItems: "center", gap: 20 }}
              onPress={() => router.push("/lovana")}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <Ionicons name="person-circle" size={60} color="#4b5563" />
              )}
              <Text style={styles.profileName}>{profile?.first_name}</Text>
            </Pressable>

            <View style={{ flexDirection: "row" }}>
              <Link
                href="/settings"
                suppressHighlighting
                style={{
                  padding: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="settings-outline" size={30} />
              </Link>
            </View>
          </View>

          <View style={styles.likesBox}>
            <Pressable
              style={styles.menuItemContainer}
              onPress={() => router.replace("/likes")}
            >
              <Text style={styles.menuItem}>Likes</Text>
              <Ionicons name="chevron-forward-outline" size={18} />
            </Pressable>

            {likes && likes.length > 0 ? (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                {likes.slice(0, 5).map((like, index) => (
                  <Pressable
                    key={like.id}
                    onPress={() =>
                      index === 0 && router.push(`/likes/${like.id}`)
                    }
                  >
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        source={{ uri: like.profile.photos[0]?.photo_url }}
                        style={{ width: 50, height: 50 }}
                      />
                      {index !== 0 && (
                        <BlurView
                          intensity={30}
                          tint="light"
                          style={{
                            ...StyleSheet.absoluteFillObject,
                            position: "absolute",
                            top: -20,
                            bottom: -20,
                            left: -20,
                            right: -20,
                            borderRadius: 25 + 20,
                          }}
                        />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.placeholderText}>No likes yet</Text>
            )}
          </View>

          <View style={styles.conversationsBox}>
            <Pressable
              style={styles.menuItemContainer}
              onPress={() => router.push("/matches")}
            >
              <Text style={styles.menuItem}>Matches</Text>
              <Ionicons name="chevron-forward-outline" size={18} />
            </Pressable>

            {conversations.length === 0 ? (
              <Text style={styles.placeholderText}>No conversations yet</Text>
            ) : (
              conversations.slice(0, 5).map((item) => {
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.conversationItem,
                      { backgroundColor: isHovered ? "#f0f0f0" : "#fff" },
                    ]}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onPress={() =>
                      router.push(
                        `messages/chatScreen?conversationId=${item.id}&userId=${profile?.id}`
                      )
                    }
                  >
                    <View style={{ position: "relative" }}>
                      {item.other_user?.photo_url && (
                        <CountdownCircle
                          conversationId={item.id}
                          createdAt={item.created_at}
                          expirationAt={item.expiration_at}
                          firstMessageSent={item.first_message_sent}
                          avatarUrl={item.other_user.photo_url}
                          size={60}
                          strokeWidth={3}
                          conversationStatus={item.conversation_status}
                          onPressAvatar={() => handleAvatarPress(item)}
                        />
                      )}
                      {item.is_seen && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.conversationName}>
                      {item.other_user?.first_name || "Unknown"}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.rightPanel}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="write-answer" />
            <Stack.Screen name="prompts" />
            <Stack.Screen name="preferences" />
          </Stack>
        </View>
      </View>
    </EditProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", width: "100vw", height: "100vh" },
  leftPanel: {
    width: "33.33%",
    backgroundColor: "#f9fafb",
    padding: 20,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    justifyContent: "flex-start",
  },
  rightPanel: { width: "66.66%", backgroundColor: "#fff" },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 20,
  },
  homeButtonText: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: theme.colors.primaryDark,
    paddingBottom: 2,
  },
  profileItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
  },
  avatar: { width: 60, height: 60, borderRadius: 50 },
  profileName: {
    fontSize: 18,
    color: theme.colors.textDark,
    fontFamily: "Poppins-Regular",
  },
  menuItem: {
    fontSize: 18,
    color: theme.colors.textDark,
    flex: 1,
    fontFamily: "Poppins-SemiBold",
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginVertical: 2,
    gap: 16,
  },
  conversationName: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textDark,
    fontFamily: "Poppins-Regular",
  },
  unreadDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryDark,
    borderWidth: 1,
    borderColor: "#fff",
  },
  likesBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  conversationsBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flex: 1,
  },
  menuItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  placeholderText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
    paddingBottom: 10,
  },
});
