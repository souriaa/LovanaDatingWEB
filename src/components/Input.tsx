import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { theme } from "../../constants/theme";

const Input = (props) => {
  return (
    <View
      style={[styles.container, props.containerStyle && props.containerStyle]}
    >
      {props.icon && props.icon}
      <TextInput
        style={{ flex: 1, color: 'black', fontFamily: "Poppins-Regular" }}
        placeholderTextColor={theme.colors.textLight}
        ref={props.inputRef && props.inputRef}
        {...props}
      />
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.xl,
    borderCurve: "continuous",
    paddingHorizontal: 18,
    gap: 12,
  },
});
