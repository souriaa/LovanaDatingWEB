import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Switch, Text, View } from "react-native";
import { theme } from "../../../../constants/theme";
import { getProfilePlansByUser } from "../../../../service/profilePlanService";
import { getProfile } from "../../../../service/userService";
import { List } from "../../../components/list";
import { StackHeaderV2 } from "../../../components/stack-header-v2";
import { useEdit } from "../../../store/edit";
import { cn } from "../../../utils/cn";
import {
  incognitoPreference,
  memberPreferences,
} from "../../../utils/preferences";

export default function Page() {
  const { edits } = useEdit();
  const [incognito, setIncognito] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [canUsePremium, setCanUsePremium] = useState(false);

  useEffect(() => {
    const fetchIncognito = async () => {
      setLoading(true);
      const status = await incognitoPreference.getValue();
      setIncognito(status === "Enabled");
      setLoading(false);
    };
    fetchIncognito();
  }, []);

  useEffect(() => {
    const fetchProfilePlan = async () => {
      try {
        const profile = await getProfile();
        if (!profile?.id) return;

        const profilePlans = await getProfilePlansByUser(profile.id);

        if (profilePlans && profilePlans.length > 0) {
          const now = new Date();
          const validPlans = profilePlans.filter((plan) => {
            if (!plan.plan_due_date) return true;
            const dueDate = new Date(plan.plan_due_date);
            return now <= dueDate;
          });

          if (validPlans.length > 0) {
            const plan = validPlans[0];
            setCanUsePremium(plan.plan_id !== 1);
          } else {
            setCanUsePremium(false);
          }
        } else {
          setCanUsePremium(false);
        }
      } catch (err) {
        console.error("fetchProfilePlan error:", err);
        setCanUsePremium(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfilePlan();
  }, []);

  const handleToggle = async () => {
    if (incognito === null) return;

    const previousValue = incognito;
    const newValue = !incognito;

    setIncognito(newValue);

    try {
      const updated = await incognitoPreference.toggle(newValue);
      if (updated === null) {
        setIncognito(previousValue);
      }
    } catch (err) {
      console.error("Failed to toggle incognito:", err);
      setIncognito(previousValue);
    }
  };

  if (!edits) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text>Something went wrong.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-5">
      <StackHeaderV2 title="Dating Preferences" />
      <List
        title="Dating Preferences"
        data={memberPreferences}
        profile={edits}
      />

      <Text className="text-base font-poppins-semibold mt-5">
        Advanced filter
      </Text>
      {!canUsePremium && (
        <Text className="text-sm text-gray-500 italic">Premium only</Text>
      )}

      {[
        {
          title: "Ethnicity",
          value:
            edits.ethnicity_preferences.map((e) => e.name).join(", ") ||
            "Open to all",
          route: "/preferences/ethnicity",
        },
        {
          title: "Maximum distance",
          value: `${edits.max_distance_km} km`,
          route: "/preferences/distance",
        },
      ].map((item) => {
        const isDisabled = !canUsePremium;

        const content = (
          <Pressable
            className="flex-row items-center justify-between pr-5 border-b border-neutral-200 py-3"
            style={{
              backgroundColor: "#ffffff00",
              opacity: isDisabled ? 0.5 : 1,
            }}
          >
            <View>
              <Text
                className={cn("text-base font-poppins-regular", {
                  "text-red-700": item.value === "None",
                })}
              >
                {item.title}
              </Text>
              <Text
                className={cn("text-base font-poppins-light", {
                  "text-red-700": item.value === "None",
                })}
              >
                {item.value}
              </Text>
            </View>
            <Ionicons name="chevron-forward" className="text-base" />
          </Pressable>
        );

        return isDisabled ? (
          <View key={item.title}>{content}</View>
        ) : (
          <Link key={item.title} href={item.route} asChild>
            {content}
          </Link>
        );
      })}

      <Text className="text-base font-poppins-semibold mt-5">
        Incognito Mode
      </Text>
      {!canUsePremium && (
        <Text className="text-sm text-gray-500 italic">Premium only</Text>
      )}

      <View
        className="flex-row items-center justify-between border-b border-neutral-200 py-3"
        style={{
          height: 60,
          marginBottom: 20,
          backgroundColor: "#ffffff00",
          opacity: canUsePremium ? 1 : 0.5,
        }}
      >
        <View>
          <Text className={cn("text-base font-poppins-light")}>
            Hide you from other people
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="#111827" />
        ) : (
          <Switch
            value={incognito || false}
            onValueChange={handleToggle}
            trackColor={{ false: "#ccc", true: theme.colors.primary }}
            thumbColor={incognito ? "#fff" : "#f4f3f4"}
            disabled={!canUsePremium}
          />
        )}
      </View>
      {!canUsePremium && (
        <Text className="text-sm text-gray-500 italic">
          Available on{" "}
          <Link href="/lovana" asChild>
            <Text
              style={{ color: theme.colors.primary }}
              className="text-500 underline"
            >
              premium plans
            </Text>
          </Link>{" "}
          and above only.
        </Text>
      )}
    </View>
  );
}
