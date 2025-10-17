import { Ionicons } from "@expo/vector-icons";
import { Redirect, Stack, router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { getInteractionByActorAndTarget } from "../../../../../service/interactionService";
import { createConversation } from "../../../../../service/messageService";
import { getProfile } from "../../../../../service/userService";
import { useLikes, useMatch, useRemoveLike } from "../../../../api/profiles";
import { useAlert } from "../../../../components/alert-provider";
import { Fab } from "../../../../components/fab";
import { ProfileView } from "../../../../components/profile-view";
import { transformPublicProfile } from "../../../../utils/profile";

const Page = () => {
  const { id } = useLocalSearchParams();

  const { mutate: remove, isPending: removePending } = useRemoveLike();
  const { mutate: match, isPending: matchPending } = useMatch();

  const { showAlert } = useAlert();

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
          showAlert({
            title: "Error",
            message: "Something went wrong, please try again later",
            buttons: [{ text: "OK", style: "cancel" }],
          });
        },
      });
    }
  };

  const handleMatch = async () => {
    if (!like) return;

    try {
      const currentUser = await getProfile();
      if (!currentUser) {
        return;
      }

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
        onError: (error) => {
          if (error?.message?.toLowerCase().includes("no likes remaining")) {
            showAlert({
              title: "Out of Likes",
              message:
                "You've reached your daily like limit. Likes refresh every day — upgrade to a plan for unlimited likes!",
              buttons: [{ text: "OK", style: "cancel" }],
            });
          } else {
            console.error("Match mutation error:", error);
            showAlert({
              title: "Error",
              message: "Something went wrong. Please try again later.",
              buttons: [{ text: "OK", style: "cancel" }],
            });
          }
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
              <View className="flex-row items-center" style={{ marginTop: 20 }}>
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
        <ProfileView profile={profile} />
      </ScrollView>
      <View className="absolute bottom-20 w-full flex flex-row justify-center space-x-8">
        <Fab
          className="bg-white h-20 active:h-[4.75rem] rounded-full"
          iconClassName="text-black text-4xl"
          iconName="close"
          onPress={handleRemove}
          loading={removePending}
          loaderClassName="text-black"
          disabled={removePending || matchPending}
        />
        <Fab
          className="bg-white h-20 active:h-[4.75rem] rounded-full"
          iconClassName="text-black text-4xl"
          iconName="chatbox-outline"
          onPress={handleMatch}
          loading={matchPending}
          loaderClassName="text-black"
          disabled={removePending || matchPending}
        />
      </View>
    </View>
  );
};

export default Page;
