import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../constants/theme";
import { getLikes } from "../../service/likeService";
import { getProfile } from "../../service/userService";

export const PerkStats = () => {
  const [superLikes, setSuperLikes] = useState<number | null>(null);
  const [timeExtender, setTimeExtender] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLikes = async () => {
    try {
      const profile = await getProfile();
      if (!profile?.id) return;
      const data = await getLikes(profile.id);
      setSuperLikes(data?.super_likes_remaining ?? 0);
      setTimeExtender(data?.time_extend_remaining ?? 0);
    } catch (err) {
      console.error("Error loading likes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikes();
  }, []);

  if (loading) {
    return (
      <View style={[styles.perksRow, { justifyContent: "center" }]}>
        <ActivityIndicator size="small" color={theme.colors.primaryDark} />
      </View>
    );
  }

  return (
    <View style={styles.perksRow}>
      {/* Super Likes */}
      <TouchableOpacity
        style={styles.perkCard}
        onPress={() =>
          router.push({
            pathname: "/consumables/get-consumables",
            params: { consumableId: 1 },
          })
        }
      >
        <Ionicons
          name="star-outline"
          size={22}
          color={theme.colors.primaryDark}
        />
        <Text style={styles.perkTitle}>Super Likes</Text>
        <Text style={styles.perkSubtitle}>{superLikes ?? 0}</Text>
      </TouchableOpacity>

      {/* Time Extender */}
      <TouchableOpacity
        style={styles.perkCard}
        onPress={() =>
          router.push({
            pathname: "/consumables/get-consumables",
            params: { consumableId: 2 },
          })
        }
      >
        <Ionicons
          name="time-outline"
          size={22}
          color={theme.colors.primaryDark}
        />
        <Text style={styles.perkTitle}>Time Extender</Text>
        <Text style={styles.perkSubtitle}>{timeExtender ?? 0}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  perksRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 40,
  },
  perkCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.backgroundGray,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    width: 200,
  },
  perkTitle: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    marginLeft: 6,
    color: theme.colors.textDark,
  },
  perkSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
    marginLeft: 4,
    color: theme.colors.primaryDark,
  },
});
