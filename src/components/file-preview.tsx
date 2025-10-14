// File: components/chat/FilePreview.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { theme } from "../../constants/theme";

interface FilePreviewProps {
  selectedFile: any;
  onRemove: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  selectedFile,
  onRemove,
}) => (
  <View style={styles.filePreview}>
    <Image source={{ uri: selectedFile.uri }} style={styles.filePreviewImage} />
    <TouchableOpacity onPress={onRemove}>
      <Ionicons name="close-circle" size={20} color="grey" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    backgroundColor: theme.colors.backgroundLighterGray,
    borderRadius: theme.radius.md,
  },
  filePreviewImage: {
    width: 50,
    height: 50,
    borderRadius: theme.radius.sm,
    marginRight: 8,
  },
});
