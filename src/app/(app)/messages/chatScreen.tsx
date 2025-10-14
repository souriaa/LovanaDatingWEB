import * as DocumentPicker from "expo-document-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { theme } from "../../../../constants/theme";
import { uploadFile } from "../../../../service/imageService";
import { getInteractionByActorAndTarget } from "../../../../service/interactionService";
import {
  fetchConversationSeenStatus,
  fetchMessages,
  fetchOlderMessages,
  getConversationCreatorAndMessageFirst,
  getOtherUserInConversation,
  markConversationAsSeen,
  markConversationAsUnseen,
  sendMessage,
} from "../../../../service/messageService";
import { useUnmatch } from "../../../api/profiles";
import { useAlert } from "../../../components/alert-provider";
import { ChatHeader } from "../../../components/chat-header";
import { ExtendTimeSheet } from "../../../components/extend-time-sheet";
import { FilePreview } from "../../../components/file-preview";
import { InputBar } from "../../../components/input-bar";
import { Loader } from "../../../components/loader";
import { MessageList } from "../../../components/message-list";
import { MessageSheet } from "../../../components/message-sheet";
import { ReplyPreview } from "../../../components/reply-preview";
import { TypingIndicator } from "../../../components/typing-indicator";
import { WaitingContainer } from "../../../components/waiting-container";
import { supabase } from "../../../lib/supabase";

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
  const [isSending, setIsSending] = useState(false);

  const [hasMore, setHasMore] = useState(true);

  const headerHeight = 88;
  const height = screenHeight - headerHeight;
  const slideAnim = useRef(new Animated.Value(height)).current;

  const { showAlert } = useAlert();

  const { mutate } = useUnmatch();

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
            otherUser: { is_seen: payload.new.is_seen },
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

    if (lastMessage.sender_id === userId) {
      if (seenStatus.otherUser) {
        setStatusText(seenStatus.otherUser.is_seen ? "Seen" : "Sent");
      } else {
        setStatusText("Sent");
      }
    } else {
      setStatusText("");
    }
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

  const handleTextChange = (value: string) => {
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
    if (isSending) return;
    if (!text.trim() && !selectedFile) return;

    setIsSending(true);

    let fileData = null;

    if (selectedFile) {
      try {
        const res = await uploadFile("messages", selectedFile.uri, true);
        if (!res.success) throw new Error(res.msg);
        fileData = [res.data];
      } catch (err) {
        console.error("Failed to upload file:", err);
        setIsSending(false);
        return;
      }
    }

    const replyMessage = replyingTo || null; // <-- store before clearing

    try {
      const newMessage = await sendMessage({
        conversation_id: conversationId,
        sender_id: userId,
        body: text.trim(),
        files: fileData || [],
        reply_to_id: replyMessage?.id || null,
        creator_id: conversationInfo?.created_by,
      });

      setText("");
      setSelectedFile(null);
      setReplyingTo(null);
      inputRef.current?.clear();

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, { ...newMessage, reply_to: replyMessage }];
      });

      setIsSending(false);

      if (otherUser?.id) {
        await markConversationAsUnseen(conversationId, otherUser.id);
      }
    } catch (err) {
      console.error("Error sending message:", err.message || err);
      setIsSending(false);
    }
  };

  const handleToggleTime = (messageId: string) => {
    setToggledTimeIds((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  async function getAIResponse(messages, userId) {
    const sortedMessages = messages.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const latest10Messages = sortedMessages.slice(-10);

    const formattedMessages = latest10Messages.map((msg) => ({
      sender_id: msg.sender_id === userId ? "Me" : "Them",
      body: msg.body,
    }));

    const conversationText = formattedMessages
      .map((m) => `${m.sender_id}: ${m.body}`)
      .join("\n");

    const prompt = `
Bạn đang giúp tạo một câu trả lời ngắn, tự nhiên cho một người (sender_id: Me) trong một cuộc trò chuyện giữa hai người (Me và Them). Giữ câu trả lời thân thiện, tự nhiên, gần gũi. Chỉ viết câu tiếp theo mà sender_id Me sẽ nói.Cuộc trò chuyện: ${conversationText}
Câu trả lời cho sender_id Me:
  `.trim();

    try {
      const response = await fetch(
        "https://sewuxuattigekhjtdasv.functions.supabase.co/AIReplySuggestion",
        {
          method: "POST",
          body: JSON.stringify(prompt),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data?.body) {
        setText(data.body);
      }
    } catch (err) {
      console.error("Failed to fetch AI reply:", err);
    }

    return { messages: formattedMessages };
  }

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

  const handleReply = (message: any) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const openSheet = (message: any) => {
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

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const file = result.assets[0];
      setSelectedFile(file);
    } catch (err) {
      console.error("Failed to pick file:", err);
    }
  };

  const handleCopy = () => {
    closeSheet();
  };

  const handleReportUser = () => {
    closeSheet();
    router.push({
      pathname: "/report/report",
      params: {
        reportedId: otherUser.id,
      },
    });
  };

  const handleReportMessage = () => {
    closeSheet();
    router.push({
      pathname: "/report/report",
      params: {
        reportedId: otherUser.id,
        reportedMessageId: sheetMessage.id,
        reportedMessageBody: sheetMessage.body,
      },
    });
  };

  const handleUnmatch = () => {
    closeSheet();

    const userName =
      otherUser.first_name || otherUser.last_name
        ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim()
        : "this user";

    showAlert({
      title: "Are you sure?",
      message: `Unmatching will delete the match for both you and ${userName}`,
      buttons: [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: async () => {
            mutate(interactionId, {
              onSuccess: async () => {
                router.navigate("/matches/");
              },
              onError: (err) => {
                showAlert({
                  title: "Error",
                  message: "Something went wrong, please try again later.",
                  buttons: [{ text: "OK", style: "cancel" }],
                });
              },
            });
          },
        },
      ],
    });
  };

  const loadOlderMessages = async () => {
    if (!messages.length || !hasMore) return;

    const oldestMessageId = messages[0].id;
    try {
      const olderMessages = await fetchOlderMessages(
        conversationId,
        oldestMessageId
      );
      if (!olderMessages || olderMessages.length === 0) setHasMore(false);

      setMessages((prev) => [...olderMessages, ...prev]);
    } catch (err) {
      console.error("Failed to load older messages:", err);
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
            <ChatHeader
              otherUser={otherUser}
              currentUserId={userId}
              onOptionsPress={openHeaderSheet}
            />
          )}

          {/* Chat */}
          <MessageList
            messages={displayed}
            userId={userId as string}
            onReply={handleReply}
            onToggleTime={handleToggleTime}
            onLongPress={openSheet}
            statusText={statusText}
            hasMore={hasMore}
            loadOlderMessages={loadOlderMessages}
            toggledTimeIds={toggledTimeIds}
          />

          {/* Typing */}
          <TypingIndicator typingUsers={typingUsers} otherUser={otherUser} />

          {/* Reply Preview */}
          {replyingTo && (
            <ReplyPreview
              replyingTo={replyingTo}
              onCancel={() => setReplyingTo(null)}
            />
          )}

          {/* File Preview */}
          <View>
            {selectedFile && selectedFile.uri && (
              <FilePreview
                selectedFile={selectedFile}
                onRemove={() => setSelectedFile(null)}
              />
            )}
          </View>

          {/* Conditional Input or Waiting */}
          {loadingConversationInfo ? (
            <Loader />
          ) : conversationInfo?.status === false ? (
            <WaitingContainer
              conversationInfo={conversationInfo}
              otherUser={otherUser}
              userId={userId as string}
              onExtendPress={openExtendSheet}
            />
          ) : conversationInfo?.created_by === userId ||
            conversationInfo?.first_message_sent ? (
            <InputBar
              onPickFile={handlePickFile}
              inputRef={inputRef}
              onTextChange={handleTextChange}
              onSend={handleSend}
              isSending={isSending}
              onAIResponse={async (done) => {
                try {
                  const success = await getAIResponse(messages, userId);
                  done(success);
                } catch (err) {
                  done(false);
                }
              }}
              value={text}
              currentUser={userId}
            />
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

      {/* Message Sheet */}
      {showSheet && (
        <MessageSheet
          sheetMessage={sheetMessage}
          otherUser={otherUser}
          onReply={handleReply}
          onCopy={handleCopy}
          onReportUser={handleReportUser}
          onReportMessage={handleReportMessage}
          onUnmatch={handleUnmatch}
          onClose={closeSheet}
          slideAnim={slideAnim}
          height={height}
        />
      )}

      {/* Extend Sheet */}
      {showExtendSheet && (
        <ExtendTimeSheet
          otherUser={otherUser}
          onCancel={closeExtendSheet}
          slideAnim={slideAnim}
          height={height}
          userId={userId as string}
          conversationId={conversationId as string}
          setConversationInfo={setConversationInfo}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
});
