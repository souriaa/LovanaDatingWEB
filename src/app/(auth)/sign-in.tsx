import { VideoBackground } from "@/components/video-background";
import { Link, Stack } from "expo-router";
import { Pressable, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "~/constants/theme";

export default function Page() {
  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar barStyle={"light-content"} />
      <VideoBackground source={require("~/assets/images/background.mp4")}>
        <SafeAreaView className="flex-1 p-10">
          <View className="flex-1 items-center pt-14">
            <Text className="text-white font-poppins-semibold" style={{fontSize: 50}}>
              Lovana
            </Text>
            <View className="h-4" />
            <Text className="text-white text-xl font-poppins-semibold">
              AI-powered dating app
            </Text>
            <Text className="text-white text-xl font-poppins-semibold">
               Match right - Love long
            </Text>
          </View>
          <Link href={"/phone"} asChild>
            <Pressable className="h-16 items-center justify-center rounded-full" style={{backgroundColor: theme.colors.primaryDark}}>
              <Text className="text-white text-lg font-poppins-semibold">
                Sign in with Email
              </Text>
            </Pressable>
          </Link>
        </SafeAreaView>
      </VideoBackground>
    </View>
  );
}
