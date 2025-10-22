import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../../../constants/theme";
import { usePayment } from "../../../store/payment-store";

export default function QRPage() {
  const router = useRouter();
  const { payment } = usePayment();

  useEffect(() => {
    if (!payment) {
      router.replace("/");
    }
  }, [payment]);

  if (!payment) {
    return null;
  }

  const {
    amount,
    type,
    plan_due_date,
    paymentId,
    currency,
    name,
    amountNumber,
  } = payment;

  const formattedAmount = Number(amount).toLocaleString();

  let qrUrl = "";
  if (type === "plan") {
    qrUrl = `https://qr.sepay.vn/img?acc=VQRQAEKJS2386&bank=MBBank&amount=${amount}&des=${type}${plan_due_date}${paymentId}`;
  } else {
    qrUrl = `https://qr.sepay.vn/img?acc=VQRQAEKJS2386&bank=MBBank&amount=${amount}&des=${type}${paymentId}`;
  }

  const decodePlanDueDate = (code: string | undefined) => {
    if (!code) return "";
    const map: Record<string, string> = {
      "1w": "1 week",
      "1m": "1 month",
      "1y": "1 year",
    };
    return map[code] ?? code;
  };

  const handleCancel = () => {
    router.back();
  };

  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 270],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan to Complete Payment</Text>
        <Text style={styles.subtitle}>
          Pay{" "}
          <Text style={styles.amount}>
            {formattedAmount} {currency}
          </Text>
        </Text>
      </View>

      <View style={styles.qrCard}>
        <Image source={{ uri: qrUrl }} style={styles.qrCode} />

        <Animated.View
          style={[
            styles.scanBar,
            {
              transform: [{ translateY: scanTranslateY }],
            },
          ]}
        />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Payment Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Plan name:</Text>
          <Text style={styles.infoValue}>{name}</Text>
        </View>
        {amountNumber && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount:</Text>
            <Text style={styles.infoValue}>{amountNumber}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type:</Text>
          <Text style={styles.infoValue}>{type}</Text>
        </View>
        {plan_due_date && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>
              {decodePlanDueDate(plan_due_date)}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
        <Text style={styles.cancelText}>Cancel Payment</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
    backgroundColor: "#f9fafb",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: "Poppins-SemiBold",
    color: theme.colors.textDark,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#4b5563",
    marginTop: 5,
  },
  amount: {
    fontFamily: "Poppins-SemiBold",
    color: theme.colors.textDark,
  },
  qrCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    marginVertical: 20,
    borderColor: "#e5e7eb",
    borderWidth: 1,
  },
  qrCode: {
    width: 250,
    height: 250,
  },
  infoCard: {
    width: "50%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderColor: "#e5e7eb",
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: theme.colors.textDark,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  infoLabel: {
    fontFamily: "Poppins-Regular",
    color: "#6b7280",
  },
  infoValue: {
    fontFamily: "Poppins-Medium",
    color: theme.colors.textDark,
  },
  cancelBtn: {
    marginTop: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    backgroundColor: theme.colors.primaryDark,
    shadowColor: theme.colors.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderRadius: 30,
  },
  cancelText: {
    color: "white",
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
  },
  scanBar: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: theme.colors.textLighterGray,
    borderRadius: 2,
    opacity: 0.5,
  },
});
