import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useUnmatch } from "../../../api/profiles";
import { useAlert } from "../../../components/alert-provider";

const CustomHeader = ({ title }: { title: string }) => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mutate } = useUnmatch();

  const { showAlert } = useAlert();

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
              showAlert({
                title: "Are you sure?",
                message: `Unmatching will delete the match for both you and ${title}`,
                buttons: [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Unmatch",
                    style: "destructive",
                    onPress: () => {
                      mutate(id, {
                        onSuccess: () => router.navigate("/matches/"),
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
