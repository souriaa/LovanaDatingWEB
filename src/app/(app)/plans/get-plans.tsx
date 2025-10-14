import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../../../constants/theme";
import { getPlanById } from "../../../../service/planService";
import { getProfile } from "../../../../service/userService";
import Header from "../../../components/Header";
import { Loader } from "../../../components/loader";
import { supabase } from "../../../lib/supabase";

export default function GetPlan() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>("week");

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const data = await getPlanById(planId);
        setPlan(data);
      } catch (err) {
        console.error("Error loading plan:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [planId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loader />
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Plan not found</Text>
      </SafeAreaView>
    );
  }

  const handleContinue = async () => {
    try {
      if (!plan) return;

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        Alert.alert("Not logged in", "Please log in to continue.");
        return;
      }

      const userId = await getProfile();

      let amount = 0;
      let plan_due_date = "";
      if (selectedPlan === "week") {
        amount = plan.price_weekly;
        plan_due_date = "1w";
      }
      if (selectedPlan === "month") {
        amount = plan.price_monthly;
        plan_due_date = "1m";
      }
      if (selectedPlan === "year") {
        amount = plan.price_yearly;
        plan_due_date = "1y";
      }

      const { data: existingPayment, error: checkError } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", userId?.id)
        .eq("plan_id", plan.id)
        .eq("status", "pending")
        .maybeSingle();

      if (checkError) {
        console.error("Check error:", checkError);
        Alert.alert("Payment Error", "Could not check existing payment.");
        return;
      }

      let paymentId;

      if (existingPayment) {
        paymentId = existingPayment;
      } else {
        const { data: newPayment, error: insertError } = await supabase
          .from("payments")
          .insert([
            {
              user_id: userId?.id,
              plan_id: plan.id,
              status: "pending",
            },
          ])
          .select()
          .single();

        if (insertError || !newPayment) {
          console.error("Insert error:", insertError);
          Alert.alert("Payment Error", "Could not create payment row.");
          return;
        }

        paymentId = newPayment;
      }

      router.back();
      router.push({
        pathname: "/qr/qr-page",
        params: {
          paymentId: paymentId.id,
          amount: amount.toString(),
          currency: plan.currency,
          type: "plan",
          plan_due_date,
        },
      });
    } catch (err) {
      console.error("Error in handleContinue:", err);
      Alert.alert("Payment Error", "Something went wrong.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWeb}>
        <Header title={`Get ${plan.name}`} mb={0} />

        <View style={styles.mainRow}>
          {/* Left column: Plan Details */}
          <ScrollView style={styles.leftColumn}>
            <Text style={styles.subtitleWeb}>{plan.name_subtitle}</Text>

            <View style={styles.featuresBoxWeb}>
              <Text style={styles.featureTitleWeb}>What's Included</Text>
              <View style={styles.tableWeb}>
                {plan.features?.map((f: string, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRowWeb,
                      idx === plan.features.length - 1 && styles.lastRowWeb,
                    ]}
                  >
                    <Text style={styles.tableCellWeb}>• {f}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Right column: Pricing & CTA */}
          <ScrollView
            style={styles.rightColumn}
            contentContainerStyle={{ gap: 25 }}
          >
            {["week", "month", "year"].map((p) => {
              const price =
                p === "week"
                  ? plan.price_weekly
                  : p === "month"
                    ? plan.price_monthly
                    : plan.price_yearly;
              const discount =
                p === "week"
                  ? plan.price_weekly_discount_percent
                  : p === "month"
                    ? plan.price_monthly_discount_percent
                    : plan.price_yearly_discount_percent;

              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.planCardWeb,
                    selectedPlan === p && styles.planCardSelectedWeb,
                  ]}
                  onPress={() => setSelectedPlan(p)}
                >
                  <Text style={styles.planLabelTitleWeb}>1</Text>
                  <Text style={styles.planLabelWeb}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>

                  {discount > 0 ? (
                    <View style={{ alignItems: "center" }}>
                      <Text
                        style={[styles.planPriceWeb, styles.discountPriceWeb]}
                      >
                        {Number(price).toLocaleString()} {plan.currency}
                      </Text>
                      <Text style={[styles.planPriceWeb, { color: "#E53935" }]}>
                        {Number(price * (1 - discount / 100)).toLocaleString()}{" "}
                        {plan.currency}
                      </Text>
                      <View style={styles.planDiscountPercentWeb}>
                        <Text style={styles.planDiscountPercentTextWeb}>
                          SAVE {discount}%
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.planPriceWeb}>
                      {Number(price).toLocaleString()} {plan.currency}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        <TouchableOpacity
          style={styles.continueBtnWeb}
          onPress={handleContinue}
        >
          <Text style={styles.continueTextWeb}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.textLight,
  },
  contentWeb: {
    flex: 1,
    padding: 50,
    paddingTop: 20,
  },
  mainRow: {
    flexDirection: "row",
    gap: 50,
    paddingTop: 50,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    width: 320,
  },
  subtitleWeb: {
    fontSize: 18,
    color: theme.colors.textDark,
    fontFamily: "Poppins-Regular",
    lineHeight: 24,
    marginBottom: 25,
  },
  featuresBoxWeb: {
    width: "100%",
    marginBottom: 30,
  },
  featureTitleWeb: {
    fontSize: 16,
    color: theme.colors.primaryDark,
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "Poppins-SemiBold",
  },
  tableWeb: {
    width: "100%",
    borderRadius: 10,
    borderColor: "#e5e7eb",
    borderWidth: 1,
    overflow: "hidden",
  },
  tableRowWeb: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  lastRowWeb: {
    borderBottomWidth: 0,
  },
  tableCellWeb: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textDark,
    lineHeight: 22,
    fontFamily: "Poppins-Regular",
  },
  planCardWeb: {
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    transition: "all 0.2s",
  },
  planCardSelectedWeb: {
    borderColor: theme.colors.primaryDark,
    shadowOpacity: 0.15,
    borderWidth: 2,
  },
  planLabelTitleWeb: {
    fontSize: 26,
    fontFamily: "Poppins-Bold",
    marginBottom: 6,
  },
  planLabelWeb: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 12,
  },
  planPriceWeb: { fontSize: 20, fontFamily: "Poppins-Bold" },
  discountPriceWeb: {
    textDecorationLine: "line-through",
    color: "#9E9E9E",
    fontSize: 14,
    marginBottom: 4,
    fontFamily: "Poppins-Regular",
  },
  planDiscountPercentWeb: {
    backgroundColor: "#FFEAEA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  planDiscountPercentTextWeb: {
    fontSize: 13,
    color: "#E53935",
    fontFamily: "Poppins-SemiBold",
  },
  continueBtnWeb: {
    backgroundColor: theme.colors.primaryDark,
    paddingVertical: 18,
    borderRadius: 35,
    alignSelf: "center",
    width: "50%",
    marginTop: 50,
  },
  continueTextWeb: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Poppins-SemiBold",
    textAlign: "center",
  },
});
