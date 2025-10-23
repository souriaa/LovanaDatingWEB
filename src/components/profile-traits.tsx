import { Ionicons } from "@expo/vector-icons";
import { FC } from "react";
import { Text, View } from "react-native";
import { Profile } from "../types/profile";

interface Props {
  profile: Profile;
}

export const ProfileTraits: FC<Props> = ({ profile }) => {
  return (
    <View className="bg-white border border-neutral-200 rounded-lg flex-1 p-4 justify-between">
      {profile?.traits.map(({ key, icon, label }, index) => {
        if (!label) return null;
        return (
          <View
            key={key}
            className="flex-1 flex-row items-center justify-start gap-3"
          >
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={32}
              color="#000"
            />
            <Text className="text-md font-poppins-regular">{label}</Text>
          </View>
        );
      })}
    </View>
  );
};
