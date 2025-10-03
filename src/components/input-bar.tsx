// File: components/chat/InputBar.tsx
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../constants/theme";
import Input from "./Input";

interface InputBarProps {
  onPickFile: () => void;
  inputRef: any;
  onTextChange: (text: string) => void;
  onSend: () => void;
  isSending?: boolean;
  cooldown?: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({
  onPickFile,
  inputRef,
  onTextChange,
  onSend,
  isSending = false,
  cooldown = false,
}) => (
  <View style={styles.inputBar}>
    <TouchableOpacity onPress={onPickFile} style={styles.uploadBtn}>
      <Ionicons name="attach-outline" size={28} color={theme.colors.primary} />
    </TouchableOpacity>

    <Input
      inputRef={inputRef}
      onChangeText={onTextChange}
      placeholder="Message"
      placeholderTextColor={theme.colors.textLighterGray}
      containerStyle={styles.input}
    />

    <TouchableOpacity
      style={styles.sendBtn}
      onPress={onSend}
      disabled={isSending}
      activeOpacity={isSending ? 1 : 0.7}
    >
      {isSending ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : (
        <Ionicons name="send-outline" size={28} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: theme.colors.backgroundGray,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.backgroundLighterGray,
    paddingHorizontal: 12,
  },
  sendBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.round,
  },
  uploadBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.round,
  },
});
