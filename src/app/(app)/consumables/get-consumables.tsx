import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "~/constants/theme";
import { getConsumableById } from "~/service/consumableService";
import { getProfile } from "~/service/userService";
import { supabase } from "@/lib/supabase";
import { Loader } from "@/components/loader";

export default function GetPlan() {
  const { consumableId } = useLocalSearchParams<{ consumableId: string }>();
  const [consumable, setConsumable] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConsumable, setSelectedConsumable] = useState<number>(1);

  useEffect(() => {
    const fetchConsumable = async () => {
      try {
        const data = await getConsumableById(consumableId);
        setConsumable(data);
      } catch (err) {
        console.error("Error loading consumable:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConsumable();
  }, [consumableId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loader />
      </SafeAreaView>
    );
  }

  if (!consumable) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Plan not found</Text>
      </SafeAreaView>
    );
  }

  const handleContinue = async () => {
    try {
      if (!consumable) return;

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        Alert.alert("Not logged in", "Please log in to continue.");
        return;
      }

      const userId = await getProfile();

      const selectedPkg = consumable.packages.find(
        (pkg) => pkg.id === selectedConsumable
      );

      if (!selectedPkg) {
        Alert.alert("Selection Error", "Please select a valid package.");
        return;
      }

      const amount = selectedPkg.price;

      const { data: existingPayment, error: selectError } = await supabase
        .from("consumable_payments")
        .select("*")
        .eq("user_id", userId?.id)
        .eq("consumable_id", consumable.id)
        .eq("consumable_amount", selectedPkg.quantity)
        .eq("status", "pending")
        .eq("currency", selectedPkg.currency)
        .single();

      if (selectError && selectError.code !== "PGRST116") {
        console.error("Select error:", selectError);
        Alert.alert("Payment Error", "Could not query payment row.");
        return;
      }

      let paymentRow;

      if (existingPayment) {
        paymentRow = existingPayment;
      } else {
        const { data, error: insertError } = await supabase
          .from("consumable_payments")
          .insert([
            {
              user_id: userId?.id,
              consumable_id: consumable.id,
              consumable_amount: selectedPkg.quantity,
              status: "pending",
              currency: selectedPkg.currency,
            },
          ])
          .select()
          .single();

        if (insertError || !data) {
          console.error("Insert error:", insertError);
          Alert.alert("Payment Error", "Could not create payment row.");
          return;
        }

        paymentRow = data;
      }

      router.back();
      router.push({
        pathname: "/qr/qr-page",
        params: {
          paymentId: paymentRow.id,
          amount: amount.toString(),
          currency: selectedPkg.currency,
          type: "consumable",
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
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Get {consumable.name}</Text>
          <Text style={styles.subtitle}>{consumable.name_subtitle}</Text>
        </ScrollView>
        <ScrollView
          horizontal
          contentContainerStyle={styles.planRow}
          showsHorizontalScrollIndicator={false}
        >
          {consumable.packages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[
                styles.planCard,
                selectedConsumable === pkg.id && styles.planCardSelected,
              ]}
              onPress={() => setSelectedConsumable(pkg.id)}
            >
              <Text style={styles.planLabelTitle}>{pkg.quantity}</Text>
              <Text style={styles.planLabel}>{consumable.name}</Text>

              {pkg.discount_percent > 0 ? (
                <View style={{ alignItems: "center" }}>
                  <Text style={[styles.planPrice, styles.discountPrice]}>
                    {Number(pkg.price).toLocaleString()} {pkg.currency}
                  </Text>

                  <Text style={[styles.planPrice, { color: "red" }]}>
                    {Number(
                      pkg.price * (1 - pkg.discount_percent / 100)
                    ).toLocaleString()}{" "}
                    {pkg.currency}
                  </Text>

                  <View style={styles.planDiscountPercent}>
                    <Text style={styles.planDiscountPercentText}>
                      SAVE {pkg.discount_percent}%
                    </Text>
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.planPrice}>
                    {Number(pkg.price).toLocaleString()} {pkg.currency}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
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
