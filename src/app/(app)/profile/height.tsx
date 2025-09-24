import { PrivateProfile } from "@/api/my-profile/types";
import { StackHeaderV4 } from "@/components/stack-header-v4";
import { useEdit } from "@/store/edit";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { range } from "lodash";
import { useState } from "react";
import { View } from "react-native";

export default function Page() {
  const { edits, setEdits } = useEdit();
  const [selectedHeight, setSelectedHeight] = useState(
    edits?.height_cm || undefined
  );

  const handlePress = () => {
    if (selectedHeight) {
      setEdits({
        ...edits,
        height_cm: selectedHeight,
      } as PrivateProfile);
    }
    router.back();
  };

  return (
    <View className="flex-1 bg-white p-5">
      <StackHeaderV4 title="Height" onPressBack={handlePress} />
      <Picker
        selectedValue={selectedHeight}
        onValueChange={(itemValue, _itemIndex) => setSelectedHeight(itemValue)}
      >
        {range(92, 214).map((height) => (
          <Picker.Item key={height} label={`${height} cm`} value={height} />
        ))}
      </Picker>
    </View>
  );
}
