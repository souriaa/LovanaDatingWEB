// File: components/chat/ExtendTimeSheet.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { theme } from "../../constants/theme";
import { extendConversationTime } from "../../service/messageService";

interface ExtendTimeSheetProps {
  otherUser: any;
  onCancel: () => void;
  slideAnim: Animated.Value;
  height: number;
  userId: string;
  conversationId: string;
  setConversationInfo: (info: any) => void;
}

export const ExtendTimeSheet: React.FC<ExtendTimeSheetProps> = ({
  otherUser,
  onCancel,
  slideAnim,
  height,
  userId,
  conversationId,
  setConversationInfo,
}) => {
  const handleExtend = async () => {
    if (!userId || !conversationId) {
      Alert.alert("Error", "Invalid user or conversation.");
      return;
    }
    try {
      const updatedConversation = await extendConversationTime(
        userId,
        conversationId
      );
      setConversationInfo((prev: any) => ({
        ...prev,
        expiration_at: updatedConversation.expiration_at,
      }));
      onCancel();
      Alert.alert("Success", "Conversation time extended by 24 hours!");
    } catch (err: any) {
      Alert.alert(
        "Failed",
        err.message || "Unable to extend time. Check your remaining extends."
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={onCancel}>
      <View
        style={{
          position: "absolute",
          top: 88,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            top: slideAnim,
            width: "90%",
            height: height,
            backgroundColor: "white",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#ccc",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <View
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={{ width: 100, height: 100 }}>
              <Image
                source={{ uri: otherUser.photo_url }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: theme.radius.round,
                }}
              />
              <Ionicons
                name="time-outline"
                size={30}
                style={{
                  backgroundColor: "white",
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  borderWidth: 1,
                  borderColor: "white",
                  borderRadius: theme.radius.round,
                }}
              />
            </View>
          </View>
          <Text style={styles.extendText}>
            Extend {otherUser?.first_name || otherUser?.last_name}'s response
            time by 24 hours?
          </Text>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 20,
              justifyContent: "center",
            }}
          >
            <TouchableOpacity
              style={styles.extendSheetButton}
              onPress={handleExtend}
            >
              <Text style={styles.extendSheetButtonText}>Extend</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.extendSheetButton}
              onPress={onCancel}
            >
              <Text style={styles.extendSheetButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  extendText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    marginTop: 10,
  },
  extendSheetButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  extendSheetButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
  },
});
