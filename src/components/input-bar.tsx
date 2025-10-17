import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Tooltip from "react-native-tooltip-2";
import { theme } from "../../constants/theme";
import { getActivePlanByUserId } from "../../service/profilePlanService";
import Input from "./Input";
import { useInputAlert } from "./alert-input-provider";
import { useAlert } from "./alert-provider";

const STORAGE_KEY = "ai_response_limit";
const LIMIT = 5;
const RESET_TIME = 60 * 60 * 1000;

// platform-aware storage
const storage =
  Platform.OS === "web"
    ? {
        getItem: async (key: string) =>
          Promise.resolve(localStorage.getItem(key)),
        setItem: async (key: string, value: string) =>
          Promise.resolve(localStorage.setItem(key, value)),
      }
    : require("@react-native-async-storage/async-storage");

async function getAIStatus() {
  try {
    const data = await storage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (!data) return { count: 0, timestamp: now };

    const { count, timestamp } = JSON.parse(data);

    if (now - timestamp > RESET_TIME) {
      await storage.setItem(
        STORAGE_KEY,
        JSON.stringify({ count: 0, timestamp: now })
      );
      return { count: 0, timestamp: now };
    }

    return { count, timestamp };
  } catch (err) {
    console.error("Error reading AI status:", err);
    return { count: 0, timestamp: Date.now() };
  }
}

async function useAIResponse() {
  try {
    const { count, timestamp } = await getAIStatus();
    const now = Date.now();
    if (now - timestamp > RESET_TIME) {
      await storage.setItem(
        STORAGE_KEY,
        JSON.stringify({ count: 1, timestamp: now })
      );
      return 1;
    }

    await storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ count: count + 1, timestamp })
    );
    return count + 1;
  } catch (err) {
    console.error("Error updating AI usage:", err);
    return null;
  }
}

export const InputBar = ({
  onPickFile,
  inputRef,
  onTextChange,
  onSend,
  isSending = false,
  cooldown = false,
  onAIResponse,
  value,
  currentUser,
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [planIsValid, setPlanIsValid] = useState(false);
  const [aiInfo, setAiInfo] = useState({ remaining: LIMIT, resetMinutes: 60 });
  const tooltipRef = useRef(null);

  const { showAlert } = useAlert();
  const { showInputAlert } = useInputAlert();

  useEffect(() => {
    (async () => {
      const plan = await getActivePlanByUserId(currentUser);

      if (!plan || plan.plan_id !== 3) {
        setPlanIsValid(false);
      } else {
        setPlanIsValid(true);
      }

      const { count, timestamp } = await getAIStatus();
      const remaining = Math.max(LIMIT - count, 0);
      const elapsed = Date.now() - timestamp;
      const resetMinutes = Math.max(
        Math.ceil((RESET_TIME - elapsed) / 60000),
        0
      );
      setAiInfo({ remaining, resetMinutes });
    })();
  }, [currentUser]);

  useEffect(() => {
    (async () => {
      const { count, timestamp } = await getAIStatus();
      const remaining = Math.max(LIMIT - count, 0);
      const elapsed = Date.now() - timestamp;
      const resetMinutes = Math.max(
        Math.ceil((RESET_TIME - elapsed) / 60000),
        0
      );
      setAiInfo({ remaining, resetMinutes });
    })();
  }, []);

  const handleAIResponse = async () => {
    const { count } = await getAIStatus();
    if (count >= LIMIT) {
      showAlert({
        title: "Giới hạn đã đạt",
        message:
          "Bạn chỉ có thể dùng AI tối đa 5 lần mỗi 1 tiếng. Vui lòng thử lại sau.",
        buttons: [{ text: "OK", style: "cancel" }],
      });
      return;
    }

    setTimeout(() => {
      setTooltipVisible(true);
    }, 1000);

    onAIResponse?.(async (success) => {
      if (success) {
        const newCount = await useAIResponse();
        const remaining = Math.max(LIMIT - newCount, 0);
        const elapsed = Date.now() - (await getAIStatus()).timestamp;
        const resetMinutes = Math.max(
          Math.ceil((RESET_TIME - elapsed) / 60000),
          0
        );
        setAiInfo({ remaining, resetMinutes });
      }
    });
  };

  const closeTooltip = () => setTooltipVisible(false);

  return (
    <TouchableWithoutFeedback onPress={closeTooltip}>
      <View style={styles.inputBar}>
        <TouchableOpacity onPress={onPickFile} style={styles.uploadBtn}>
          <Ionicons
            name="attach-outline"
            size={28}
            color={theme.colors.primaryDark}
          />
        </TouchableOpacity>

        {planIsValid && (
          <Tooltip
            ref={tooltipRef}
            isVisible={tooltipVisible}
            onClose={closeTooltip}
            backgroundColor="rgba(0,0,0,0.5)"
            placement="top"
            content={
              <View style={{ padding: 8 }}>
                <Text style={{ color: "#000", fontFamily: "Poppins-Regular" }}>
                  Còn lại: {aiInfo.remaining} / {LIMIT} lần
                </Text>
                <Text style={{ color: "#000", fontFamily: "Poppins-Bold" }}>
                  Reset sau: {aiInfo.resetMinutes} phút
                </Text>
              </View>
            }
          >
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleAIResponse();
              }}
              style={styles.uploadBtn}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={28}
                  color={theme.colors.primaryDark}
                />
                <Text
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    fontSize: 8,
                    fontFamily: "Poppins-Regular",
                    color: theme.colors.primaryDark,
                    backgroundColor: "#fff",
                    borderRadius: 10,
                    paddingHorizontal: 4,
                  }}
                >
                  AI
                </Text>
              </View>
            </TouchableOpacity>
          </Tooltip>
        )}

        <Input
          inputRef={inputRef}
          onChangeText={onTextChange}
          placeholder="Message"
          placeholderTextColor={theme.colors.textLighterGray}
          containerStyle={styles.input}
          value={value}
        />

        <TouchableOpacity
          style={styles.sendBtn}
          onPress={onSend}
          disabled={isSending}
          activeOpacity={isSending ? 1 : 0.7}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={theme.colors.primaryDark} />
          ) : (
            <Ionicons
              name="send-outline"
              size={28}
              color={theme.colors.primaryDark}
            />
          )}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

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
