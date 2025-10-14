import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import colors from "tailwindcss/colors";
import { useSignInWithOtp } from "../../api/auth";
import { Fab } from "../../components/fab";
import { StackHeader } from "../../components/stack-header";

export default function Page() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const {
    mutate: signInWithOtp,
    isPending,
    isError,
    error,
    reset,
  } = useSignInWithOtp();

  const isValid = useMemo(() => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneValid = /^0\d{9}$/.test(phone);
    return validEmail && phoneValid;
  }, [phone, email]);

  const handleSubmit = () => {
    if (!isValid) return;
    signInWithOtp(
      { email, phone },
      {
        onSuccess: () =>
          router.push({
            pathname: "/otp",
            params: { email },
          }),
      }
    );
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
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>
            What's your email and phone number?
          </Text>

          {/* Email Input */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            selectionColor={colors.black}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              if (isError) reset();
              setEmail(text);
            }}
            ref={emailRef}
            placeholder="mail@example.com"
            placeholderTextColor="grey"
          />

          {/* Phone Input */}
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            selectionColor={colors.black}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            value={phone}
            onChangeText={(text) => {
              if (isError) reset();
              setPhone(text);
            }}
            maxLength={16}
            ref={phoneRef}
            placeholder="0123456789"
            placeholderTextColor="grey"
          />

          {isError && <Text style={styles.errorText}>{error.message}</Text>}
          <View style={styles.buttonContainer}>
            <Fab
              disabled={!isValid || isPending}
              onPress={handleSubmit}
              loading={isPending}
            />
          </View>
        </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    width: "100%",
  },
  heading: {
    fontSize: 36,
    fontFamily: "PlayfairDisplay-SemiBold",
    marginBottom: 40,
    textAlign: "center",
  },
  label: {
    color: "#6b7280", // gray-500
    fontFamily: "Poppins-Medium",
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 60,
    fontSize: 22,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 24,
    width: "100%",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },
  buttonContainer: {
    alignItems: "center",
  },
});
