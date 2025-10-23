import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { createContext, ReactNode, useContext, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "~/constants/theme";

type InputDateAlertOptions = {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  showDate?: boolean;
  defaultDate?: Date;
  okText?: string;
  cancelText?: string;
  onCancel?: () => void;
  onOk?: (value: string, date?: Date | null) => void;
};

type InputDateAlertContextType = {
  showInputAlert: (opts: InputDateAlertOptions) => void;
};

const InputDateAlertContext = createContext<InputDateAlertContextType>({
  showInputAlert: () => {},
});

export const useInputDateAlert = () => useContext(InputDateAlertContext);

export const InputDateAlertProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<InputDateAlertOptions | null>(null);
  const [textValue, setTextValue] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [showNativePicker, setShowNativePicker] = useState(false);

  const showInputAlert = (opts: InputDateAlertOptions) => {
    setOptions(opts);
    setTextValue(opts.defaultValue ?? "");
    setSelectedDate(opts.defaultDate ?? new Date());
    setVisible(true);
    setShowNativePicker(false);
  };

  const close = () => {
    setVisible(false);
    setOptions(null);
    setShowNativePicker(false);
  };

  const handleCancel = () => {
    options?.onCancel?.();
    close();
  };

  const handleOk = () => {
    options?.onOk?.(
      textValue,
      options?.showDate ? (selectedDate ?? null) : null
    );
    close();
  };

  const onChangeDate = (
    event: DateTimePickerEvent,
    date?: Date | undefined
  ) => {
    if (Platform.OS === "android") {
      setShowNativePicker(false); // close native picker on Android after selection or cancel
    }
    if (date) setSelectedDate(date);
  };

  const formatForWebInput = (date?: Date | null) => {
    if (!date) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <InputDateAlertContext.Provider value={{ showInputAlert }}>
      {children}

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modal}
            onPress={() => {}}
          >
            <Text style={styles.title}>{options?.title}</Text>

            {options?.message ? (
              <Text style={styles.message}>{options.message}</Text>
            ) : null}

            <TextInput
              style={styles.textarea}
              placeholder={options?.placeholder}
              placeholderTextColor={theme.colors.textLightGray}
              value={textValue}
              onChangeText={setTextValue}
              multiline
            />

            {/* Date selection UI (only render when showDate === true) */}
            {options?.showDate && (
              <View style={styles.dateSection}>
                <Text style={styles.dateLabel}>Date & time</Text>

                {Platform.OS === "web" ? (
                  <input
                    type="datetime-local"
                    value={formatForWebInput(selectedDate)}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    style={{
                      padding: 8,
                      fontSize: 14,
                      borderRadius: 6,
                      border: "1px solid #DDD",
                      width: "100%",
                    }}
                  />
                ) : Platform.OS === "ios" ? (
                  <DateTimePicker
                    value={selectedDate ?? new Date()}
                    mode="datetime"
                    display="inline"
                    onChange={onChangeDate}
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowNativePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {selectedDate
                        ? selectedDate.toLocaleString()
                        : "Select date & time"}
                    </Text>

                    {showNativePicker && (
                      <DateTimePicker
                        value={selectedDate ?? new Date()}
                        mode="datetime"
                        display="default"
                        onChange={onChangeDate}
                      />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleCancel}>
                <Text style={styles.buttonText}>
                  {options?.cancelText ?? "Cancel"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleOk}>
                <Text style={styles.buttonText}>{options?.okText ?? "OK"}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </InputDateAlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: 420,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 18,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    fontFamily: "Poppins-SemiBold",
    color: theme.colors.textDark,
  },
  message: {
    fontSize: 15,
    marginBottom: 10,
    fontFamily: "Poppins-Regular",
    color: theme.colors.textDarkGray,
  },
  textarea: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    minHeight: 80,
    padding: 10,
    marginBottom: 12,
    fontFamily: "Poppins-Regular",
  },
  dateSection: {
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 13,
    marginBottom: 6,
    fontFamily: "Poppins-Medium",
    color: theme.colors.textDark,
  },
  androidDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  dateButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  dateButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: theme.colors.textDark,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  button: { marginLeft: 10, paddingVertical: 6, paddingHorizontal: 12 },
  buttonText: { fontSize: 16, color: "#007AFF", fontFamily: "Poppins-Regular" },
});
