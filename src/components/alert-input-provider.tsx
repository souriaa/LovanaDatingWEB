import { createContext, ReactNode, useContext, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type InputAlertOptions = {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  onCancel?: () => void;
  onOk?: (value: string) => void;
  okText?: string;
  cancelText?: string;
};

type InputAlertContextType = {
  showInputAlert: (options: InputAlertOptions) => void;
};

const InputAlertContext = createContext<InputAlertContextType>({
  showInputAlert: () => {},
});

export const useInputAlert = () => useContext(InputAlertContext);

export const InputAlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<InputAlertOptions>({
    title: "",
    message: "",
    placeholder: "",
    defaultValue: "",
    onCancel: () => {},
    onOk: () => {},
    okText: "OK",
    cancelText: "Cancel",
  });
  const [inputValue, setInputValue] = useState("");

  const showInputAlert = (opts: InputAlertOptions) => {
    setOptions(opts);
    setInputValue(opts.defaultValue || "");
    setVisible(true);
  };

  const handleCancel = () => {
    options.onCancel?.();
    setVisible(false);
  };

  const handleOk = () => {
    options.onOk?.(inputValue);
    setVisible(false);
  };

  return (
    <InputAlertContext.Provider value={{ showInputAlert }}>
      {children}
      <Modal transparent visible={visible} animationType="fade">
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
            <Text style={styles.title}>{options.title}</Text>
            {options.message ? (
              <Text style={styles.message}>{options.message}</Text>
            ) : null}
            <TextInput
              style={styles.textarea}
              placeholder={options.placeholder}
              value={inputValue}
              onChangeText={setInputValue}
              multiline
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleCancel}>
                <Text style={styles.buttonText}>
                  {options.cancelText || "Cancel"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleOk}>
                <Text style={styles.buttonText}>{options.okText || "OK"}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </InputAlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: 320,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
    elevation: 10,
  },
  title: { fontSize: 18, marginBottom: 10, fontFamily: "Poppins-SemiBold" },
  message: { fontSize: 16, marginBottom: 10, fontFamily: "Poppins-Regular" },
  textarea: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 6,
    minHeight: 80,
    padding: 10,
    marginBottom: 20,
    fontFamily: "Poppins-Regular",
  },
  buttonContainer: { flexDirection: "row", justifyContent: "flex-end" },
  button: { marginLeft: 10, paddingVertical: 6, paddingHorizontal: 12 },
  buttonText: { fontSize: 16, color: "#007AFF", fontFamily: "Poppins-Regular" },
});
