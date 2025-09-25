import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { theme } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";

const BackButton = ({ size = 30, router }) => {
  return (
    <Pressable onPress={() => router.back()} style={styles.button}>
      <Ionicons
        name="chevron-back-outline"
        size={28}
        color={theme.colors.textDarkGray}
      />
    </Pressable>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    padding: 10,
    paddingLeft: 0,
  },
});
