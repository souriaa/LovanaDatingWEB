import { StackBottomV2 } from "@/components/stack-bottom-v2";
import { Slider } from "@miblanchard/react-native-slider";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { useUpdateDistance } from "../../../api/my-profile";
import { useAlert } from "../../../components/alert-provider";
import { StackHeaderV4 } from "../../../components/stack-header-v4";
import { useEdit } from "../../../store/edit";

const Page = () => {
  const { edits } = useEdit();
  const [distance, setDistance] = useState(edits?.max_distance_km || 160);

  const { mutate, reset } = useUpdateDistance();

  const { showAlert } = useAlert();

  const handlePress = () => {
    mutate(
      { distance: distance },
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
      <StackHeaderV4 title="Maximum distance" onPressBack={handlePress} />
      <Slider
        minimumValue={1}
        maximumValue={160}
        step={1}
        value={distance}
        onValueChange={(value) => setDistance(value[0])}
        renderAboveThumbComponent={() => {
          return (
            <View className="items-center justify-center w-16 -left-8">
              <Text className="text-center ">{distance} km</Text>
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
