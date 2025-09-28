import { List } from "@/components/list";
import { StackHeaderV2 } from "@/components/stack-header-v2";
import { useEdit } from "@/store/edit";
import { memberPreferences, incognitoPreference } from "@/utils/preferences";
import { Text, View, Switch, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { theme } from "~/constants/theme";

export default function Page() {
  const { edits } = useEdit();
  const [incognito, setIncognito] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncognito = async () => {
      setLoading(true);
      const status = await incognitoPreference.getValue();
      setIncognito(status === "Enabled");
      setLoading(false);
    };
    fetchIncognito();
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
      <View>
        <Text className="text-base font-poppins-semibold">Incognito Mode</Text>
        <View
          className="mt-6 p-4 bg-gray-100 rounded-lg flex-row justify-between items-center"
          style={{ height: 50, marginBottom: 20 }}
        >
          <Text className="text-base font-poppins-semibold">
            Hide from other people
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <Switch
              value={incognito || false}
              onValueChange={handleToggle}
              trackColor={{ false: "#ccc", true: theme.colors.primary }}
              thumbColor={incognito ? "#fff" : "#f4f3f4"}
            />
          )}
        </View>
      </View>
      <List
        title="Dating Preferences"
        data={memberPreferences}
        profile={edits}
      />

      {/* Incognito Mode toggle riêng biệt */}
    </View>
  );
}
