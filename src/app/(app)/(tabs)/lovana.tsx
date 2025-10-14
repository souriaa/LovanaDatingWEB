import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../../../constants/theme";
import { useMyProfile } from "../../../api/my-profile";
import { Card } from "../../../components/card";
import MyPayPlan from "../../../components/my-pay-plan";
import { useTabBar } from "../../../context/tabBarContext";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function Page() {
  const { data: profile, refetch } = useMyProfile(); // assuming useMyProfile returns refetch
  const [selectedCard, setSelectedCard] = useState<"pay-plan" | "safety">(
    "pay-plan"
  );
  const { tabBarOpacity } = useTabBar();
  const scrollOffset = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollOffset } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        if (currentScrollY <= 0) {
          Animated.timing(tabBarOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (
          currentScrollY > lastScrollY.current &&
          currentScrollY > 50
        ) {
          Animated.timing(tabBarOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (currentScrollY < lastScrollY.current) {
          Animated.timing(tabBarOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
        lastScrollY.current = currentScrollY;
      },
    }
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch?.();
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: 20 }}>
      <AnimatedScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View className="px-5 border-b border-neutral-300">
          <View className="flex-row items-center justify-between">
            <Text
              className="text-2xl font-poppins-semibold"
              style={{ color: theme.colors.primaryDark }}
            >
              Lovana
            </Text>
          </View>
          <View className="items-center gap-2 my-12">
            <Pressable
              className="h-32 aspect-square rounded-full border-4 p-1"
              onPress={() => router.push("/profile")}
              style={{ borderColor: theme.colors.primaryDark }}
            >
              <Image
                source={profile?.avatar_url}
                className="flex-1 rounded-full bg-neutral-400"
              />
            </Pressable>
            <Text className="text-2xl font-poppins-semibold">
              {profile?.first_name}
            </Text>
          </View>
        </View>
        <View style={styles.cardsContainer}>
          <Card
            key="pay-plan"
            title="My Pay Plan"
            selected={selectedCard === "pay-plan"}
            onPress={() => setSelectedCard("pay-plan")}
          />
          <Card
            key="safety"
            title="Safety & Wellbeing"
            selected={selectedCard === "safety"}
            onPress={() => setSelectedCard("safety")}
          />
        </View>
        {selectedCard === "pay-plan" && <MyPayPlan refreshKey={refreshKey} />}
        {selectedCard === "safety" && (
          <View className="items-center mt-10">
            <Text className="text-lg font-semibold">
              Safety & Wellbeing coming soon...
            </Text>
          </View>
        )}
      </AnimatedScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardsContainer: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    paddingVertical: 10,
  },
});
