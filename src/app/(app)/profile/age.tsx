import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { isValid, subYears } from "date-fns";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { PrivateProfile } from "../../../api/my-profile/types";
import { StackHeaderV4 } from "../../../components/stack-header-v4";
import { useEdit } from "../../../store/edit";
import { age } from "../../../utils/age";

const MIN_AGE_YEARS = 100; // mobile min age
const MAX_AGE_YEARS = 18; // mobile max age

export default function Page() {
  const { edits, setEdits } = useEdit();
  const initialDate = edits?.dob
    ? new Date(edits.dob)
    : subYears(new Date(), MAX_AGE_YEARS);

  const [date, setDate] = useState(initialDate);
  const [show, setShow] = useState(false);

  // Web inputs
  const [day, setDay] = useState(date.getDate().toString().padStart(2, "0"));
  const [month, setMonth] = useState(
    (date.getMonth() + 1).toString().padStart(2, "0")
  );
  const [year, setYear] = useState(date.getFullYear().toString());

  // Update web inputs when date changes
  useEffect(() => {
    setDay(date.getDate().toString().padStart(2, "0"));
    setMonth((date.getMonth() + 1).toString().padStart(2, "0"));
    setYear(date.getFullYear().toString());
  }, [date]);

  // Mobile date picker
  const onChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) setDate(selectedDate);
    if (Platform.OS === "android") setShow(false);
  };

  // Web input change handler
  const handleWebChange = (
    newDay: string,
    newMonth: string,
    newYear: string
  ) => {
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);

    const parsedDate = new Date(`${newYear}-${newMonth}-${newDay}`);
    if (isValid(parsedDate)) setDate(parsedDate);
  };

  const handlePress = () => {
    setEdits({ ...edits, dob: date.toISOString() } as PrivateProfile);
    router.back();
  };

  const minDate = subYears(new Date(), MIN_AGE_YEARS);
  const maxDate = subYears(new Date(), MAX_AGE_YEARS);

  // Helpers for dropdowns
  const days = Array.from({ length: 31 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  const months = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  const years = Array.from(
    { length: MAX_AGE_YEARS + MIN_AGE_YEARS + 1 },
    (_, i) => (new Date().getFullYear() - i).toString()
  );

  const handleWebBlur = () => {
    const parsedDate = new Date(`${year}-${month}-${day}`);

    const minDate = subYears(new Date(), MIN_AGE_YEARS);
    const maxDate = subYears(new Date(), MAX_AGE_YEARS);

    if (!isValid(parsedDate)) {
      setDay(date.getDate().toString().padStart(2, "0"));
      setMonth((date.getMonth() + 1).toString().padStart(2, "0"));
      setYear(date.getFullYear().toString());
    } else {
      let correctedDate = parsedDate;
      if (parsedDate < minDate) correctedDate = minDate;
      if (parsedDate > maxDate) correctedDate = maxDate;

      setDate(correctedDate);
      setDay(correctedDate.getDate().toString().padStart(2, "0"));
      setMonth((correctedDate.getMonth() + 1).toString().padStart(2, "0"));
      setYear(correctedDate.getFullYear().toString());
    }
  };

  return (
    <View className="flex-1 bg-white p-5">
      <StackHeaderV4 title="Age" onPressBack={handlePress} />

      {Platform.OS === "web" ? (
        <>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 20,
            }}
          >
            <TextInput
              style={{
                fontSize: 24,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 8,
                width: "30%",
                textAlign: "center",
              }}
              keyboardType="numeric"
              maxLength={2}
              value={day}
              onChangeText={setDay} // just update local state
              onBlur={() => handleWebBlur()} // correct when leaving input
              placeholder="DD"
            />
            <TextInput
              style={{
                fontSize: 24,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 8,
                width: "30%",
                textAlign: "center",
              }}
              keyboardType="numeric"
              maxLength={2}
              value={month}
              onChangeText={setMonth}
              onBlur={() => handleWebBlur()}
              placeholder="MM"
            />
            <TextInput
              style={{
                fontSize: 24,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 8,
                width: "30%",
                textAlign: "center",
              }}
              keyboardType="numeric"
              maxLength={4}
              value={year}
              onChangeText={setYear}
              onBlur={() => handleWebBlur()}
              placeholder="YYYY"
            />
          </View>
          <Text className="text-4xl text-center font-poppins-medium mt-5">
            {`Age ${age(date.toString())}`}
          </Text>
        </>
      ) : (
        <>
          {(show || Platform.OS === "ios") && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              is24Hour={true}
              onChange={onChange}
              display="spinner"
              maximumDate={maxDate}
              minimumDate={minDate}
            />
          )}
          <Text
            className="text-4xl text-center font-poppins-medium mt-5"
            onPress={() => setShow(true)}
          >
            {`Age ${age(date.toString())}`}
          </Text>
        </>
      )}
    </View>
  );
}
