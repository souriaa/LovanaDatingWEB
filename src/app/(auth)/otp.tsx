import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
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
    if (isError) reset();
    setOtp(text);
  };

  const isValid = useMemo(() => otp.length === 6, [otp]);

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

    const { error: otpError } = await supabase.auth.signInWithOtp({ email });
    if (otpError) setResendError(otpError.message);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <StackHeader />
      <StatusBar barStyle={"dark-content"} />

      <View style={styles.innerContainer}>
        <Text style={styles.heading}>
          Enter your verification code we have sent to {email}
        </Text>

        {/* OTP Boxes */}
        <View style={styles.otpWrapper}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={styles.otpBox}>
              <Text style={styles.otpText}>{otp[index] || ""}</Text>
            </View>
          ))}
          <TextInput
            style={styles.hiddenInput}
            selectionColor={colors.black}
            keyboardType="numeric"
            textContentType="oneTimeCode"
            autoFocus
            value={otp}
            onChangeText={handleOtpChange}
            maxLength={6}
            placeholder="000000"
            placeholderTextColor="grey"
          />
        </View>

        {/* Error messages */}
        {isError && <Text style={styles.errorText}>{error.message}</Text>}
        {resendError && <Text style={styles.errorText}>{resendError}</Text>}

        {/* Resend */}
        <View style={styles.resendContainer}>
          <TouchableOpacity onPress={handleResendOtp} disabled={cooldown > 0}>
            <Text style={[styles.resendText, cooldown > 0 && { opacity: 0.5 }]}>
              {cooldown > 0
                ? `Resend code in ${cooldown}s`
                : "Resend verification code"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Button */}
        <View style={styles.buttonContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100vw",
    height: "100vh",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: "5vw",
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  heading: {
    fontSize: 32,
    fontFamily: "PlayfairDisplay-SemiBold",
    textAlign: "center",
    marginBottom: 60,
  },
  otpWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    width: "100%",
    height: 70,
  },
  otpBox: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  otpText: {
    fontSize: 36,
    fontFamily: "Poppins-SemiBold",
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.01,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  resendText: {
    color: "#7f1d1d",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    textDecorationLine: "underline",
  },
  buttonContainer: {
    alignItems: "center",
    width: "100%",
  },
});
