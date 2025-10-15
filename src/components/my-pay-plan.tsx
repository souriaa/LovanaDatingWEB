import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";
import { getLikes } from "../../service/likeService";
import { getPlans } from "../../service/planService";
import { getProfilePlansByUser } from "../../service/profilePlanService";
import { getProfile } from "../../service/userService";
import { useMyProfile } from "../api/my-profile";

const { width: screenWidth } = Dimensions.get("window");

type PayPlanCardProps = {
  planId: string;
  title: string;
  subtitle: string;
  expiry?: string;
  weeklyPrice: string;
  isFirst?: boolean;
  isLast?: boolean;
  onPress?: () => void;
  i: number;
};

function PayPlanCard({
  planId,
  title,
  subtitle,
  weeklyPrice,
  isFirst,
  isLast,
  onPress,
  i,
}: PayPlanCardProps) {
  const cardWidth = screenWidth * 0.23;
  const cardColors = [
    theme.colors.primaryLight,
    theme.colors.primary,
    theme.colors.primaryDark,
  ];
  const bgColor = cardColors[i % cardColors.length];

  const [upgradeText, setUpgradeText] = useState(`From ${weeklyPrice}`);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState(null);

  useEffect(() => {
    const fetchProfilePlan = async () => {
      try {
        const profile = await getProfile();
        if (!profile?.id) return;

        const profilePlans = await getProfilePlansByUser(profile.id);

        if (profilePlans && profilePlans.length > 0) {
          const plan = profilePlans[0];

          const now = new Date();
          const dueDate = plan.plan_due_date
            ? new Date(plan.plan_due_date)
            : null;

          setActivePlan(plan.plan_id);
          if (plan.plan_id === planId) {
            if (dueDate && now < dueDate) {
              setUpgradeText(`Plan expired on ${dueDate.toLocaleDateString()}`);
            } else {
              setUpgradeText(`From ${weeklyPrice}`);
            }
          } else {
            setUpgradeText(`From ${weeklyPrice}`);
          }
        }
      } catch (err) {
        console.error("fetchProfilePlan error:", err);
        setUpgradeText(`From ${weeklyPrice}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfilePlan();
  }, [planId, weeklyPrice]);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.page,
        { width: cardWidth },
        isFirst
          ? { marginLeft: 20 }
          : isLast
            ? { marginRight: 20 }
            : { marginHorizontal: 20 },
      ]}
    >
      <View
        style={[
          styles.premiumBox,
          { width: cardWidth, backgroundColor: bgColor },
        ]}
      >
        <Text style={styles.premiumTitle}>{title}</Text>
        <Text style={styles.premiumSubtitle}>{subtitle}</Text>
        <TouchableOpacity
          style={styles.activeBadge}
          activeOpacity={0.7}
          disabled={activePlan === planId}
          onPress={() =>
            activePlan !== planId &&
            router.push(`/plans/get-plans?planId=${planId}`)
          }
        >
          {loading ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <Text style={styles.activeText}>{upgradeText}</Text>
          )}
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

export default function MyPayPlan({ refreshKey }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: profile } = useMyProfile();
  const [superLikes, setSuperLikes] = useState<number | null>(null);
  const [timeExtender, setTimeExtender] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const fetchPlans = async () => {
    try {
      const data = await getPlans();
      if (!data) return;

      let orderedPlans = [...data];

      if (profile?.id) {
        const profilePlans = await getProfilePlansByUser(profile.id);
        if (profilePlans && profilePlans.length > 0) {
          const plan = profilePlans[0];
          const planDueDate = new Date(plan.plan_due_date);
          const now = new Date();

          if (planDueDate > now) {
            const activePlanId = plan.plan_id;
            orderedPlans = data.sort((a, b) =>
              a.id === activePlanId ? -1 : b.id === activePlanId ? 1 : 0
            );
          } else {
            orderedPlans = data;
          }
        }
      }

      setPlans(orderedPlans);
    } catch (err) {
      console.error("Error loading plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLikes = async () => {
    if (!profile?.id) return;
    try {
      const data = await getLikes(profile.id);
      setSuperLikes(data?.super_likes_remaining ?? 0);
      setTimeExtender(data?.time_extend_remaining ?? 0);
    } catch (err) {
      console.error("Error loading super likes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchLikes();
  }, [profile?.id, refreshKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPlans();
      await fetchLikes();
    } catch (err) {
      console.error("Failed to refresh MyPayPlan:", err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white mt-5">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Perks row */}
        <View style={styles.perksRow}>
          <TouchableOpacity
            style={styles.perkCard}
            onPress={() =>
              router.push({
                pathname: "/consumables/get-consumables",
                params: { consumableId: 1 },
              })
            }
          >
            <Ionicons
              name="star-outline"
              size={24}
              color={theme.colors.primaryDark}
            />
            <Text style={styles.perkTitle}>Super Likes</Text>
            <Text style={styles.perkSubtitle}>{superLikes}</Text>
          </TouchableOpacity>

          {/* Time Extender */}
          <TouchableOpacity
            style={styles.perkCard}
            onPress={() =>
              router.push({
                pathname: "/consumables/get-consumables",
                params: { consumableId: 2 },
              })
            }
          >
            <Ionicons
              name="time-outline"
              size={24}
              color={theme.colors.primaryDark}
            />
            <Text style={styles.perkTitle}>Time Extender</Text>
            <Text style={styles.perkSubtitle}>{timeExtender}</Text>
          </TouchableOpacity>
        </View>

        {/* Plans */}
        <View style={{ marginTop: 20 }}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.textDark} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              ref={scrollRef}
              style={{ cursor: "grab" }}
              onMouseDown={(e) => {
                setIsDown(true);
                setStartX(e.pageX);
                if (scrollRef.current)
                  setScrollLeft(scrollRef.current.scrollLeft || 0);
              }}
              onMouseUp={() => setIsDown(false)}
              onMouseLeave={() => setIsDown(false)}
              onMouseMove={(e) => {
                if (!isDown || !scrollRef.current) return;
                const walk = e.pageX - startX;
                scrollRef.current.scrollTo({
                  x: scrollLeft - walk,
                  animated: false,
                });
              }}
            >
              {plans.map((plan, index) => (
                <PayPlanCard
                  key={plan.id}
                  planId={plan.id}
                  title={plan.name}
                  subtitle={plan.name_subtitle}
                  features={plan.features || []}
                  weeklyPrice={
                    Number(plan.price_weekly).toLocaleString() +
                    " " +
                    plan.currency
                  }
                  i={index}
                  isFirst={index === 0}
                  isLast={index === plans.length - 1}
                  onPress={() => setSelectedIndex(index)}
                />
              ))}
            </ScrollView>
          )}
          {plans.length > 0 && (
            <MotiView
              key={selectedIndex}
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 500 }}
              style={styles.comparisonContainer}
            >
              <View style={styles.comparisonContainerContainer}>
                <Text style={styles.featuresHeader}>
                  {plans[selectedIndex].name}
                </Text>

                {plans[plans.length - 1].features.map((feature, i) => {
                  const selectedPlan = plans[selectedIndex];
                  const hasFeature = selectedPlan.features.includes(feature);

                  return (
                    <View
                      key={i}
                      style={[
                        styles.featureRow,
                        i === plans[plans.length - 1].features.length - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.featureText,
                          {
                            color: !hasFeature
                              ? theme.colors.textLighterGray
                              : selectedPlan.name === "Plus"
                                ? theme.colors.primaryLight
                                : selectedPlan.name === "Premium"
                                  ? theme.colors.primary
                                  : selectedPlan.name === "Lovana"
                                    ? theme.colors.primaryDark
                                    : theme.colors.primary,
                          },
                        ]}
                      >
                        {feature}
                      </Text>
                      <Ionicons
                        name={hasFeature ? "checkmark-outline" : ""}
                        size={22}
                        color={
                          !hasFeature
                            ? theme.colors.textLighterGray
                            : selectedPlan?.name === "Plus"
                              ? theme.colors.primaryLight
                              : selectedPlan?.name === "Premium"
                                ? theme.colors.primary
                                : selectedPlan?.name === "Lovana"
                                  ? theme.colors.primaryDark
                                  : theme.colors.primary
                        }
                      />
                    </View>
                  );
                })}
              </View>
            </MotiView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  perksRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    paddingHorizontal: 50,
  },
  perkCard: {
    flex: 1,
    padding: 12,
    backgroundColor: theme.colors.backgroundGray,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    maxWidth: "20%",
  },
  perkTitle: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: "Poppins-Bold",
  },
  perkSubtitle: {
    fontSize: 12,
    color: theme.colors.textLightGray,
    fontFamily: "Poppins-SemiBold",
  },
  premiumBox: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    paddingBottom: 16,
    alignItems: "center",
  },
  premiumTitle: {
    fontSize: 20,
    marginBottom: 4,
    color: theme.colors.textLight,
    fontFamily: "Poppins-Bold",
  },
  premiumSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
    color: theme.colors.textLight,
    fontFamily: "Poppins-SemiBold",
  },
  activeBadge: {
    backgroundColor: "white",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeText: {
    fontSize: 13,
    color: "#111827",
    fontFamily: "Poppins-Bold",
  },
  featuresHeader: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: "Poppins-Bold",
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
  },
  featureText: {
    fontSize: 14,
    color: "#111827",
    fontFamily: "Poppins-SemiBold",
  },
  page: {
    justifyContent: "flex-start",
    alignItems: "center",
  },
  comparisonContainer: {
    display: "flex",
    alignItems: "center",
  },
  comparisonContainerContainer: {
    width: "60%",
    backgroundColor: theme.colors.backgroundLighterGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginHorizontal: 20,
  },
});
