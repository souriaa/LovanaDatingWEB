import { Link } from "expo-router";
import { FC } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";

interface Props {
  title: string;
  subTitle: string;
  primaryText?: string;
  secondaryText?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  secondaryDisabled?: boolean;
}

export const Empty: FC<Props> = ({
  title,
  subTitle,
  onPrimaryPress,
  onSecondaryPress,
  primaryText,
  secondaryText,
  secondaryDisabled = false,
}) => {
  return (
    <SafeAreaView className="flex-1 p-5 bg-white justify-center gap-8">
      <View className="gap-2">
        <Text
          className="text-2xl font-playfair-semibold text-center"
          style={{ color: theme.colors.primaryDark }}
        >
          {title}
        </Text>
        <Text className="text-base font-poppins-light text-center">
          {subTitle}
        </Text>
      </View>
      <View className="gap-2 px-5">
        {primaryText && (
          <Pressable
            className="h-14 items-center justify-center rounded-full w-full"
            style={{ backgroundColor: theme.colors.primaryDark }}
            onPress={onPrimaryPress}
          >
            <Text className="text-white text-base font-poppins-medium">
              {primaryText}
            </Text>
          </Pressable>
        )}
        {secondaryText && (
          <View className="relative">
            <Text className="text-center font-poppins-medium">OR</Text>
            <Pressable
              className="h-14 bg-white items-center justify-center rounded-full border border-neutral-400"
              onPress={secondaryDisabled ? undefined : onSecondaryPress}
              style={{ opacity: secondaryDisabled ? 0.5 : 1 }}
            >
              <Text className="text-black text-base font-poppins-medium">
                {secondaryText}
              </Text>
            </Pressable>
            {secondaryDisabled && (
              <Link href="/lovana" asChild>
                <Text className="text-center text-xs text-gray-500 italic underline pt-1">
                  Premium only*
                </Text>
              </Link>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};
