import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "tailwindcss/colors";
import { useVerifyOtp } from "../../api/auth";
import { Fab } from "../../components/fab";
import { StackHeader } from "../../components/stack-header";
import { supabase } from "../../lib/supabase";

export default function Page() {
  const [otp, setOtp] = useState("");
  const [resendCount, setResendCount] = useState(0);
  const [cooldown, setCooldown] = useState(60);
  const [resendError, setResendError] = useState<string | null>(null);

  const { phone, email } = useLocalSearchParams<{
    phone?: string;
    email?: string;
  }>();
  const {
    mutate: verifyOtp,
    isPending,
    isError,
    error,
    reset,
  } = useVerifyOtp();

  const handleOtpChange = (text: string) => {
    if (isError) {
      reset();
    }
    setOtp(text);
  };

  const isValid = useMemo(() => {
    return otp.length === 6;
  }, [otp]);

  const handleSubmit = () => {
    verifyOtp({ phone, email, token: otp });
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResendOtp = async () => {
    if (!email || cooldown > 0) return;

    setResendError(null);
    setResendCount((prev) => prev + 1);

    const newCooldown = resendCount < 5 ? 60 : 300;
    setCooldown(newCooldown);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
    });

    if (otpError) {
      setResendError(otpError.message);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white p-5"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <StackHeader />
      <StatusBar barStyle={"dark-content"} />
      <View className="flex-1 justify-center">
        <View className="flex-1">
          <Text className="text-4xl font-playfair-semibold">
            Enter your verification code we have sent to {email}
          </Text>
          <View className="h-28" />
          <View className="flex-row gap-2 h-16">
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={index}
                className="border-b flex-1 items-center justify-center"
              >
                <Text className="text-4xl font-poppins-semibold">
                  {otp[index] || ""}
                </Text>
              </View>
            ))}
          </View>
          <TextInput
            className="absolute inset-0 opacity-0"
            style={{
              height: "100%",
              width: "100%",
              position: "absolute",
              opacity: 0.01,
            }}
            selectionColor={colors.black}
            keyboardType="numeric"
            textContentType="oneTimeCode"
            autoFocus
            value={otp}
            onChangeText={handleOtpChange}
            maxLength={6}
          />

          {isError && (
            <Text className="text-red-500 text-sm text-center mt-4">
              {error.message}
            </Text>
          )}
          {resendError && (
            <Text className="text-red-500 text-sm text-center mt-2">
              {resendError}
            </Text>
          )}
          <View className="mt-10 items-center">
            <TouchableOpacity onPress={handleResendOtp} disabled={cooldown > 0}>
              <Text
                className={`text-red-900 text-base font-poppins-semibold underline ${
                  cooldown > 0 ? "opacity-50" : ""
                }`}
              >
                {cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Resend verification code"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View className="items-end">
          <Fab
            disabled={!isValid || isPending}
            onPress={handleSubmit}
            loading={isPending}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
