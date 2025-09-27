import React, { useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { theme } from "../../constants/theme";

export const SwipeableMessage = ({ children, onReply, isMine }) => {
  const swipeableRef = useRef(null);

  const renderLeftActions = (progress, dragX) => {
    if (isMine) return null;
    const translateX = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [-35, 0],
      extrapolate: "clamp",
    });
    return (
      <Animated.View
        style={[styles.actionContainer, { transform: [{ translateX }] }]}
      >
        <Ionicons
          name="arrow-undo-outline"
          size={24}
          color={theme.colors.primary}
        />
      </Animated.View>
    );
  };

  const renderRightActions = (progress, dragX) => {
    if (!isMine) return null;

    // Icon di chuyển theo swipe
    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 35], 
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.actionContainer,
          { transform: [{ translateX }], alignItems: "flex-end" }, // icon sát bubble
        ]}
      >
        <Ionicons
          name="arrow-undo-outline"
          size={24}
          color={theme.colors.primary}
        />
      </Animated.View>
    );
  };

  const handleSwipeOpen = () => {
    onReply?.();
    swipeableRef.current?.close();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
    >
      {children}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    justifyContent: "center",
    paddingHorizontal: 10,
    flex: 1,
  },
});
