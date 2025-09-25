import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Input from "../../../components/Input";
import { theme } from "../../../../constants/theme";
import { supabase } from "../../../lib/supabase";
import {
  fetchConversationSeenStatus,
  fetchMessages,
  getOtherUserInConversation,
  markConversationAsSeen,
  markConversationAsUnseen,
  sendMessage,
} from "../../../../service/messageService";
import Header from "@/components/Header";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

export default function ChatScreen() {
  const { conversationId, userId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);
  const [seenStatus, setSeenStatus] = useState({
    currentUser: null,
    otherUser: null,
  });
  const [statusText, setStatusText] = useState("");
  const [toggledTimeIds, setToggledTimeIds] = useState([]);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef(null);
  const typingChannel = useRef(null);

  // --- Fetch messages ---
  const getMessages = async () => {
    try {
      const data = await fetchMessages(conversationId);
      setMessages(data || []);
    } catch (err) {
      console.warn("Failed to fetch messages:", err);
    }
  };

  useEffect(() => {
    if (!conversationId || !userId) return;
    getOtherUserInConversation(conversationId, userId)
      .then(setOtherUser)
      .catch(console.warn);
  }, [conversationId, userId]);

  useEffect(() => {
    if (!conversationId) return;
    getMessages();

    const messagesChannel = supabase
      .channel(`public:messages:conversation_id=eq.${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => String(m.id) === String(payload.new.id))
              ? prev
              : [...prev, payload.new]
          );
        }
      )
      .subscribe();

    const seenChannel = supabase
      .channel(
        `public:conversation_members:conversation_id=eq.${conversationId}`
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_members",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setSeenStatus((prev) => ({
            ...prev,
            otherUser: { isSeen: payload.new.isSeen },
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(seenChannel);
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !userId) return;
    typingChannel.current = supabase
      .channel(`typing:conversation_id=eq.${conversationId}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        const { userId: otherId, isTyping } = payload.payload;
        if (otherId === userId) return;
        setTypingUsers((prev) => {
          if (isTyping && !prev.includes(otherId)) return [...prev, otherId];
          if (!isTyping) return prev.filter((id) => id !== otherId);
          return prev;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(typingChannel.current);
  }, [conversationId, userId]);

  useEffect(() => {
    if (conversationId && userId && otherUser?.id) {
      fetchConversationSeenStatus(conversationId, userId, otherUser.id)
        .then(setSeenStatus)
        .catch(console.warn);
    }
  }, [conversationId, userId, otherUser?.id]);

  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;
  useEffect(() => {
    if (!lastMessage) return;
    setStatusText(
      lastMessage.sender_id === userId
        ? seenStatus.otherUser?.isSeen
          ? "Seen"
          : "Sent"
        : ""
    );
  }, [lastMessage, seenStatus, userId]);

  useFocusEffect(
    useCallback(() => {
      if (conversationId && userId)
        markConversationAsSeen(conversationId, userId).catch(console.error);
    }, [conversationId, userId])
  );

  useEffect(() => {
    if (lastMessage && lastMessage.sender_id !== userId)
      markConversationAsSeen(conversationId, userId).catch(console.error);
  }, [lastMessage, conversationId, userId]);

  const handleTextChange = (value) => {
    setText(value);
    if (!isTyping && userId) {
      setIsTyping(true);
      typingChannel.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId, isTyping: true },
      });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      typingChannel.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId, isTyping: false },
      });
    }, 1500);
  };

  const handleSend = async () => {
    if (!text.trim() || !userId || !conversationId) return;
    try {
      await sendMessage({
        conversation_id: conversationId,
        sender_id: userId,
        body: text.trim(),
      });
      setText("");
      inputRef.current?.clear();
      if (otherUser?.id)
        await markConversationAsUnseen(conversationId, otherUser.id);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleToggleTime = (messageId) => {
    setToggledTimeIds((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  // --- Group messages ---
  const GROUP_WINDOW_MS = 2 * 60 * 1000;
  const TIME_SHOW_MS = 30 * 60 * 1000;

  const annotated = useMemo(() => {
    const sorted = [...messages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return sorted.map((m, i, arr) => {
      const prev = i > 0 ? arr[i - 1] : null;
      const next = i < arr.length - 1 ? arr[i + 1] : null;
      const sameAsPrev =
        prev &&
        String(prev.sender_id) === String(m.sender_id) &&
        new Date(m.created_at) - new Date(prev.created_at) <= GROUP_WINDOW_MS;
      const sameAsNext =
        next &&
        String(next.sender_id) === String(m.sender_id) &&
        new Date(next.created_at) - new Date(m.created_at) <= GROUP_WINDOW_MS;
      const showTime =
        !prev ||
        new Date(m.created_at).getTime() -
          new Date(prev.created_at).getTime() >=
          TIME_SHOW_MS;

      return {
        ...m,
        isFirstInGroup: !sameAsPrev,
        isLastInGroup: !sameAsNext,
        showTime,
      };
    });
  }, [messages]);
  const displayed = useMemo(() => [...annotated].reverse(), [annotated]);

  const renderItem = ({ item, index }) => {
    const isMine = String(item.sender_id) === String(userId);

    // kiểu bubble
    let bubbleStyle =
      item.isFirstInGroup && item.isLastInGroup
        ? styles.singleBubble
        : item.isFirstInGroup
          ? isMine
            ? styles.firstBubbleMine
            : styles.firstBubble
          : item.isLastInGroup
            ? isMine
              ? styles.lastBubbleMine
              : styles.lastBubble
            : isMine
              ? styles.middleBubbleMine
              : styles.middleBubble;

    // kiểm tra xem đây có phải message cuối cùng
    // const isLastMessage = index === 0; // nếu dùng inverted FlatList, index 0 là message cuối cùng
    // nếu không inverted, dùng: index === messages.length - 1

    const showTimestamp = item.showTime || toggledTimeIds.includes(item.id);

    return (
      <View>
        {showTimestamp && (
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        )}

        <Pressable onPress={() => handleToggleTime(item.id)}>
          <View
            style={[
              styles.messageContainer,
              isMine ? styles.myMessage : styles.theirMessage,
              bubbleStyle,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                {
                  color: isMine
                    ? theme.colors.textLight
                    : theme.colors.textDarkGray,
                },
              ]}
            >
              {item.body}
            </Text>
          </View>
        </Pressable>

        {index === 0 && statusText !== "" && (
          <View style={styles.statusSeen}>
            <Text style={styles.typingText}>{statusText}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 32}
      >
        <View style={styles.container}>
          {/* Header */}
          {otherUser && (
            <View style={styles.headerContainer}>
              <Header style={styles.header}>
                <Image
                  source={{ uri: otherUser.photo_url }}
                  style={styles.headerAvatar}
                />
                <Text style={styles.headerName}>
                  {otherUser.first_name || otherUser.last_name
                    ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim()
                    : null}
                </Text>
              </Header>
              <Pressable onPress={() => router.push("")}>
                <Ionicons
                  name="ellipsis-vertical"
                  size={28}
                  color={theme.colors.textDarkGray}
                />
              </Pressable>
            </View>
          )}

          {/* Chat */}
          <FlatList
            ref={flatListRef}
            data={displayed}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            inverted
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 10,
              flexGrow: 1,
              justifyContent: "flex-end",
            }}
          />

          {/* Typing & seen */}
          <View style={styles.statusTyping}>
            <Text style={styles.typingText}>
              {typingUsers.length > 0
                ? `${otherUser?.first_name || "Someone"} is typing...`
                : ""}
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputBar}>
            <Input
              inputRef={inputRef}
              onChangeText={handleTextChange}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.textLighterGray}
              containerStyle={styles.input}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Ionicons
                name="send-outline"
                size={28}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const { height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderColor: theme.colors.backgroundGray,
  },
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: theme.colors.backgroundGray,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.backgroundGray,
    marginLeft: 20,
  },
  headerName: {
    fontSize: 18,
    color: theme.colors.textDarkGray,
    fontFamily: "Poppins-Regular",
  },
  timestamp: {
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.xxl,
    maxWidth: "80%",
    flexShrink: 1,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.primary,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.backgroundGray,
  },
  singleBubble: {
    borderRadius: theme.radius.xxl,
    marginVertical: 6,
  },
  firstBubble: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xxl,
    borderBottomLeftRadius: theme.radius.xxs,
    borderBottomRightRadius: theme.radius.xxl,
    marginTop: 6,
  },
  middleBubble: {
    borderTopLeftRadius: theme.radius.xxs,
    borderTopRightRadius: theme.radius.xxl,
    borderBottomLeftRadius: theme.radius.xxs,
    borderBottomRightRadius: theme.radius.xxl,
  },
  lastBubble: {
    borderTopLeftRadius: theme.radius.xxs,
    borderTopRightRadius: theme.radius.xxl,
    borderBottomLeftRadius: theme.radius.xl1,
    borderBottomRightRadius: theme.radius.xxl,
    marginBottom: 6,
  },
  firstBubbleMine: {
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xl1,
    borderBottomLeftRadius: theme.radius.xxl,
    borderBottomRightRadius: theme.radius.xxs,
    marginTop: 6,
  },
  middleBubbleMine: {
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxs,
    borderBottomLeftRadius: theme.radius.xxl,
    borderBottomRightRadius: theme.radius.xxs,
  },
  lastBubbleMine: {
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxs,
    borderBottomLeftRadius: theme.radius.xxl,
    borderBottomRightRadius: theme.radius.xl1,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    flexWrap: "wrap",
    fontFamily: "Poppins-Regular",
  },
  statusSeen: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  statusTyping: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  typingText: {
    fontSize: 13,
    color: theme.colors.textLighterGray,
    fontFamily: "Poppins-Regular",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: theme.colors.backgroundGray,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.backgroundLighterGray,
    paddingHorizontal: 12,
  },
  sendBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.round,
  },
});
