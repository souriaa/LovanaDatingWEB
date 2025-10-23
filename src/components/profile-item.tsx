import { FC, ReactNode } from "react";
import { View } from "react-native";
import { Answer, Photo } from "../types/profile";
import { Fab } from "./fab";

interface Props {
  children: ReactNode;
  item: Photo | Answer;
  type: "photo" | "answer";
  onLike?: (id: string, type: "photo" | "answer") => void;
}

export const ProfileItem: FC<Props> = ({ children, item, type, onLike }) => {
  return (
    <View className="relative flex-1">
      <View className="flex-1">{children}</View>
      {onLike && (
        <Fab
          className="absolute bottom-5 right-5 bg-white"
          iconName="heart-outline"
          iconClassName="text-red-900 text-4xl"
          onPress={() => onLike(item.id, type)}
          iconSize={40}
        />
      )}
    </View>
  );
};
