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
      <View style={styles.content}>
        {/* Scrollable content */}
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <Text style={styles.title}>Get {plan.name}</Text>
          <Text style={styles.subtitle}>{plan.name_subtitle}</Text>

          {/* Features */}
          <View style={styles.featuresBox}>
            <Text style={styles.featureTitle}>Plan includes:</Text>
            <View style={styles.table}>
              {plan.features?.map((f: string, idx: number) => (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    idx === plan.features.length - 1 && styles.lastRow,
                  ]}
                >
                  <Text style={styles.tableCell}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Prices */}
        </ScrollView>

        {/* Bottom fixed section */}
        <ScrollView
          horizontal
          contentContainerStyle={styles.planRow}
          showsHorizontalScrollIndicator={false}
        >
          {/* Week */}
          <TouchableOpacity
            style={[
              styles.planCard,
              { marginLeft: 10 },
              selectedPlan === "week" && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan("week")}
          >
            <Text style={styles.planLabelTitle}>1</Text>
            <Text style={styles.planLabel}>Week</Text>

            {plan.price_weekly_discount_percent > 0 ? (
              <View style={{ alignItems: "center" }}>
                {/* Giá gốc */}
                <Text style={[styles.planPrice, styles.discountPrice]}>
                  {Number(plan.price_weekly).toLocaleString()} {plan.currency}
                </Text>

                {/* Giá sau giảm */}
                <Text style={[styles.planPrice, { color: "red" }]}>
                  {Number(
                    plan.price_weekly *
                      (1 - plan.price_weekly_discount_percent / 100)
                  ).toLocaleString()}{" "}
                  {plan.currency}
                </Text>

                {/* Box SAVE */}
                <View style={styles.planDiscountPercent}>
                  <Text style={styles.planDiscountPercentText}>
                    SAVE {plan.price_weekly_discount_percent}%
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.planPrice}>
                {Number(plan.price_weekly).toLocaleString()} {plan.currency}
              </Text>
            )}
          </TouchableOpacity>

          {/* Month */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === "month" && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan("month")}
          >
            <Text style={styles.planLabelTitle}>1</Text>
            <Text style={styles.planLabel}>Month</Text>

            {plan.price_monthly_discount_percent > 0 ? (
              <View style={{ alignItems: "center" }}>
                <Text style={[styles.planPrice, styles.discountPrice]}>
                  {Number(plan.price_monthly).toLocaleString()} {plan.currency}
                </Text>

                <Text style={[styles.planPrice, { color: "red" }]}>
                  {Number(
                    plan.price_monthly *
                      (1 - plan.price_monthly_discount_percent / 100)
                  ).toLocaleString()}{" "}
                  {plan.currency}
                </Text>

                <View style={styles.planDiscountPercent}>
                  <Text style={styles.planDiscountPercentText}>
                    SAVE {plan.price_monthly_discount_percent}%
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.planPrice}>
                {Number(plan.price_monthly).toLocaleString()} {plan.currency}
              </Text>
            )}
          </TouchableOpacity>

          {/* Year */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === "year" && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan("year")}
          >
            <Text style={styles.planLabelTitle}>1</Text>
            <Text style={styles.planLabel}>Year</Text>

            {plan.price_yearly_discount_percent > 0 ? (
              <View style={{ alignItems: "center" }}>
                <Text style={[styles.planPrice, styles.discountPrice]}>
                  {Number(plan.price_yearly).toLocaleString()} {plan.currency}
                </Text>

                <Text style={[styles.planPrice, { color: "red" }]}>
                  {Number(
                    plan.price_yearly *
                      (1 - plan.price_yearly_discount_percent / 100)
                  ).toLocaleString()}{" "}
                  {plan.currency}
                </Text>

                <View style={styles.planDiscountPercent}>
                  <Text style={styles.planDiscountPercentText}>
                    SAVE {plan.price_yearly_discount_percent}%
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.planPrice}>
                {Number(plan.price_yearly).toLocaleString()} {plan.currency}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
          {/* <Text style={styles.footer}></Text> */}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primaryDark,
  },
  scroll: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    marginBottom: 6,
    color: theme.colors.textLight,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    color: theme.colors.textLight,
    fontFamily: "Poppins-Regular",
  },
  featuresBox: {
    width: "100%",
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: theme.colors.textLight,
  },
  featureItem: {
    fontSize: 14,
    marginVertical: 4,
    fontFamily: "Poppins-Regular",
    color: theme.colors.textLight,
  },
  planRow: {
    marginBottom: 80,
    height: 180,
    paddingTop: 20,
  },
  planCard: {
    backgroundColor: "white",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 8,
    width: 160,
    borderWidth: 1,
    borderColor: "#FFFFFF00",
  },
  planLabelTitle: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
  },
  planLabel: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
  },
  planPrice: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginTop: 10,
  },
  discountPrice: {
    textDecorationLine: "line-through",
    color: "gray",
    fontSize: 12,
    marginTop: 0,
  },
  planDiscountPercent: {
    backgroundColor: "#FFEAEA",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planDiscountPercentText: {
    fontSize: 12,
    color: "red",
    fontFamily: "Poppins-SemiBold",
  },
  continueBtn: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: "center",
  },
  continueText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  footer: {
    fontSize: 11,
    textAlign: "center",
    color: theme.colors.textLight,
    fontFamily: "Poppins-SemiBold",
    lineHeight: 16,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  bottomSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: theme.colors.primaryDark,
  },
  table: {
    width: "100%",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableBullet: {
    fontSize: 14,
    marginRight: 8,
    color: theme.colors.textLight,
    fontFamily: "Poppins-SemiBold",
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: theme.colors.textLight,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  planCardSelected: {
    borderWidth: 1,
    borderColor: theme.colors.textDark,
  },
});
