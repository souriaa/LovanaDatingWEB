import { Ionicons } from "@expo/vector-icons";
import { Redirect, Stack, router, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { getInteractionByActorAndTarget } from "../../../../../service/interactionService";
import { createConversation } from "../../../../../service/messageService";
import { getProfile } from "../../../../../service/userService";
import { useLikes, useMatch, useRemoveLike } from "../../../../api/profiles";
import { Fab } from "../../../../components/fab";
import { ProfileView } from "../../../../components/profile-view";
import { transformPublicProfile } from "../../../../utils/profile";

const Page = () => {
  const { id, hideFab } = useLocalSearchParams();

  const { mutate: remove, isPending: removePending } = useRemoveLike();
  const { mutate: match, isPending: matchPending } = useMatch();

  const { data } = useLikes();
  const like = data.find((like) => like.id === id);
  let profile;

  const handleRemove = () => {
    if (like) {
      remove(like.id, {
        onSuccess: () => {
          router.back();
        },
        onError: () => {
          Alert.alert("Error", "Something went wrong, please try again later");
        },
      });
    }
  };

  const handleMatch = async () => {
    if (!like) return;

    try {
      const currentUser = await getProfile();
      if (!currentUser) {
        console.error("❌ No user found");
        return;
      }

      // 👉 Lấy interaction trước khi gọi match
      const interaction = await getInteractionByActorAndTarget(
        like.profile.id,
        currentUser.id
      );

      const firstMessageSent = interaction?.status_id === 7;

      match(like.id, {
        onSuccess: async () => {
          try {
            const conversation = await createConversation({
              userIds: [currentUser.id, like.profile.id],
              isGroup: false,
              first_message_sent: firstMessageSent,
            });

            if (conversation?.success) {
              const conversationId = conversation.data.id;
              router.push(`/matches?conversationId=${conversationId}`);
            } else {
              console.error(
                "❌ Failed to create conversation:",
                conversation?.message
              );
            }
          } catch (err) {
            console.error("Error creating conversation:", err);
          }
        },
        onError: () => {
          Alert.alert("Error", "Something went wrong, please try again later");
        },
      });
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  if (!like) {
    return <Redirect href={"/likes"} />;
  }

  profile = transformPublicProfile(like.profile);

  return (
    <View className="flex-1 px-5 bg-white">
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPressOut={() => router.back()}>
              <View className="flex-row items-center">
                <Ionicons
                  name="chevron-back"
                  className="text-2xl"
                  suppressHighlighting
                />
                <Text
                  className="text-xl font-poppins-medium"
                  suppressHighlighting
                >
                  All
                </Text>
              </View>
            </Pressable>
          ),
          title: "",
          headerShadowVisible: false,
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* <View className="h-28 bg-neutral-200 overflow-hidden rounded-md ">
          {like?.photo_url ? (
            <Image source={like?.photo_url} className="aspect-square w-full" />
          ) : (
            <View className="flex-1 justify-center p-5">
              <Text className="text-xl font-playfair-semibold">
                {like?.answer_text}
              </Text>
            </View>
          )}
        </View> */}
        <ProfileView profile={profile} />
      </ScrollView>

      <Fab
        className="absolute bottom-20 left-5 bg-white  shadow-sm h-20"
        iconClassName="text-black text-4xl"
        iconName="close"
        onPress={handleRemove}
        loading={removePending}
        loaderClassName="text-black"
        disabled={removePending || matchPending}
      />
      <Fab
        className="absolute bottom-20 right-5 bg-white  shadow-sm h-20"
        iconClassName="text-black text-4xl"
        iconName="chatbox-outline"
        onPress={handleMatch}
        loading={matchPending}
        loaderClassName="text-black"
        disabled={removePending || matchPending}
      />
    </View>
  );
};

export default Page;
