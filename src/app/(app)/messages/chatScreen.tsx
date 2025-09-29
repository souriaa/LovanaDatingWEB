import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
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
  getConversationCreatorAndMessageFirst,
  extendConversationTime,
} from "../../../../service/messageService";
import {
  getSupabaseFileUrl,
  uploadFile,
} from "../../../../service/imageService";
import { getInteractionByActorAndTarget } from "../../../../service/interactionService";
import Header from "@/components/Header";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SwipeableMessage } from "@/components/swipeable-message";
import * as DocumentPicker from "expo-document-picker";
import { Animated, TouchableWithoutFeedback } from "react-native";
import { useUnmatch } from "@/api/profiles";
import { Loader } from "@/components/loader";

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
  const [selectedFile, setSelectedFile] = useState(null);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef(null);
  const typingChannel = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetMessage, setSheetMessage] = useState(null);
  const [conversationInfo, setConversationInfo] = useState(null);

  const { height: screenHeight } = Dimensions.get("window");
  const [interactionId, setInteractionId] = useState(null);
  const [loadingConversationInfo, setLoadingConversationInfo] = useState(true);
  const [showExtendSheet, setShowExtendSheet] = useState(false);
  const { mutate } = useUnmatch();

  const headerHeight = 88;
  const height = screenHeight - headerHeight;
  const slideAnim = useRef(new Animated.Value(height)).current;

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

    setLoadingConversationInfo(true);
    getConversationCreatorAndMessageFirst(conversationId)
      .then(setConversationInfo)
      .catch(console.warn)
      .finally(() => setLoadingConversationInfo(false));
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

    const conversationChannel = supabase
      .channel(`public:conversations:id=eq.${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          setConversationInfo((prev) => ({
            ...prev,
            ...payload.new,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(seenChannel);
      supabase.removeChannel(conversationChannel);
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

  useEffect(() => {
    if (!userId || !otherUser?.id) return;

    const fetchInteractionId = async () => {
      const interaction = await getInteractionByActorAndTarget(
        userId,
        otherUser.id
      );
      setInteractionId(interaction.id);
    };

    fetchInteractionId();
  }, [userId, otherUser]);

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
    if (!text.trim() && !selectedFile) return;

    let fileData = null;

    if (selectedFile) {
      try {
        const res = await uploadFile("messages", selectedFile.uri, true);
        if (!res.success) throw new Error(res.msg);

        fileData = [res.data];
      } catch (err) {
        console.error("Failed to upload file:", err);
        return;
      }
    }

    try {
      const newMessage = await sendMessage({
        conversation_id: conversationId,
        sender_id: userId,
        body: text.trim(),
        files: fileData || [],
        reply_to_id: replyingTo?.id || null,
        creator_id: conversationInfo?.created_by,
      });

      setText("");
      setSelectedFile(null);
      setReplyingTo(null);
      inputRef.current?.clear();

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, { ...newMessage, reply_to: replyingTo || null }];
      });

      if (otherUser?.id) {
        await markConversationAsUnseen(conversationId, otherUser.id);
      }
    } catch (err) {
      console.error("Error sending message:", err.message || err);
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
  const TIME_SHOW_MS = 10 * 60 * 1000;

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

  const handleReply = (message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const openSheet = (message) => {
    setSheetMessage(message);
    setShowSheet(true);
    Animated.timing(slideAnim, {
      toValue: height * 0.65,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setShowSheet(false);
      setSheetMessage(null);
    });
  };

  const openHeaderSheet = () => {
    setSheetMessage(null);
    setShowSheet(true);
    Animated.timing(slideAnim, {
      toValue: height * 0.65,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const openExtendSheet = () => {
    setShowExtendSheet(true);
    Animated.timing(slideAnim, {
      toValue: height * 0.7,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const closeExtendSheet = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setShowExtendSheet(false);
    });
  };

  async function handleExtendTime(
    userId,
    conversationId,
    setConversationInfo,
    closeExtendSheet
  ) {
    if (!userId || !conversationId) {
      Alert.alert("Error", "Invalid user or conversation.");
      return;
    }
    try {
      const updatedConversation = await extendConversationTime(
        userId,
        conversationId
      );
      setConversationInfo((prev) => ({
        ...prev,
        expiration_at: updatedConversation.expiration_at,
      }));
      closeExtendSheet();
      Alert.alert("Success", "Conversation time extended by 24 hours!");
    } catch (err) {
      Alert.alert(
        "Failed",
        err.message || "Unable to extend time. Check your remaining extends."
      );
    }
  }

  const renderItem = ({ item, index }) => {
    const isMine = String(item.sender_id) === String(userId);

    let bubbleStyle = item.reply_to
      ? styles.singleBubble
      : item.isFirstInGroup && item.isLastInGroup
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

    const showTimestamp = item.showTime || toggledTimeIds.includes(item.id);

    const formatTimestamp = (dateStr) => {
      const date = new Date(dateStr);
      const now = new Date();

      const isSameDay =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isSameDay) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      const dayDiff = (now - date) / (1000 * 60 * 60 * 24);

      if (dayDiff < 7) {
        return `${date.toLocaleDateString("vi-VN", { weekday: "long" })} ${date.toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        )}`;
      }

      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <View>
        {showTimestamp && (
          <Text style={styles.timestamp}>
            {formatTimestamp(item.created_at)}
          </Text>
        )}

        <SwipeableMessage onReply={() => handleReply(item)} isMine={isMine}>
          <Pressable
            onPress={() => handleToggleTime(item.id)}
            onLongPress={() => openSheet(item)}
            delayLongPress={300}
          >
            {/* Reply Bubble */}
            {item.reply_to && (
              <View
                style={[
                  styles.messageContainer,
                  isMine ? styles.myMessageReply : styles.theirMessageReply,
                  styles.replyBubble,
                ]}
              >
                <Text style={styles.messageText}>
                  {item.reply_to.sender?.first_name}
                </Text>
                <Text
                  style={[
                    styles.messageText,
                    { color: theme.colors.textDarkGray },
                  ]}
                >
                  {item.reply_to.body}
                </Text>
              </View>
            )}

            {/* Image Preview from Supabase */}
            {item.files?.map((filePath, i) => (
              <View
                key={i}
                style={{
                  alignSelf: isMine ? "flex-end" : "flex-start",
                  marginTop: 5,
                }}
              >
                <Image
                  source={getSupabaseFileUrl(filePath)}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              </View>
            ))}

            {/* Message Bubble */}
            {!!item.body && (
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
            )}
          </Pressable>
        </SwipeableMessage>

        {/* Status Seen */}
        {index === 0 && statusText !== "" && (
          <View style={styles.statusSeen}>
            <Text style={styles.typingText}>{statusText}</Text>
          </View>
        )}
      </View>
    );
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const file = result.assets[0];
      setSelectedFile(file); // chỉ lưu file, chưa upload
    } catch (err) {
      console.error("Failed to pick file:", err);
    }
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
              <Pressable onPress={openHeaderSheet}>
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

          {/* Typing */}
          <View style={styles.statusTyping}>
            <Text style={styles.typingText}>
              {typingUsers.length > 0
                ? `${otherUser?.first_name.trim() || "Someone"} is typing...`
                : ""}
            </Text>
          </View>

          {/* Input */}
          {replyingTo && (
            <View style={styles.replyPreview}>
              <View style={styles.replyPreviewInfo}>
                <Text style={styles.replyAuthor}>
                  {replyingTo.sender?.first_name || "Unknown"}
                </Text>
                <Text style={styles.replyBody} numberOfLines={1}>
                  {replyingTo.body}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.colors.textDarkGray}
                />
              </TouchableOpacity>
            </View>
          )}
          <View style={{ marginBottom: 4 }}>
            {selectedFile && selectedFile.uri && (
              <View style={styles.filePreview}>
                <Image
                  source={{ uri: selectedFile.uri }}
                  style={styles.filePreviewImage}
                />
                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                  <Ionicons name="close-circle" size={20} color="red" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {loadingConversationInfo ? (
            <Loader />
          ) : conversationInfo?.status === false ? (
            <View style={styles.waitingContainer}>
              {conversationInfo?.created_by === userId ||
              conversationInfo?.first_message_sent ? (
                <Text style={styles.waitingText}>Response time is over</Text>
              ) : (
                <>
                  <Text style={styles.waitingText}>Response time is over</Text>
                  <TouchableOpacity
                    style={styles.extendBtn}
                    onPress={openExtendSheet}
                  >
                    <Text style={styles.extendBtnText}>
                      Extend{" "}
                      {otherUser?.first_name || otherUser?.last_name
                        ? `${otherUser?.first_name || ""} ${otherUser?.last_name || ""}`.trim()
                        : null}
                      's time
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : conversationInfo?.created_by === userId ||
            conversationInfo?.first_message_sent ? (
            <View style={styles.inputBar}>
              <TouchableOpacity
                onPress={handlePickFile}
                style={styles.uploadBtn}
              >
                <Ionicons
                  name="attach-outline"
                  size={28}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>

              <Input
                inputRef={inputRef}
                onChangeText={handleTextChange}
                placeholder="Message"
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
          ) : (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingText}>
                Waiting for{" "}
                {otherUser?.first_name || otherUser?.last_name
                  ? `${otherUser?.first_name || ""} ${otherUser?.last_name || ""}`.trim()
                  : null}{" "}
                to start the converation!
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
      {showSheet && (
        <TouchableWithoutFeedback onPress={closeSheet}>
          <View
            style={{
              position: "absolute",
              top: 88,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                top: slideAnim,
                width: "90%",
                height: height,
                backgroundColor: "white",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#ccc",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              {sheetMessage ? (
                <>
                  <Text
                    style={styles.sheetOption}
                    onPress={() => {
                      handleReply(sheetMessage);
                      closeSheet();
                    }}
                  >
                    Reply
                  </Text>
                  <Text
                    style={styles.sheetOption}
                    onPress={() => {
                      closeSheet();
                    }}
                  >
                    Copy
                  </Text>
                  <Text
                    style={styles.sheetOption}
                    onPress={() => {
                      closeSheet();
                    }}
                  >
                    Report
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={styles.sheetOption}
                    onPress={() => {
                      closeSheet();
                    }}
                  >
                    Report{" "}
                    {otherUser.first_name || otherUser.last_name
                      ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim()
                      : null}
                  </Text>
                  <Text
                    style={styles.sheetOption}
                    onPress={() => {
                      closeSheet();
                      const userName =
                        otherUser.first_name || otherUser.last_name
                          ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim()
                          : "this user";

                      Alert.alert(
                        "Are you sure?",
                        `Unmatching will delete the match for both you and ${userName}`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Unmatch",
                            onPress: async () => {
                              mutate(interactionId, {
                                onSuccess: async () => {
                                  router.navigate("/matches/");
                                },
                                onError: (err) => {
                                  Alert.alert(
                                    "Error",
                                    "Something went wrong, please try again later."
                                  );
                                },
                              });
                            },
                          },
                        ]
                      );
                    }}
                  >
                    Unmatch
                  </Text>
                </>
              )}
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      )}
      {showExtendSheet && (
        <TouchableWithoutFeedback onPress={closeExtendSheet}>
          <View
            style={{
              position: "absolute",
              top: 88,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                top: slideAnim,
                width: "90%", 
                height: height,
                backgroundColor: "white",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#ccc",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <View
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 100,
                    height: 100,
                  }}
                >
                  <Image
                    source={{ uri: otherUser.photo_url }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: theme.radius.round,
                    }}
                  />
                  <Ionicons
                    name="time-outline"
                    size={30}
                    style={{
                      backgroundColor: "white",
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      borderWidth: 1,
                      borderColor: "white",
                      borderRadius: theme.radius.round,
                    }}
                  />
                </View>
              </View>
              <Text style={styles.extendText}>
                Extend {otherUser?.first_name || otherUser?.last_name}'s
                response time by 24 hours?
              </Text>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 20,
                  justifyContent: "center",
                }}
              >
                <TouchableOpacity
                  style={styles.extendSheetButton}
                  onPress={() => {
                    handleExtendTime(
                      userId,
                      conversationId,
                      setConversationInfo,
                      closeExtendSheet
                    );
                  }}
                >
                  <Text style={styles.extendSheetButtonText}>Extend</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.extendSheetButton}
                  onPress={closeExtendSheet}
                >
                  <Text style={styles.extendSheetButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}

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
    marginTop: 20,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
    fontSize: 12,
  },
  messageContainer: {
    marginVertical: 1,
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
  },
  statusTyping: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
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
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.round,
  },
  replyContainer: {
    opacity: 0.8,
    backgroundColor: theme.colors.backgroundGray,
    flexShrink: 1,
  },
  replyAuthor: {
    fontWeight: "600",
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
  },
  replyBody: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
  },
  replyMine: {
    alignItems: "flex-end",
  },
  replyBubble: {
    marginBottom: -20,
    paddingBottom: 18,
  },
  myMessageReply: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.backgroundGray,
    opacity: 0.5,
    borderBottomRightRadius: 0,
  },
  theirMessageReply: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.backgroundGray,
    opacity: 0.5,
    borderBottomLeftRadius: 0,
  },
  replyPreview: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: theme.colors.backgroundLighterGray,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
    borderRadius: theme.radius.md,
    justifyContent: "space-between",
  },
  replyPreviewInfo: {},
  replyPreviewCloseBtn: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.round,
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    backgroundColor: theme.colors.backgroundLighterGray,
    borderRadius: theme.radius.md,
  },
  filePreviewImage: {
    width: 50,
    height: 50,
    borderRadius: theme.radius.sm,
    marginRight: 8,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  sheetOption: {
    fontSize: 16,
    paddingVertical: 10,
    fontFamily: "Poppins-Regular",
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  waitingText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: theme.colors.textLighterGray,
    textAlign: "center",
  },
  extendBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  extendBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
  },
  extendText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    marginTop: 10,
  },
  extendSheetButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  extendSheetButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
  },
});
