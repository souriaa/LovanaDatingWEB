import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../../constants/theme";

interface WaitingContainerProps {
  conversationInfo: any;
  otherUser: any;
  userId: string;
  onExtendPress: () => void;
}

export const WaitingContainer: React.FC<WaitingContainerProps> = ({
  conversationInfo,
  otherUser,
  userId,
  onExtendPress,
}) => (
  <View style={styles.waitingContainer}>
    {conversationInfo?.created_by === userId ||
    conversationInfo?.first_message_sent ? (
      <Text style={styles.waitingText}>Response time is over</Text>
    ) : (
      <>
        <Text style={styles.waitingText}>Response time is over</Text>
        <TouchableOpacity style={styles.extendBtn} onPress={onExtendPress}>
          <Text style={styles.extendBtnText}>
            Extend{" "}
            {otherUser?.first_name || otherUser?.last_name
              ? `${otherUser?.first_name || ""} ${otherUser?.last_name || ""}`.trim()
              : null}
            's time
          </Text>
        </TouchableOpacity>
      </>
    )}
  </View>
);

const styles = StyleSheet.create({
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  waitingText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: theme.colors.textLighterGray,
    textAlign: "center",
  },
  extendBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  extendBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins-Regular",
  },
});
