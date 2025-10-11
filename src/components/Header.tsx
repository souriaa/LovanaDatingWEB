import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../constants/theme";
import BackButton from "./BackButton";

const Header = ({
  title,
  showBackButton = true,
  mb = 10,
  ml = 0,
  children,
  style,
}) => {
  const router = useRouter();
  return (
    <View
      style={[
        styles.container,
        { marginBottom: mb },
        { marginHorizontal: ml },
        style,
      ]}
    >
      {showBackButton && (
        <View style={styles.backButton}>
          <BackButton router={router} />
        </View>
      )}
      <Text style={styles.title}>{title || ""}</Text>
      {children}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    gap: 10,
  },
  title: {
    fontSize: 24,
    color: theme.colors.textDark,
    fontFamily: "Poppins-Bold",
  },
  backButton: {
    position: "absolute",
    left: 0,
  },
});
