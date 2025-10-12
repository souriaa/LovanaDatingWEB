import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
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
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <StackHeader />
      <StatusBar barStyle={"dark-content"} />

      <View className="flex-1 justify-center p-5">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-4xl font-playfair-semibold mb-10">
            What's your email and phone number?
          </Text>

          {/* Email Input */}
          <Text className="text-gray-500 font-poppins-medium mb-2">Email</Text>
          <TextInput
            className="border-b h-20 text-2xl font-poppins-semibold mb-8"
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
          />

          {/* Phone Input */}
          <Text className="text-gray-500 font-poppins-medium mb-2">
            Phone Number
          </Text>
          <TextInput
            className="border-b h-20 text-2xl font-poppins-semibold mb-8"
            style={
              Platform.OS === "ios" && {
                lineHeight: undefined,
              }
            }
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
          />

          {isError && (
            <Text className="text-red-500 text-sm text-center mt-4">
              {error.message}
            </Text>
          )}
        </ScrollView>
        {/* Submit Button */}
        <View className="items-end mt-8">
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
