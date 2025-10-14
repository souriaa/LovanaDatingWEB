import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { FC } from "react";
import { Text, View } from "react-native";

interface Props {
  like: { photo_url: string | null; profile: any };
  isSuperLike?: boolean;
}

export const LikeCard: FC<Props> = ({
  like: { photo_url, profile },
  isSuperLike,
}) => {
  return (
    <View className="bg-white flex-1 rounded-lg overflow-hidden border border-neutral-200">
      <View className="p-4 gap-5">
        <Text className="text-base font-poppins-light">
          {isSuperLike
            ? "Super Liked You"
            : `Liked your ${photo_url ? "photo" : "answer"}`}
        </Text>
        <Text className="text-xl font-poppins-medium">
          {profile.first_name}
        </Text>
      </View>
      <View className="flex-1 bg-neutral-200 aspect-square w-full">
        <Image
          source={{ uri: profile.photos[0].photo_url }}
          className="flex-1"
        />

        <BlurView
          className="absolute top-0 right-0 bottom-0 left-0"
          intensity={100}
          tint="light"
        />
      </View>
    </View>
  );
};
