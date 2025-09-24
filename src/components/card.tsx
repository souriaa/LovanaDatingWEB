import React, { FC, forwardRef } from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { theme } from "~/constants/theme";

interface Props extends PressableProps {
  title: string;
  subtitle?: string;
  selected?: boolean;
}

export const Card: FC<Props> = forwardRef<View, Props>(
  ({ title, subtitle, selected = false, style, ...rest }, ref) => {
    return (
      <Pressable
        ref={ref}
        {...rest}
        style={[styles.card, selected && styles.cardSelected, style]}
      >
        <View>
          <Text style={[styles.title, selected && styles.textSelected]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, selected && styles.textSelected]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }
);

Card.displayName = "Card";

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 12,
    borderRadius: 50,
    backgroundColor: "#fff",
    paddingTop: 6,
    paddingBottom: 4,
  },
  cardSelected: {
    backgroundColor: theme.colors.primaryDark,
  },
  title: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: theme.colors.textDark,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Light",
    color: "#444",
  },
  textSelected: {
    color: theme.colors.textLight,
  },
});
