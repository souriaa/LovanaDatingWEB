import { Ionicons } from "@expo/vector-icons";
import { FC } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { cn } from "../utils/cn";

interface Props {
  disabled?: boolean;
  onPress?: () => void;
  loading?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  className?: string;
  iconClassName?: string;
  loaderClassName?: string;
  iconSize?: number;
}

export const Fab: FC<Props> = ({
  disabled = false,
  onPress,
  loading = false,
  iconName = "chevron-forward",
  className,
  iconClassName,
  loaderClassName,
  iconSize = 24,
}) => {
  return (
    <Pressable
      className={cn(
        "h-16 aspect-square rounded-full justify-center items-center bg-red-900",
        {
          "bg-neutral-200": disabled && !loading,
          "opacity-50": disabled,
        },
        className
      )}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator className={cn(" text-white", loaderClassName)} />
      ) : (
        <View
          className={cn(
            "text-white",
            { "text-neutral-400": disabled },
            iconClassName
          )}
        >
          <Ionicons
            name={iconName}
            className={cn(
              "text-2xl text-white",
              { "text-neutral-400": disabled },
              iconClassName
            )}
            size={iconSize}
          />
        </View>
      )}
    </Pressable>
  );
};
