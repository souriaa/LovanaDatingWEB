import { createContext, ReactNode, useContext, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

type AlertOptions = {
  title: string;
  message: string;
  buttons?: AlertButton[];
};

type AlertContextType = {
  showAlert: (options: AlertOptions) => void;
};

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({
    title: "",
    message: "",
    buttons: [{ text: "OK", onPress: () => setVisible(false) }],
  });

  const showAlert = (opts: AlertOptions) => {
    setOptions({
      ...opts,
      buttons: opts.buttons?.length
        ? opts.buttons.map((b) => ({
            ...b,
            onPress: () => {
              b.onPress?.();
              setVisible(false);
            },
          }))
        : [{ text: "OK", onPress: () => setVisible(false) }],
    });
    setVisible(true);
  };

  // Cancel function for outside tap
  const handleCancel = () => {
    const cancelButton = options.buttons?.find((b) => b.style === "cancel");
    if (cancelButton) cancelButton.onPress?.();
    setVisible(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
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
            <Text style={styles.message}>{options.message}</Text>
            <View style={styles.buttonContainer}>
              {options.buttons?.map((btn, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={btn.onPress}
                  style={[
                    styles.button,
                    btn.style === "destructive" && styles.destructive,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      btn.style === "destructive" && styles.destructiveText,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </AlertContext.Provider>
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
  message: { fontSize: 16, marginBottom: 20, fontFamily: "Poppins-Regular" },
  buttonContainer: { flexDirection: "row", justifyContent: "flex-end" },
  button: { marginLeft: 10, paddingVertical: 6, paddingHorizontal: 12 },
  destructive: {},
  buttonText: { fontSize: 16, color: "#007AFF", fontFamily: "Poppins-Regular" },
  destructiveText: {
    color: "#FF3B30",
    fontWeight: "bold",
    fontFamily: "Poppins-Regular",
  },
});
