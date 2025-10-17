import LottieView from "lottie-react-native";
import { ActivityIndicator, Platform, View } from "react-native";
import { theme } from "~/constants/theme";

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
      <ActivityIndicator size="large" color={theme.colors.primaryDark} />
    )}
  </View>
);
