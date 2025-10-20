import { useUnmatch } from "@/api/profiles";
import { Empty } from "@/components/empty";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, Stack, useFocusEffect } from "expo-router";
import moment from "moment";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ReAnimated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { getInteractionByActorAndTarget } from "~/service/interactionService";
import { getActivePlanByUserId } from "~/service/profilePlanService";
import { theme } from "../../../../../constants/theme";
import {
  getCompatibilityMembersInfo,
  getConversationCompatibility,
  setConversationCompatibility,
} from "../../../../../service/compatibilityAIService";
import {
  deleteConversationById,
  extendConversationTime,
  fetchConversations,
} from "../../../../../service/messageService";
import { getProfile } from "../../../../../service/userService";
import { useAlert } from "../../../../components/alert-provider";
import { CountdownCircle } from "../../../../components/countdown-circle";
import { Loader } from "../../../../components/loader";
import { supabase } from "../../../../lib/supabase";

const ConversationRow = React.memo(
  ({
    item,
    userId,
    setSheetConversation,
    setShowSheet,
    slideAnim,
    height,
    onAvatarPress,
  }) => {
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

    const handleLongPress = () => {
      setSheetConversation(item);
      setShowSheet(true);
      Animated.timing(slideAnim, {
        toValue: height * 0.6,
        duration: 400,
        useNativeDriver: false,
      }).start();
    };

    return (
      <ReAnimated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
        layout={LinearTransition}
        style={styles.itemWrapper}
      >
        <TouchableOpacity
          style={styles.item}
          onPress={handlePress}
          onLongPress={handleLongPress}
        >
          <View style={styles.left}>
            <CountdownCircle
              conversationId={item.id}
              createdAt={item.created_at}
              expirationAt={item.expiration_at}
              firstMessageSent={item.first_message_sent}
              avatarUrl={otherUser.photo_url}
              size={70}
              strokeWidth={5}
              conversationStatus={item.conversation_status}
              onPressAvatar={() => {
                if (!item.first_message_sent) onAvatarPress(item);
              }}
            />
            {!seen && <View style={styles.unreadDot} />}
          </View>
          <View style={styles.messageContainer}>
            <Text
              style={[
                styles.name,
                !seen && styles.unreadText,
                !item.conversation_status && styles.disableText,
              ]}
            >
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
                  !item.conversation_status && styles.disableText,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {!item.conversation_status
                  ? "Response time is over"
                  : item.last_message
                    ? item.last_message.body &&
                      item.last_message.body.length > 0
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

          {/* 3 Dots Button */}
          <TouchableOpacity
            style={styles.dotsButton}
            onPress={() => handleLongPress()}
          >
            <Ionicons
              name="ellipsis-horizontal-circle-outline"
              size={20}
              color="red"
              style={styles.dotsText}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </ReAnimated.View>
    );
  }
);

export default function ConversationsScreen() {
  const { height: screenHeight } = Dimensions.get("window");
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetConversation, setSheetConversation] = useState(null);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [avatarSheetData, setAvatarSheetData] = useState(null);
  const headerHeight = 0;
  const height = screenHeight - headerHeight;
  const avatarSlideAnim = useRef(new Animated.Value(height)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [conversationInfo, setConversationInfo] = useState(null);

  const [memberCompatibleInfo, setMemberCompatibleInfo] = useState(null);

  const [aiCompatibility, setAICompatibility] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const [planIsValid, setPlanIsValid] = useState(false);

  const { mutate } = useUnmatch();

  const { showAlert } = useAlert();

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

    const convSub = supabase
      .channel("public:conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        async (payload) => {
          switch (payload.eventType) {
            case "INSERT":
              // Fetch full conversation to include nested data like other_user
              try {
                const fullConv = await fetchConversations(user.id);
                setConversations((prev) => [fullConv, ...prev]);
              } catch (err) {
                console.error("Failed to fetch new conversation:", err);
              }
              break;

            case "UPDATE":
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === payload.new.id
                    ? { ...conv, ...payload.new }
                    : conv
                )
              );
              break;

            case "DELETE":
              setConversations((prev) =>
                prev.filter((conv) => conv.id !== payload.old.id)
              );
              break;

            default:
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSub);
      supabase.removeChannel(memberSub);
      supabase.removeChannel(convSub);
    };
  }, [user]);

  useEffect(() => {
    const loadMembers = async () => {
      if (!avatarSheetData || !avatarSheetData.conversationId) return;

      const members = await getCompatibilityMembersInfo(
        avatarSheetData.conversationId
      );
      setMemberCompatibleInfo(members);
    };

    loadMembers();
  }, [avatarSheetData]);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        if (!profile) return;

        const plan = await getActivePlanByUserId(profile.id);
        setPlanIsValid(plan?.plan_id === 3);
      } catch (err) {
        console.error("Failed to fetch profile or AI status:", err);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchCompatibilityFromDB = async () => {
      if (!avatarSheetData?.conversationId) return;

      setLoadingAI(true);

      const percent = await getConversationCompatibility(
        avatarSheetData.conversationId
      );

      if (percent !== null) {
        setAICompatibility(percent);
      } else {
        setAICompatibility(null);
      }

      setLoadingAI(false);
    };

    fetchCompatibilityFromDB();
  }, [avatarSheetData]);

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

  const openAvatarSheet = (conversation) => {
    const otherUser = conversation.other_user || {};
    const sheetData = {
      conversationId: conversation.id,
      creatorId: conversation.created_by,
      photo_url: otherUser.photo_url,
      first_name: otherUser.first_name,
      last_name: otherUser.last_name,
      conversation_is_extended: conversation.conversation_is_extended,
    };

    setAvatarSheetData(sheetData);
    setConversationInfo(sheetData);
    setShowAvatarSheet(true);

    Animated.timing(avatarSlideAnim, {
      toValue: height * 0.5,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const closeAvatarSheet = () => {
    Animated.timing(avatarSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setShowAvatarSheet(false);
      setAvatarSheetData(null);
    });
  };

  const renderItem = useCallback(
    ({ item }) =>
      user ? (
        <ConversationRow
          item={item}
          userId={user.id}
          setSheetConversation={setSheetConversation}
          setShowSheet={setShowSheet}
          slideAnim={slideAnim}
          height={height}
          onAvatarPress={openAvatarSheet}
        />
      ) : null,
    [user]
  );

  async function handleExtendTime(
    userId,
    conversationId,
    setConversationInfo,
    closeExtendSheet
  ) {
    if (!userId || !conversationId) {
      showAlert({
        title: "Error",
        message: "Invalid user or conversation.",
        buttons: [{ text: "OK", style: "cancel" }],
      });
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
      showAlert({
        title: "Success",
        message: "Conversation time extended by 24 hours!",
        buttons: [{ text: "OK", style: "cancel" }],
      });
    } catch (err) {
      showAlert({
        title: "Failed",
        message:
          err.message || "Unable to extend time. Check your remaining extends.",
        buttons: [{ text: "OK", style: "cancel" }],
      });
    }
  }

  function formatConversationMembers(members) {
    if (!Array.isArray(members)) return "No members";

    return members
      .map((m, i) => {
        const p = m.profiles;
        if (!p) return `Member ${i + 1}: (no profile)`;

        const name =
          `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown";
        const children = p.children?.name || "N/A";
        const familyPlan = p.family_plan?.name || "N/A";
        const zodiac = p.zodiac_sign?.name || "N/A";
        const sexuality = p.sexuality?.name || "N/A";

        // Active answers
        const answers =
          p.answers
            ?.filter((a) => a.is_active)
            ?.map((a) => `"${a.prompt?.question}" → "${a.answer_text}"`)
            .join("; ") || "No active answers";

        // Pets
        const pets =
          p.pets
            ?.map((petObj) => petObj.pet?.name)
            .filter(Boolean)
            .join(", ") || "None";

        // Ethnicities
        const ethnicities =
          p.ethnicities
            ?.map((eth) => eth.ethnicity?.name)
            .filter(Boolean)
            .join(", ") || "None";

        return (
          ` ${name}\n` +
          `  • Children: ${children}\n` +
          `  • Family Plan: ${familyPlan}\n` +
          `  • Zodiac: ${zodiac}\n` +
          `  • Sexuality: ${sexuality}\n` +
          `  • Pets: ${pets}\n` +
          `  • Ethnicities: ${ethnicities}\n` +
          `  • Answers: ${answers}`
        );
      })
      .join("\n\n");
  }

  async function getAICompatibility(members) {
    if (!Array.isArray(members) || members.length < 2) return null;

    const formattedMembers = formatConversationMembers(members);

    const aiPrompt = `
Bạn là một trợ lý AI để tính mức độ tương thích giữa hai người dựa trên thông tin hồ sơ cá nhân.
Dưới đây là thông tin của các thành viên trong cuộc trò chuyện:
${formattedMembers}


Hãy trả về mức độ tương thích giữa người đầu tiên và người thứ hai, dưới dạng số từ 0% đến 100%, chỉ số duy nhất, KHÔNG giải thích.
`.trim();

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL}/AIReplySuggestion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aiPrompt),
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      const percentage = data?.body?.match(/\d+/)?.[0];
      return percentage ? parseInt(percentage, 10) : null;
    } catch (err) {
      console.error("Failed to fetch AI compatibility:", err);
      return null;
    }
  }

  return (
    <View style={styles.container} className="gap-5 bg-white">
      <CustomHeader />
      <Text
        className="text-3xl font-poppins-semibold"
        style={{ color: theme.colors.primaryDark }}
      >
        Matches
      </Text>
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
                  <Empty
                    title="No conversations yet"
                    subTitle="We can help you get your first one sooner."
                  />
                )}
              </View>
            )
          }
          ListFooterComponent={
            error && <Text style={styles.errorText}>Error: {error}</Text>
          }
        />
      )}
      {showSheet && sheetConversation && (
        <TouchableWithoutFeedback
          onPress={() => {
            Animated.timing(slideAnim, {
              toValue: height,
              duration: 300,
              useNativeDriver: false,
            }).start(() => {
              setShowSheet(false);
              setSheetConversation(null);
            });
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "flex-start",
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
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/report/report",
                    params: {
                      reportedId: sheetConversation.other_user.id,
                    },
                  })
                }
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="flag-outline"
                    size={20}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.sheetOption}>Report</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  try {
                    let targetUserId;
                    if (sheetConversation?.members?.length > 0) {
                      const otherMember = sheetConversation.members.find(
                        (m) => m.user_id !== user.id
                      );
                      if (otherMember) {
                        targetUserId = otherMember.user_id;
                      }
                    }

                    const interaction = await getInteractionByActorAndTarget(
                      user.id,
                      targetUserId
                    );
                    console.log(interaction.id);

                    showAlert({
                      title: "Are you sure?",
                      message: `Unmatching will delete the match for both you and them`,
                      buttons: [
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                        {
                          text: "Unmatch",
                          style: "destructive",
                          onPress: () => {
                            mutate(interaction.id, {
                              onSuccess: () => {
                                router.navigate("/matches/");
                              },
                              onError: () => {
                                showAlert({
                                  title: "Error",
                                  message:
                                    "Something went wrong, please try again later.",
                                  buttons: [{ text: "OK", style: "cancel" }],
                                });
                              },
                            });
                          },
                        },
                      ],
                    });

                    Animated.timing(slideAnim, {
                      toValue: height,
                      duration: 300,
                      useNativeDriver: false,
                    }).start(() => {
                      setShowSheet(false);
                      setSheetConversation(null);
                    });
                  } catch (err) {
                    console.error("Action failed:", err);
                  }
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="close-outline"
                    size={20}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.sheetOption]}>Unmatch</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (!sheetConversation?.id) return;
                  const conversationId = sheetConversation.id;

                  showAlert({
                    title: "Are you sure?",
                    message: `Block and unmatch will block them permanently`,
                    buttons: [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Block and unmatch",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            await deleteConversationById(conversationId);

                            Animated.timing(slideAnim, {
                              toValue: height,
                              duration: 300,
                              useNativeDriver: false,
                            }).start(() => {
                              setShowSheet(false);
                              setSheetConversation(null);
                            });
                          } catch (err) {
                            console.error("Delete failed:", err);
                            showAlert({
                              title: "Error",
                              message:
                                "Something went wrong, please try again later.",
                              buttons: [{ text: "OK", style: "cancel" }],
                            });
                          }
                        },
                      },
                    ],
                  });
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="red"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.sheetOption, { color: "red" }]}>
                    Block and unmatch
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      )}
      {showAvatarSheet && avatarSheetData && (
        <TouchableWithoutFeedback onPress={closeAvatarSheet}>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                top: avatarSlideAnim,
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
                <View style={{ width: 100, height: 100 }}>
                  <Image
                    source={{ uri: avatarSheetData.photo_url }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: theme.radius.round,
                    }}
                  />
                </View>
              </View>
              {avatarSheetData.conversation_is_extended ? (
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.extendText}>
                    You already extended time for{" "}
                    {avatarSheetData.first_name || avatarSheetData.last_name}.
                  </Text>
                </View>
              ) : avatarSheetData.creatorId === user.id ? (
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.extendText}>
                    You cannot extend your own conversation. Start the
                    conversation by making you're first move!
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.extendText}>
                    Extend{" "}
                    {avatarSheetData.first_name || avatarSheetData.last_name}'s
                    response time by 24 hours?{"\n"}
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.textLighterGray,
                      }}
                    >
                      If the conversation remains inactive for 24 hours after
                      expiration, it will be automatically deleted.
                    </Text>
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
                          user.id,
                          avatarSheetData.conversationId,
                          setConversationInfo,
                          closeAvatarSheet
                        );
                      }}
                    >
                      <Text style={styles.extendSheetButtonText}>Extend</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.extendSheetButton}
                      onPress={closeAvatarSheet}
                    >
                      <Text style={styles.extendSheetButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <View style={{ alignItems: "center", marginTop: 30 }}>
                <Ionicons
                  name="heart"
                  size={24}
                  color={theme.colors.primaryDark}
                />

                {loadingAI ? (
                  <Text
                    style={{ fontFamily: "Poppins-SemiBold", fontSize: 16 }}
                  >
                    <ActivityIndicator
                      color={theme.colors.primaryDark}
                      size={"small"}
                    />
                  </Text>
                ) : aiCompatibility !== null ? (
                  <Text
                    style={{ fontFamily: "Poppins-SemiBold", fontSize: 16 }}
                  >
                    {aiCompatibility}% compatible
                  </Text>
                ) : (
                  <Pressable
                    onPress={async () => {
                      if (!planIsValid) {
                        router.push("/lovana");
                        return;
                      }
                      if (
                        !planIsValid ||
                        !memberCompatibleInfo ||
                        !avatarSheetData?.conversationId
                      )
                        return;

                      setLoadingAI(true);

                      const percent =
                        await getAICompatibility(memberCompatibleInfo);
                      if (percent !== null) {
                        await setConversationCompatibility(
                          avatarSheetData.conversationId,
                          percent
                        );
                        setAICompatibility(percent); // update UI
                      }

                      setLoadingAI(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      opacity: planIsValid ? 1 : 0.5,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Poppins-SemiBold",
                        fontSize: 16,
                        textDecorationLine: "underline",
                      }}
                    >
                      Calculate AI Compatibility
                    </Text>
                  </Pressable>
                )}
                {aiCompatibility == null && planIsValid && (
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 12,
                      color: "gray",
                      textAlign: "center",
                      marginTop: 4,
                      maxWidth: 250,
                      fontStyle: "italic",
                    }}
                  >
                    The AI will base on your info and can only be used{" "}
                    <Text
                      style={{
                        color: theme.colors.primaryDark,
                        fontWeight: "bold",
                      }}
                    >
                      ONCE
                    </Text>
                    . Please update your info to get the best result.
                  </Text>
                )}
                {!planIsValid && (
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 12,
                      color: "gray",
                      textAlign: "center",
                      marginTop: 4,
                      maxWidth: 250,
                      fontStyle: "italic",
                    }}
                  >
                    Lovana Plan only*
                  </Text>
                )}
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
    paddingHorizontal: 18,
    paddingTop: 20,
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
    top: 5,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.primaryDark,
    borderWidth: 2,
    borderColor: "white",
  },
  unreadText: {
    color: theme.colors.textDark,
    fontFamily: "Poppins-SemiBold",
  },
  disableText: {
    opacity: 0.5,
  },
  dotsButton: {
    padding: 5,
  },
  dotsText: {
    fontSize: 24,
    color: "#555",
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
  sheetOption: {
    fontSize: 16,
    paddingVertical: 10,
    fontFamily: "Poppins-Regular",
  },
  extendSheetButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primaryDark,
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
  extendText: {
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    marginTop: 20,
  },
});
