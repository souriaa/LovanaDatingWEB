import { useSignInWithOtp } from "@/api/auth";
import { Fab } from "@/components/fab";
import { StackHeader } from "@/components/stack-header";
import { router, useFocusEffect } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import colors from "tailwindcss/colors";

export default function Page() {
  const [method, setMethod] = useState<"phone" | "email">("email");
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

  const handleInputChange = (text: string) => {
    if (isError) reset();
    if (method === "phone") setPhone(text);
    else setEmail(text);
  };

  const isValid = useMemo(() => {
    if (method === "phone") {
      return /^\+[1-9]\d{1,14}$/.test(phone);
    } else {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
  }, [method, phone, email]);

  const handleSubmit = () => {
    if (method === "phone") {
      signInWithOtp(
        { phone },
        {
          onSuccess: () =>
            router.push({
              pathname: "/otp",
              params: { phone },
            }),
        }
      );
    } else {
      signInWithOtp(
        { email },
        {
          onSuccess: () =>
            router.push({
              pathname: "/otp",
              params: { email },
            }),
        }
      );
    }
  };

  useFocusEffect(() => {
    if (method === "phone") {
      phoneRef.current?.focus();
    } else {
      emailRef.current?.focus();
    }
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white p-5"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <StackHeader />
      <StatusBar barStyle={"dark-content"} />
      <View className="flex-1 justify-center">
        {/* Toggle Method */}
        {/* <View className="flex-row mb-6">
          <Pressable
            className={`flex-1 py-3 border-b-2 ${
              method === "phone" ? "border-black" : "border-gray-200"
            }`}
            onPress={() => setMethod("phone")}
          >
            <Text
              className={`text-center font-poppins-semibold ${
                method === "phone" ? "text-black" : "text-gray-400"
              }`}
            >
              Phone
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-3 border-b-2 ${
              method === "email" ? "border-black" : "border-gray-200"
            }`}
            onPress={() => setMethod("email")}
          >
            <Text
              className={`text-center font-poppins-semibold ${
                method === "email" ? "text-black" : "text-gray-400"
              }`}
            >
              Email
            </Text>
          </Pressable>
        </View> */}

        {/* Title */}
        <View className="flex-1">
          <Text className="text-4xl font-playfair-semibold">
            {method === "phone"
              ? "What's your phone number?"
              : "What's your email address?"}
          </Text>

          <View className="h-28" />

          {/* Input */}
          {method === "phone" ? (
            <TextInput
              className="border-b h-16 text-2xl font-poppins-semibold"
              style={
                Platform.OS === "ios" && {
                  lineHeight: undefined,
                }
              }
              selectionColor={colors.black}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoFocus={true}
              value={phone}
              onChangeText={handleInputChange}
              maxLength={16}
              ref={phoneRef}
            />
          ) : (
            <TextInput
              className="border-b h-16 text-2xl font-poppins-semibold"
              selectionColor={colors.black}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCapitalize="none"
              value={email}
              onChangeText={handleInputChange}
              ref={emailRef}
            />
          )}

          {isError && (
            <Text className="text-red-500 text-sm text-center mt-4">
              {error.message}
            </Text>
          )}
        </View>

        {/* Submit */}
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
