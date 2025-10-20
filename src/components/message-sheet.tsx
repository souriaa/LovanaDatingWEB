// File: components/chat/MessageSheet.tsx
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface MessageSheetProps {
  sheetMessage: any;
  otherUser: any;
  onReply: (message: any) => void;
  onCopy: () => void;
  onReportUser: () => void;
  onReportMessage: () => void;
  onCreateSchedule: () => void;
  onUnmatch: () => void;
  onDelete: () => void;
  onClose: () => void;
  slideAnim: Animated.Value;
  height: number;
  interactionId?: string;
}

export const MessageSheet: React.FC<MessageSheetProps> = ({
  sheetMessage,
  otherUser,
  onReply,
  onCopy,
  onReportUser,
  onReportMessage,
  onUnmatch,
  onDelete,
  onClose,
  onCreateSchedule,
  slideAnim,
  height,
}) => {
  return (
    <TouchableWithoutFeedback onPress={onClose}>
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
          {sheetMessage ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  onReply(sheetMessage);
                  onClose();
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="arrow-undo-outline"
                    size={20}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.sheetOption}>Reply</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={onCopy}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="copy-outline"
                    size={20}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.sheetOption}>Copy</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={onReportMessage}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="flag-outline"
                    size={20}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.sheetOption}>Report</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={onCreateSchedule}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.sheetOption}>
                    Add a schedule with{" "}
                    {otherUser.first_name || otherUser.last_name
                      ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim()
                      : null}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={onReportUser}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="flag-outline"
                    size={20}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.sheetOption}>
                    Report{" "}
                    {otherUser.first_name || otherUser.last_name
                      ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim()
                      : null}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={onUnmatch}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="close-outline"
                    size={20}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.sheetOption}>Unmatch</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={onDelete}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    style={{ marginRight: 8 }}
                    color={"red"}
                  />
                  <Text style={[styles.sheetOption, { color: "red" }]}>
                    Block and unmatch
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  sheetOption: {
    fontSize: 16,
    paddingVertical: 10,
    fontFamily: "Poppins-Regular",
  },
});
