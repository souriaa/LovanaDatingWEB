// File: components/chat/TypingIndicator.tsx
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../constants/theme";

interface TypingIndicatorProps {
  typingUsers: string[];
  otherUser: any;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  otherUser,
}) => (
  <View style={styles.statusTyping}>
    <Text style={styles.typingText}>
      {typingUsers.length > 0
        ? `${otherUser?.first_name.trim() || "Someone"} is typing...`
        : ""}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  statusTyping: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
  },
  typingText: {
    fontSize: 13,
    color: theme.colors.textLighterGray,
    fontFamily: "Poppins-Regular",
  },
});
