import { Link, Stack } from "expo-router";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { theme } from "../../../constants/theme";
import { VideoBackground } from "../../components/video-background";

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

          <Link href={"/phone"} asChild>
            <Pressable style={styles.signInBtn}>
              <Text style={styles.signInText}>Sign in</Text>
            </Pressable>
          </Link>
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
    backgroundColor: "rgba(0,0,0,0.35)", // optional overlay for text readability
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
});
