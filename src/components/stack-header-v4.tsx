import { Stack } from "expo-router";
import { FC } from "react";

interface Props {
  title: string;
  onPressBack?: () => void;
}

export const StackHeaderV4: FC<Props> = ({ title, onPressBack }) => {
  return (
    <Stack.Screen
      options={{
        headerShown: true,
        title,
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontFamily: "Poppins-Regular",
        },
        // headerLeft: () => (
        //   <Pressable
        //     onPressOut={onPressBack}
        //     style={{
        //       flexDirection: "row",
        //       alignItems: "center",
        //       gap: 2,
        //       marginLeft: 10,
        //     }}
        //   >
        //     <Ionicons name="chevron-back" size={28} suppressHighlighting />
        //     <Text className="font-poppins-regular text-lg">Save</Text>
        //   </Pressable>
        // ),
      }}
    />
  );
};
