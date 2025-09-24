import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

export default function QRPage() {
  const { paymentId, planName, amount, currency } = useLocalSearchParams<{
    paymentId: string;
    planName: string;
    amount: string;
    currency: string;
  }>();
  const router = useRouter();

  const qrUrl = `https://qr.sepay.vn/img?acc=VQRQAEKJS2386&bank=MBBank&amount=${amount}&des=${paymentId}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Payment</Text>
      <Text style={styles.subtitle}>
        Please scan the QR code to pay {Number(amount).toLocaleString()}{" "}
        {currency}
      </Text>

      <Image source={{ uri: qrUrl }} style={styles.qrCode} />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    fontFamily: "Poppins-Bold",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  qrCode: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  backBtn: {
    padding: 12,
    backgroundColor: "#111827",
    borderRadius: 8,
  },
  backText: {
    color: "white",
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
});
