import { PrivateProfile } from "@/api/my-profile/types";
import { cn } from "@/utils/cn";
import { Ionicons } from "@expo/vector-icons";
import { Href, Link } from "expo-router";
import { FC } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

interface Props {
  data: {
    title: string;
    getValue: (profile: PrivateProfile) => string;
    route: string;
  }[];
  title: string;
  profile: PrivateProfile;
  requiresPremium?: boolean;
}

export const List: FC<Props> = ({ title, data, profile, canUsePremium }) => {
  return (
    <FlatList
      style={{flexGrow: 0}}
      scrollEnabled={false}
      data={data}
      keyExtractor={(item) => item.title}
      ListHeaderComponent={() => (
        <Text className="text-base font-poppins-semibold mb-2">{title}</Text>
      )}
      renderItem={({ item }) => {
        const isDisabled = item.requiresPremium && !canUsePremium;

        const content = (
          <Pressable
            className="flex-row items-center justify-between pr-5 border-b border-neutral-200 py-3"
            style={{ opacity: isDisabled ? 0.5 : 1 }}
          >
            <View>
              <Text
                className={cn("text-base font-poppins-regular", {
                  "text-red-700":
                    ["Name", "Age", "Location", "Gender"].includes(
                      item.title
                    ) && item.getValue(profile) === "None",
                })}
              >
                {item.title}
              </Text>
              <Text
                className={cn("text-base font-poppins-light", {
                  "text-red-700":
                    ["Name", "Age", "Location", "Gender"].includes(
                      item.title
                    ) && item.getValue(profile) === "None",
                })}
              >
                {item.getValue(profile!)}
              </Text>
              {isDisabled && (
                <Text className="text-sm text-gray-500 italic">
                  Premium only
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" className="text-base" />
          </Pressable>
        );

        return isDisabled ? (
          content
        ) : (
          <Link href={item.route as Href} asChild>
            {content}
          </Link>
        );
      }}
    />
  );
};
