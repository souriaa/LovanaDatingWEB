import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../../../constants/theme";
import {
  getReportOptions,
  submitProfileReport,
} from "../../../../service/reportService";
import { getProfile } from "../../../../service/userService";
import Header from "../../../components/Header";
import { Loader } from "../../../components/loader";
import { supabase } from "../../../lib/supabase";

export default function ReportPage() {
  const { reportedId, reportedMessageId, reportedMessageBody } =
    useLocalSearchParams<{
      reportedId: string;
      reportedMessageId?: string;
      reportedMessageBody?: string;
    }>();

  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const data = await getReportOptions();
        setOptions(data);
      } catch (err) {
        console.error("Error loading report options:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const handleSubmit = async () => {
    try {
      if (!selectedOption) {
        Alert.alert("Missing Selection", "Please select a report reason.");
        return;
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        Alert.alert("Not logged in", "Please log in to continue.");
        return;
      }

      const reporterProfile = await getProfile();

      await submitProfileReport({
        reporter: reporterProfile.id,
        reported: reportedId,
        reported_message: reportedMessageId || null,
        reported_message_body: reportedMessageBody || null,
        report_option_id: selectedOption,
        note,
      });

      Alert.alert(
        "Report Submitted",
        "Thank you for helping keep our community safe."
      );
      router.back();
    } catch (err) {
      console.error("handleSubmit error:", err);
      Alert.alert("Error", "Something went wrong submitting your report.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Header title="Report User" mb={0} ml={15} />

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.subtitle}>
            Please tell us why you are reporting this user.
          </Text>

          {/* Report Options */}
          <View style={styles.optionList}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedOption === option.id && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedOption(option.id)}
              >
                <Text style={styles.optionTitle}>{option.name}</Text>
                {option.description ? (
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

          {/* Optional Note */}
          <Text style={[styles.subtitle, { marginTop: 20 }]}>
            Additional details (optional)
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe what happened..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={note}
            onChangeText={setNote}
          />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.continueBtn} onPress={handleSubmit}>
            <Text style={styles.continueText}>Submit Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.textLight,
  },
  scroll: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "left",
    marginBottom: 12,
    color: theme.colors.textDark,
    fontFamily: "Poppins-Regular",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  optionList: {
    flexDirection: "column",
    gap: 10,
  },
  optionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.textLighterGray,
    padding: 14,
  },
  optionCardSelected: {
    borderColor: theme.colors.primaryDark,
    borderWidth: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: theme.colors.textDark,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  textArea: {
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    textAlignVertical: "top",
    fontFamily: "Poppins-Regular",
    fontSize: 14,
  },
  bottomSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: theme.colors.textLight,
  },
  continueBtn: {
    backgroundColor: theme.colors.primaryDark,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: "center",
  },
  continueText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
});
