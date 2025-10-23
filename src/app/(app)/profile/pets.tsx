import { StackBottomV2 } from "@/components/stack-bottom-v2";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { PrivateProfile } from "../../../api/my-profile/types";
import { usePets } from "../../../api/options";
import { CheckboxList } from "../../../components/checkbox-list";
import { StackHeaderV4 } from "../../../components/stack-header-v4";
import { useEdit } from "../../../store/edit";

export default function Page() {
  const { edits, setEdits } = useEdit();
  const { data } = usePets();
  const [selected, setSelected] = useState(edits?.pets || []);

  const handlePress = () => {
    if (selected) {
      setEdits({
        ...edits,
        pets: selected,
      } as PrivateProfile);
    }
    router.back();
  };

  return (
    <View className="flex-1 bg-white p-5">
      <StackHeaderV4 title="Pets" onPressBack={handlePress} />
      <CheckboxList
        options={data}
        onChange={setSelected}
        initialSelection={selected}
      />
      <StackBottomV2
        visible={true}
        title="Edit Info"
        onPressBack={handlePress}
      />
    </View>
  );
}
