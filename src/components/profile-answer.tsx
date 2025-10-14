import { FC } from "react";
import { Text, View } from "react-native";
import { Answer } from "../types/profile";

interface Props {
  answer: Answer;
}

export const ProfileAnswer: FC<Props> = ({ answer }) => {
  return (
    <View className="bg-white rounded-md px-5 pt-14 pb-20 border border-neutral-200 flex-1 justify-center items-center">
      <Text className="text-3xl font-poppins-medium text-center mb-3">
        {answer?.question}
      </Text>
      <Text className="text-4xl font-playfair-semibold text-center leading-snug">
        {answer?.answer_text}
      </Text>
    </View>
  );
};
