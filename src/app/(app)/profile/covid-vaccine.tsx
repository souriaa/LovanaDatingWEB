import { StackBottomV2 } from "@/components/stack-bottom-v2";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { PrivateProfile } from "../../../api/my-profile/types";
import { useCovidVaccine } from "../../../api/options";
import { RadioList } from "../../../components/radio-list";
import { StackHeaderV4 } from "../../../components/stack-header-v4";
import { useEdit } from "../../../store/edit";

export default function Page() {
  const { edits, setEdits } = useEdit();
  const { data } = useCovidVaccine();
  const [selected, setSelected] = useState(edits?.covid_vaccine || null);

  const handlePress = () => {
    if (selected) {
      setEdits({
        ...edits,
        covid_vaccine: selected,
      } as PrivateProfile);
    }
    router.back();
  };

  return (
    <View className="flex-1 bg-white p-5">
      <StackHeaderV4 title="Covid Vaccine" onPressBack={handlePress} />
      <RadioList
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
