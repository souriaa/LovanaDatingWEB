import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useState } from "react";
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
  isSelected: boolean;
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
  isSelected,
}: PayPlanCardProps) {
  const bgColor = (() => {
    switch (title.toLowerCase()) {
      case "light":
        return theme.colors.primaryLight;
      case "premium":
        return theme.colors.primary;
      case "lovana":
        return theme.colors.primaryDark;
      default:
        return theme.colors.primaryLight;
    }
  })();

  const [upgradeText, setUpgradeText] = useState(`From ${weeklyPrice}`);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState(null);

  const inactiveColor = theme.colors.textLightGray;

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

          if (plan.plan_id === planId) {
            if (dueDate && now < dueDate) {
              setActivePlan(plan.plan_id);
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
        isFirst ? { marginBottom: 10 } : isLast ? { marginTop: 10 } : {},
      ]}
    >
      <View
        style={[
          styles.premiumBox,
          { backgroundColor: isSelected ? bgColor : inactiveColor },
          !isSelected && { opacity: 0.7 },
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
            <ActivityIndicator size="small" color={theme.colors.primaryDark} />
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    fetchPlans();
  }, [profile?.id, refreshKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPlans();
    } catch (err) {
      console.error("Failed to refresh MyPayPlan:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const lovanaPlan = plans.find((p) => p.name.toLowerCase() === "lovana");

  return (
    <SafeAreaView className="flex-1 bg-white mt-5">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Plans */}
        <View style={styles.planContainerContainer}>
          <View style={styles.planContainer}>
            {loading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator
                  size="large"
                  color={theme.colors.primaryDark}
                />
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: "space-between" }}>
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
                    isSelected={selectedIndex === index}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.featureTable}>
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

                  {lovanaPlan?.features.map((feature, i) => {
                    const selectedPlan = plans[selectedIndex];
                    const hasFeature = selectedPlan.features.includes(feature);

                    return (
                      <View
                        key={i}
                        style={[
                          styles.featureRow,
                          i === lovanaPlan.features.length - 1 && {
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
                                : selectedPlan.name.toLowerCase() === "light"
                                  ? theme.colors.primaryLight
                                  : selectedPlan.name.toLowerCase() ===
                                      "premium"
                                    ? theme.colors.primary
                                    : selectedPlan.name.toLowerCase() ===
                                        "lovana"
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
                              : selectedPlan.name.toLowerCase() === "light"
                                ? theme.colors.primaryLight
                                : selectedPlan.name.toLowerCase() === "premium"
                                  ? theme.colors.primary
                                  : selectedPlan.name.toLowerCase() === "lovana"
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
    width: "100%",
    flex: 1,
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
    flex: 1,
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
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    paddingBottom: 10,
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    height: 50,
  },
  featureText: {
    fontSize: 14,
    color: "#111827",
    fontFamily: "Poppins-SemiBold",
  },
  page: {
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    flex: 1,
  },
  comparisonContainer: {
    display: "flex",
  },
  comparisonContainerContainer: {
    backgroundColor: theme.colors.backgroundLighterGray,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  planContainerContainer: {
    display: "flex",
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 50,
  },
  planContainer: {
    flex: 2,
    margin: 10,
    marginTop: 0,
  },
  featureTable: {
    flex: 3,
    margin: 10,
    marginTop: 0,
  },
});
