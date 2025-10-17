import { StackBottomV2 } from "@/components/stack-bottom-v2";
import { Slider } from "@miblanchard/react-native-slider";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { useUpdateAgeRange } from "../../../api/my-profile";
import { useAlert } from "../../../components/alert-provider";
import { StackHeaderV4 } from "../../../components/stack-header-v4";
import { useEdit } from "../../../store/edit";

const Page = () => {
  const { edits } = useEdit();
  const [ageRange, setAgeRange] = useState([
    edits?.min_age || 18,
    edits?.max_age || 100,
  ]);

  const { showAlert } = useAlert();

  const { mutate, reset } = useUpdateAgeRange();

  const handlePress = () => {
    mutate(
      { min_age: ageRange[0], max_age: ageRange[1] },
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
    <View className="bg-white flex-1 px-5 py-20 ">
      <StackHeaderV4 title="Age range" onPressBack={handlePress} />
      <Slider
        minimumValue={18}
        maximumValue={100}
        step={1}
        value={ageRange}
        onValueChange={(value) => setAgeRange(value)}
        renderAboveThumbComponent={(_index, value) => {
          return (
            <View className="items-center justify-center w-16 -left-8">
              <Text className="text-center ">{value}</Text>
            </View>
          );
        }}
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
