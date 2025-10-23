import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../../constants/theme";

interface ReplyPreviewProps {
  replyingTo: any;
  onCancel: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
  replyingTo,
  onCancel,
}) => (
  <View style={styles.replyPreview}>
    <View style={styles.replyPreviewInfo}>
      <Text style={styles.replyAuthor}>
        {replyingTo.sender?.first_name || "Unknown"}
      </Text>
      <Text style={styles.replyBody} numberOfLines={1}>
        {replyingTo.body}
      </Text>
    </View>
    <TouchableOpacity onPress={onCancel}>
      <Ionicons name="close" size={20} color={theme.colors.textDarkGray} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  replyPreview: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: theme.colors.backgroundLighterGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "space-between",
  },
  replyPreviewInfo: {},
  replyAuthor: {
    fontWeight: "600",
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
  },
  replyBody: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
  },
});
