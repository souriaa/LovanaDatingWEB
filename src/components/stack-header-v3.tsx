import { Stack } from "expo-router";
import { FC } from "react";
import { Pressable, Text } from "react-native";

interface Props {
  title?: string;
  onPressCancel?: () => void;
  onPressDone?: () => void;
}

export const StackHeaderV3: FC<Props> = ({
  title,
  onPressCancel,
  onPressDone,
}) => {
  return (
    <Stack.Screen
      options={{
        headerShown: true,
        title: title,
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontFamily: "Poppins-Regular",
        },
        headerLeft: () => (
          <Pressable onPressOut={onPressCancel}>
            <Text className="font-poppins-semibold px-2">Cancel</Text>
          </Pressable>
        ),
        headerRight: () => (
          <Pressable onPressOut={onPressDone}>
            <Text className="font-poppins-semibold px-2">Done</Text>
          </Pressable>
        ),

        headerShadowVisible: false,
      }}
    />
  );
};
