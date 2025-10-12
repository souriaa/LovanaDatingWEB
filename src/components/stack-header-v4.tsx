import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { FC } from "react";
import { Pressable, Text } from "react-native";

interface Props {
  title: string;
  onPressBack?: () => void;
}

export const StackHeaderV4: FC<Props> = ({ title, onPressBack }) => {
  return (
    <Stack.Screen
      options={{
        title,
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontFamily: "Poppins-Regular",
        },
        headerLeft: () => (
          <Pressable
            onPressOut={onPressBack}
            style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
          >
            <Ionicons name="chevron-back" size={24} suppressHighlighting />
            <Text className="font-poppins-regular pt-1">Save</Text>
          </Pressable>
        ),
      }}
    />
  );
};
