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
import { getConsumableById } from "../../../../service/consumableService";
import { getProfile } from "../../../../service/userService";
import Header from "../../../components/Header";
import { Loader } from "../../../components/loader";
import { supabase } from "../../../lib/supabase";

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
        <Header title={`Get ${consumable.name}`} mb={0} />

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.subtitle}>{consumable.name_subtitle}</Text>

          {/* Plan cards in a vertical column */}
          {consumable.packages.map((pkg) => (
            <View style={styles.planCardContainer}>
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

                    <Text style={[styles.planPrice, { color: "#E53935" }]}>
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
            </View>
          ))}
        </ScrollView>
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.textLight,
    padding: 50,
    paddingTop: 20,
  },
  content: { flex: 1, justifyContent: "space-between" },
  scroll: { padding: 20 },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: theme.colors.textDark,
    textAlign: "center",
    marginBottom: 20,
  },
  planCardContainer: {
    alignItems: "center",
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors.textLighterGray,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    width: "50%",
  },
  planCardSelected: {
    borderColor: theme.colors.primaryDark,
    borderWidth: 2,
    shadowOpacity: 0.15,
  },
  planLabelTitle: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 6,
    textAlign: "center",
  },
  planLabel: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  planPrice: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
    marginTop: 8,
  },
  discountPrice: {
    textDecorationLine: "line-through",
    color: "#9E9E9E",
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    marginBottom: 4,
  },
  planDiscountPercent: {
    backgroundColor: "#FFEAEA",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  planDiscountPercentText: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
    color: "#E53935",
  },
  bottomSection: {
    paddingTop: 50,
    backgroundColor: theme.colors.textLight,
    alignItems: "center",
  },
  continueBtn: {
    width: "50%",
    backgroundColor: theme.colors.primaryDark,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  continueText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
  },
});
