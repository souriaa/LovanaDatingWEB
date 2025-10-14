import LottieView from "lottie-react-native";
import { ActivityIndicator, Platform, View } from "react-native";

export const Loader = () => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "white",
    }}
  >
    {Platform.OS !== "web" ? (
      <LottieView
        autoPlay
        style={{ width: 200, height: 200 }}
        source={require("../../assets/images/loading.json")}
      />
    ) : (
      <ActivityIndicator size="large" color="#000" />
    )}
  </View>
);
