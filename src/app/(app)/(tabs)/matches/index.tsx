import { supabase } from "@/lib/supabase";
import { router, Stack, useFocusEffect } from "expo-router";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import { Loader } from "@/components/loader";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { theme } from "../../../../../constants/theme";
import { getProfile } from "../../../../../service/userService";
import { fetchConversations } from "../../../../../service/messageService";
import { CountdownCircle } from "@/components/countdown-circle";

const ConversationRow = React.memo(({ item, userId }) => {
  const otherUser = item.other_user || {};
  const seen = item.is_seen;

  const formatTimeAgo = (createdAt) => {
    const created = moment(createdAt);
    const now = moment();

    if (created.isSame(now, "day")) {
      return created.format("h:mm A");
    } else if (created.isSame(now.clone().subtract(1, "day"), "day")) {
      return "Yesterday";
    } else if (created.isSame(now, "week")) {
      return created.format("dddd");
    } else {
      return created.format("MMM D");
    }
  };

  const handlePress = useCallback(() => {
    if (!userId) return;
    router.push(
      `messages/chatScreen?conversationId=${item.id}&userId=${userId}`
    );
  }, [item.id, userId]);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      layout={LinearTransition}
      style={styles.itemWrapper}
    >
      <TouchableOpacity style={styles.item} onPress={handlePress}>
        <View style={styles.left}>
          <CountdownCircle
            createdAt={item.created_at}
            expirationAt={item.expiration_at}
            firstMessageSent={item.first_message_sent}
            avatarUrl={otherUser.photo_url}
            size={60}
            strokeWidth={5}
          ></CountdownCircle>
          {!seen && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.messageContainer}>
          <Text style={[styles.name, !seen && styles.unreadText]}>
            {otherUser.first_name || otherUser.last_name
              ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim()
              : "Unknown"}
          </Text>
          <View style={styles.metaRow}>
            <Text
              style={[
                styles.messagePreview,
                styles.lastMessage,
                !seen && styles.unreadText,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.last_message
                ? item.last_message.body && item.last_message.body.length > 0
                  ? item.last_message.sender_id === userId
                    ? `You: ${item.last_message.body}`
                    : item.last_message.body
                  : item.last_message.sender_id === userId
                    ? "You: Send an image"
                    : "Send an image"
                : "No message yet"}
            </Text>
            <Text>
              {item.last_message ? (
                <>
                  <Text style={[styles.dot, !seen && styles.unreadText]}>
                    {" "}
                    •{" "}
                  </Text>
                  <Text style={[styles.time, !seen && styles.unreadText]}>
                    {formatTimeAgo(item.last_message.created_at)}
                  </Text>
                </>
              ) : null}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function ConversationsScreen() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const CustomHeader = () => {
    return (
      <Stack.Screen
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "white" },
        }}
      />
    );
  };

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      const currentUser = await getProfile();
      if (mounted) setUser(currentUser);
    };
    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const messageSub = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new;
          if (newMessage.sender_id !== user.id) {
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === newMessage.conversation_id
                  ? { ...conv, isSeen: false, last_message: newMessage }
                  : conv
              )
            );
          }
        }
      )
      .subscribe();

    const memberSub = supabase
      .channel("public:conversation_members")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_members" },
        (payload) => {
          const updatedMember = payload.new;

          if (updatedMember.userId === user.id) {
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === updatedMember.conversationId
                  ? { ...conv, isSeen: updatedMember.isSeen }
                  : conv
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSub);
      supabase.removeChannel(memberSub);
    };
  }, [user]);

  const getConversations = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      let data = await fetchConversations(user.id);

      data.sort((a, b) => {
        const aTime = a.last_message ? new Date(a.last_message.created_at) : 0;
        const bTime = b.last_message ? new Date(b.last_message.created_at) : 0;
        return bTime - aTime;
      });

      setConversations(data);
      setError(null);
    } catch (err) {
      console.warn("Failed to fetch conversations:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) getConversations();
    }, [user, getConversations])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await getConversations();
    setRefreshing(false);
  }, [getConversations]);

  const renderItem = useCallback(
    ({ item }) =>
      user ? <ConversationRow item={item} userId={user.id} /> : null,
    [user]
  );

  return (
    <View style={styles.container} className="gap-5 bg-white">
      <CustomHeader />
      <Text className="text-3xl font-poppins-semibold">Matches</Text>
      {!user ? (
        <Loader />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            !refreshing && (
              <View style={styles.emptyContainer}>
                {isLoading ? (
                  <Loader />
                ) : (
                  <Text style={styles.noData}>No conversations yet</Text>
                )}
              </View>
            )
          }
          ListFooterComponent={
            error && <Text style={styles.errorText}>Error: {error}</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 2,
    borderColor: theme.colors.backgroundGray,
    gap: 12,
    marginBottom: 5,
  },
  itemWrapper: {
    marginBottom: 5,
  },
  left: { position: "relative" },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.backgroundGray,
  },
  messageContainer: { flex: 1 },
  name: {
    fontSize: 16,
    color: theme.colors.textDark,
    fontFamily: "Poppins-Regular",
  },
  lastMessage: {
    color: "gray",
    fontSize: 16,
    fontFamily: "Poppins-Regular",
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: "white",
  },
  unreadText: {
    color: theme.colors.primary,
    fontFamily: "Poppins-Bold",
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  noData: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: "center",
    marginTop: 20,
    fontFamily: "Poppins-SemiBold",
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error || "red",
    textAlign: "center",
    marginTop: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  messagePreview: {
    flexShrink: 1,
    minWidth: 0,
  },
  dot: {
    marginHorizontal: 4,
    color: "gray",
  },
  time: {
    color: "gray",
    fontFamily: "Poppins-Regular",
  },
});
