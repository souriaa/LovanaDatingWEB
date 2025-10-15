import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../../global.css";
import { AlertProvider } from "../components/alert-provider";
import { fonts } from "../constants/fonts";
import { AuthProvider } from "../store/auth";
import { PaymentProvider } from "../store/payment-store";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function Layout() {
  const [loaded, error] = useFonts({
    ...fonts,
    Ionicons: require("../../assets/fonts/Ionicons.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AlertProvider>
            <PaymentProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen
                  name="(app)"
                  options={{
                    animation: "none",
                  }}
                />
                <Stack.Screen
                  name="(auth)"
                  options={{
                    animation: "none",
                  }}
                />
              </Stack>
            </PaymentProvider>
          </AlertProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
