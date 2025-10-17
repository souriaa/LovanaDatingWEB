import { MotiView } from "moti";
import React, { FC } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { theme } from "~/constants/theme";

interface Props {
  visible: boolean;
  title?: string;
  children?: React.ReactNode;
  onPressCancel?: () => void;
  onPressSave?: () => void;
}

export const StackBottom: FC<Props> = ({
  visible,
  title,
  children,
  onPressCancel,
  onPressSave,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.wrapper}>
      <TouchableWithoutFeedback onPress={onPressCancel}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <MotiView
        from={{ translateY: 60, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: "timing", duration: 250 }}
        style={styles.floatingBox}
      >
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.button,
                  hovered && { backgroundColor: theme.colors.backgroundGray },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={onPressCancel}
              >
                <Text style={[styles.textButton, { color: "#888" }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.button,
                  hovered && { backgroundColor: theme.colors.backgroundGray },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={onPressSave}
              >
                <Text
                  style={[
                    styles.textButton,
                    { color: theme.colors.primaryDark },
                  ]}
                >
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {children && (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
          >
            {children}
          </ScrollView>
        )}
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  floatingBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "70%",
    maxHeight: "70%",
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Poppins-SemiBold",
  },
  buttonRow: {
    flexDirection: "row",
  },
  button: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 5,
  },
  textButton: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
  },
  content: {
    flexGrow: 1,
  },
});
