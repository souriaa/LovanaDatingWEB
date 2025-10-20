import { StackBottom } from "@/components/stack-bottom";
import * as Crypto from "expo-crypto";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Tooltip from "react-native-tooltip-2";
import { Answer } from "../../../api/my-profile/types";
import { usePrompts } from "../../../api/options";
import { Prompt } from "../../../api/options/types";
import { useInputAlert } from "../../../components/alert-input-provider";
import { useEdit } from "../../../store/edit";

import { useAlert } from "@/components/alert-provider";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "~/constants/theme";
import { getActivePlanByUserId } from "~/service/profilePlanService";
import { getProfile } from "~/service/userService";
import {
  getAIProfileStatus,
  LIMIT,
  RESET_TIME,
  useAIProfileResponse,
} from "../../../utils/useAIProfile";

export default function Page() {
  const { data: prompts } = usePrompts();
  const { promptId, itemId } = useLocalSearchParams();

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [text, setText] = useState("");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [aiInfo, setAiInfo] = useState({ remaining: LIMIT, resetMinutes: 60 });
  const tooltipRef = useRef(null);

  const { edits, setEdits } = useEdit();
  const { showAlert } = useAlert();
  const { showInputAlert } = useInputAlert();

  const [planIsValid, setPlanIsValid] = useState(false);

  useEffect(() => {
    const prompt = prompts.find((item) => item.id.toString() === promptId);
    setPrompt(prompt || null);

    if (itemId) {
      const answer = edits?.answers?.find((item: Answer) => item.id === itemId);
      setText(answer?.answer_text || "");
    }
  }, [prompts, promptId, itemId, edits]);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        if (!profile) return;

        const plan = await getActivePlanByUserId(profile.id);
        setPlanIsValid(plan?.plan_id === 3);
      } catch (err) {
        console.error("Failed to fetch profile or AI status:", err);
      }
    })();
  }, []);

  const handlePressCancel = () => {
    router.dismissTo("/(app)/profile/(tabs)");
  };

  const handlePressDone = () => {
    if (!edits) return;

    if (itemId) {
      if (text) {
        const updatedAnswers = edits?.answers?.map((item: Answer) => {
          if (item.id === itemId) {
            return {
              ...item,
              answer_text: text,
              prompt_id: prompt?.id,
              question: prompt?.question,
            } as Answer;
          }
          return item;
        });
        setEdits({
          ...edits,
          answers: updatedAnswers,
        });
      }
    } else {
      const updatedAnswers = [
        ...edits.answers,
        {
          id: "temp_" + Crypto.randomUUID(),
          answer_text: text,
          answer_order: edits.answers.length || 0,
          prompt_id: prompt?.id,
          question: prompt?.question,
        } as Answer,
      ].filter((item) => item.answer_text);

      setEdits({
        ...edits,
        answers: updatedAnswers,
      });
    }

    router.dismissTo("/(app)/profile/(tabs)");
  };

  async function getAIAnswer(
    promptText: string,
    customizationMessage?: string
  ): Promise<string | null> {
    if (!promptText) return null;

    const aiPrompt = `
Bạn là một trợ lý AI, giúp tạo một câu trả lời ngắn, tự nhiên, thân thiện cho người dùng để họ giới thiệu bản thân. 
Câu hỏi là:
"${promptText}"
${customizationMessage ? `Phong cách trả lời: ${customizationMessage}` : ""}

Chỉ tạo ra 01 câu trả lời NGẮN cho câu hỏi trên, đặt mình vào vị trí người dùng, KHÔNG trích dẫn, chỉ viết câu trả lời, thân thiện, tự nhiên, gần gũi. 
Trả lời bằng tiếng Anh nếu không có chỉ định trong Phong cách.
`.trim();

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL}/AIReplySuggestion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aiPrompt),
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      return data?.body || null;
    } catch (err) {
      console.error("Failed to fetch AI answer:", err);
      return null;
    }
  }

  const handleAIProfilePress = async () => {
    const { count } = await getAIProfileStatus();
    if (count >= LIMIT) {
      showAlert({
        title: "Limit reached",
        message:
          "You can only use AI up to 5 times per hour. Please try again later.",
        buttons: [{ text: "OK", style: "cancel" }],
      });
      return;
    }

    showInputAlert({
      title: "Refine your answer with AI (Optional)",
      message: "Enter your prompt:",
      placeholder: "e.g., Excited but a little nervous",
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: async (value) => {
        const aiAnswer = await getAIAnswer(prompt?.question || "", value);

        if (aiAnswer) {
          setText(aiAnswer);
        }
        const newCount = await useAIProfileResponse();
        const remaining = Math.max(LIMIT - newCount, 0);
        const elapsed = Date.now() - (await getAIProfileStatus()).timestamp;
        const resetMinutes = Math.max(
          Math.ceil((RESET_TIME - elapsed) / 60000),
          0
        );
        setAiInfo({ remaining, resetMinutes });
        setTooltipVisible(true);
      },
    });
  };

  return (
    <View className="flex-1 bg-white p-5">
      <View className="gap-5">
        <Link
          href={{
            pathname: "/prompts",
            params: { itemId },
          }}
          asChild
          suppressHighlighting
        >
          <Pressable className="border border-neutral-200 rounded-md px-5 py-6">
            <Text className="text-lg color-red-900">{prompt?.question}</Text>
          </Pressable>
        </Link>

        <TextInput
          className="border border-neutral-200 rounded-md p-5 h-36 text-base"
          multiline={true}
          numberOfLines={6}
          maxLength={255}
          selectionColor={theme.colors.primaryDark}
          value={text}
          onChangeText={setText}
        />
      </View>
      {planIsValid && (
        <View className="items-center mt-5">
          <Tooltip
            ref={tooltipRef}
            isVisible={tooltipVisible}
            onClose={() => setTooltipVisible(false)}
            backgroundColor="rgba(0,0,0,0.5)"
            placement="top"
            content={
              <View style={{ padding: 8, margin: 10 }}>
                <Text style={{ color: "#000", fontFamily: "Poppins-Regular" }}>
                  Remaining: {aiInfo.remaining} / {LIMIT}
                </Text>
                <Text style={{ color: "#000", fontFamily: "Poppins-Regular" }}>
                  Reset in: {aiInfo.resetMinutes} minutes
                </Text>
              </View>
            }
          >
            <Pressable
              style={{
                width: 28,
                height: 28,
              }}
              onPress={handleAIProfilePress}
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
                  color: theme.colors.primaryDark,
                  backgroundColor: "#fff",
                  borderRadius: 10,
                  paddingHorizontal: 4,
                }}
              >
                AI
              </Text>
            </Pressable>
          </Tooltip>
        </View>
      )}
      <StackBottom
        visible={true}
        title="Edit Answer"
        onPressCancel={handlePressCancel}
        onPressSave={handlePressDone}
      />
    </View>
  );
}
