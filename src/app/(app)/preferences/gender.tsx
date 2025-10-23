import { StackBottomV2 } from "@/components/stack-bottom-v2";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useUpdateGenderPreferences } from "../../../api/my-profile";
import { useGenders } from "../../../api/options";
import { useAlert } from "../../../components/alert-provider";
import { CheckboxList } from "../../../components/checkbox-list";
import { StackHeaderV4 } from "../../../components/stack-header-v4";
import { useEdit } from "../../../store/edit";

export default function Page() {
  const { edits } = useEdit();
  const { data } = useGenders();
  const [selected, setSelected] = useState(edits?.gender_preferences || []);
  const { mutate, reset } = useUpdateGenderPreferences();

  const { showAlert } = useAlert();

  const handlePress = () => {
    if (selected) {
      mutate(
        {
          genders: selected.map((i) => i.id),
        },
        {
          onSuccess: () => {
            router.back();
          },
          onError: () => {
            showAlert({
              title: "Error",
              message: "Something went wrong, please try again later",
              buttons: [{ text: "OK", style: "cancel" }],
            });
            reset();
            router.back();
          },
        }
      );
    }
  };

  return (
    <View className="flex-1 bg-white p-5">
      <StackHeaderV4 title="I'm interested in" onPressBack={handlePress} />
      <CheckboxList
        options={data.map((item) => ({
          id: item.id,
          name: item.plural_name || item.name,
        }))}
        onChange={setSelected}
        initialSelection={selected}
      />
      <StackBottomV2
        visible={true}
        title="Edit Filter"
        onPressBack={handlePress}
      />
    </View>
  );
}
