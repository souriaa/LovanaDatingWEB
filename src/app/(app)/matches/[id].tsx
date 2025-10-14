import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { useUnmatch } from "../../../api/profiles";

const CustomHeader = ({ title }: { title: string }) => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mutate } = useUnmatch();

  return (
    <Stack.Screen
      options={{
        headerLeft: () => (
          <View className="flex-row items-center gap-2">
            <Pressable onPressOut={() => router.back()}>
              <Ionicons
                name="chevron-back"
                className="text-2xl"
                suppressHighlighting
              />
            </Pressable>

            <Text className="text-lg font-poppins-medium">{title}</Text>
          </View>
        ),
        title: "",
        headerRight: () => (
          <Pressable
            onPressOut={() => {
              Alert.alert(
                "Are you sure?",
                `Unmatching will delete the match for both you and ${title}`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Unmatch",
                    onPress: () => {
                      mutate(id, {
                        onSuccess: () => router.navigate("/matches/"),
                        onError: () =>
                          Alert.alert(
                            "Error",
                            "Something went wrong, please try again later."
                          ),
                      });
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons
              name="cut-outline"
              className="text-2xl"
              suppressHighlighting
            />
          </Pressable>
        ),
      }}
    />
  );
};

export default function Page() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const height = useHeaderHeight();

  return (
    <View className="flex-1 bg-white">
      <CustomHeader title={name || "Chat"} />
      <View
        style={{ flex: 1, paddingTop: height }}
        className="justify-center items-center"
      >
        <Text className="text-gray-500">
          Chat feature removed / placeholder
        </Text>
      </View>
    </View>
  );
}
