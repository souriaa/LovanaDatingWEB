import { StackBottomV2 } from "@/components/stack-bottom-v2";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useUpdateEthnicityPreferences } from "../../../api/my-profile";
import { Option, PrivateProfile } from "../../../api/my-profile/types";
import { useEthnicities } from "../../../api/options";
import { useAlert } from "../../../components/alert-provider";
import { CheckboxList } from "../../../components/checkbox-list";
import { StackHeaderV4 } from "../../../components/stack-header-v4";
import { useEdit } from "../../../store/edit";

const Page = () => {
  const { edits, setEdits } = useEdit();
  const { data } = useEthnicities();
  const [selected, setSelected] = useState<Option[]>(
    edits?.ethnicity_preferences || []
  );

  const { mutate, reset } = useUpdateEthnicityPreferences();

  const { showAlert } = useAlert();

  const handlePress = () => {
    setEdits({ ...edits, ethnicity_preferences: selected } as PrivateProfile);
    mutate(
      { ethnicities: selected.map((i) => i.id) },
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
  };

  return (
    <View className="bg-white flex-1 p-5">
      <StackHeaderV4 title="Ethnicity" onPressBack={handlePress} />
      <CheckboxList
        options={data}
        initialSelection={selected}
        onChange={setSelected}
      />
      <StackBottomV2
        visible={true}
        title="Edit Filter"
        onPressBack={handlePress}
      />
    </View>
  );
};
export default Page;
