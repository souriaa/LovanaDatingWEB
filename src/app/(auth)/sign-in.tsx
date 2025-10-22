import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import {
  Dimensions,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { theme } from "../../../constants/theme";
import { VideoBackground } from "../../components/video-background";

const isMobile =
  typeof navigator !== "undefined" &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const { width } = Dimensions.get("window");
const breakpoint = 600;

export default function Page() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar barStyle={"light-content"} />
      <VideoBackground
        source={require("../../../assets/images/background.mp4")}
        style={styles.videoBackground}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Lovana</Text>
          <Text style={styles.subtitle}>AI-powered dating app</Text>
          <Text style={styles.subtitle}>Match right - Love long</Text>
          <Ionicons name="logo-android" size={0} color={"#FFFFFF00"} />

          {isMobile ? (
            <View
              style={[
                styles.downloadContainer,
                { flexDirection: width < breakpoint ? "column" : "row" },
              ]}
            >
              <Pressable
                style={[styles.downloadBtn, styles.androidBtn]}
                onPress={() =>
                  window.open(
                    "https://drive.google.com/drive/folders/1SmA-QoeasYzFFfMJd_qJcSn9mVuO4qbC?usp=sharing",
                    "_blank"
                  )
                }
              >
                <Text style={styles.downloadText}>Download For Android</Text>
                <Ionicons name="logo-android" size={48} color={"#3DDC84"} />
              </Pressable>

              <Pressable style={[styles.downloadBtn, styles.iosBtn]} disabled>
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.downloadText}>Download For iOS</Text>
                  <Text style={styles.downloadSubText}>Coming Soon</Text>
                </View>
                <Ionicons
                  name="logo-apple"
                  size={48}
                  color="#FFFFFF"
                  style={{ marginTop: 8 }}
                />
              </Pressable>
            </View>
          ) : (
            <Link href="/phone" asChild>
              <Pressable style={styles.signInBtn}>
                <Text style={styles.signInText}>Sign in</Text>
              </Pressable>
            </Link>
          )}
        </View>
      </VideoBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
  },
  videoBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    margin: 0,
    width: "100%",
    height: "100%",
    gap: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  title: {
    color: "#fff",
    fontSize: 60,
    fontFamily: "Poppins-SemiBold",
    textAlign: "center",
  },
  subtitle: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    textAlign: "center",
  },
  signInBtn: {
    marginTop: 32,
    paddingVertical: 16,
    paddingHorizontal: 64,
    borderRadius: 999,
    backgroundColor: theme.colors.primaryDark,
  },
  signInText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
  },
  downloadContainer: {
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  downloadBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    flexDirection: "row",
    justifyContent: "center",
  },
  androidBtn: {
    backgroundColor: "#000",
    borderColor: "#3DDC84",
    borderWidth: 2,
  },
  iosBtn: {
    backgroundColor: "#A2AAAD",
    borderColor: "#FFFFFF",
    borderWidth: 2,
    opacity: 0.5,
  },
  downloadText: {
    color: "#fff",
    fontSize: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginRight: 20,
    fontFamily: "Poppins-SemiBold",
  },
  downloadSubText: {
    color: "#FFFFFF",
    fontStyle: "italic",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Poppins-Light",
  },
});
