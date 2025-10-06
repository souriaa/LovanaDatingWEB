import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getInteractionByActorAndTarget } from "~/service/interactionService";
import { theme } from "../../constants/theme";
import Header from "./Header";

interface ChatHeaderProps {
  otherUser: any;
  currentUserId: any;
  onOptionsPress: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherUser,
  currentUserId,
  onOptionsPress,
}) => {
  const handleNavigateToMessages = async () => {
    if (!otherUser?.id) return;

    try {
      const interaction = await getInteractionByActorAndTarget(
        otherUser.id,
        currentUserId
      );

      if (interaction?.id) {
        router.push({
          pathname: `/likes/${interaction.id}`,
          params: { hideFab: true },
        });
      } else {
        console.warn("No interaction found between these users.");
      }
    } catch (err) {
      console.error("Error fetching interaction:", err);
    }
  };

  return (
    <View style={styles.headerContainer}>
      <Header style={styles.header}>
        <Pressable
          style={{ flexDirection: "row", alignItems: "center" }}
          onPress={handleNavigateToMessages}
        >
          <Image
            source={{ uri: otherUser.photo_url }}
            style={styles.headerAvatar}
          />
          <Text style={styles.headerName}>
            {otherUser.first_name || otherUser.last_name
              ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim()
              : null}
          </Text>
        </Pressable>
      </Header>

      <Pressable onPress={onOptionsPress}>
        <Ionicons
          name="ellipsis-vertical"
          size={28}
          color={theme.colors.textDarkGray}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderColor: theme.colors.backgroundGray,
  },
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: theme.colors.backgroundGray,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.backgroundGray,
    marginLeft: 20,
  },
  headerName: {
    fontSize: 18,
    color: theme.colors.textDarkGray,
    fontFamily: "Poppins-Regular",
    marginLeft: 12,
  },
});
