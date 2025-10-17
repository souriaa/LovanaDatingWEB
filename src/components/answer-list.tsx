import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FC, useEffect, useState } from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { DraggableGrid } from "react-native-draggable-grid";
import { deleteProfileAnswer } from "../../service/profileAnswerService";
import { Answer, PrivateProfile } from "../api/my-profile/types";
import { useEdit } from "../store/edit";

type Item = {
  key: string;
  answer: Answer | null;
  disabledDrag?: boolean;
  disabledReSorted?: boolean;
};

interface Props {
  profile: PrivateProfile;
  columns?: number;
  spacing?: number;
  margin?: number;
  height?: number;
  slots?: number;
  containerWidth?: number;
}

export const AnswerList: FC<Props> = ({
  profile,
  columns = 1,
  spacing = 10,
  margin = 10,
  height = 120,
  slots = 3,
  containerWidth,
}) => {
  const actualContainerWidth =
    containerWidth ?? Dimensions.get("window").width * 0.66 - margin * 2;

  const itemWidth = (actualContainerWidth - (columns - 1) * spacing) / columns;

  const [data, setData] = useState<Item[]>([]);
  const { setEdits: setMyProfileChanges, setGridActive } = useEdit();

  const rows = Math.ceil(data.length / columns) || 1;
  const containerHeight = rows * height + (rows - 1) * spacing;

  useEffect(() => {
    const newData: Item[] = Array(slots)
      .fill(null)
      .map((_, index) => {
        const answer = profile?.answers?.[index] || null;
        return {
          key: index.toString(),
          answer,
          disabledDrag: !answer,
          disabledReSorted: !answer,
        };
      });
    setData(newData);
  }, [profile, slots]);

  const renderItem = (item: Item) => {
    return (
      <View
        key={item.key}
        style={{
          width: itemWidth,
          height,
          paddingVertical: spacing / 2,
        }}
      >
        {item.answer ? (
          <View className="flex-1 rounded-md overflow-hidden border border-neutral-200 p-5 flex-row items-center justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-base font-poppins-regular">
                {item.answer.question}
              </Text>
              <Text
                className="text-base font-poppins-regular text-neutral-400"
                numberOfLines={3}
              >
                {item.answer.answer_text}
              </Text>
            </View>

            {item.answer && !item.answer.id.startsWith("temp_") && (
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={20} color="grey" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="flex-1 rounded-md border border-red-600 border-dashed" />
        )}
      </View>
    );
  };

  const onDragRelease = (data: Item[]) => {
    const answers = data
      .map((item, index) => ({
        ...item.answer,
        answer_order: index,
      }))
      .filter((item) => item && item.answer_text != null);

    setMyProfileChanges({
      ...profile,
      answers,
    });

    setData(data);
    setGridActive(false);
  };

  const onDragItemActive = () => {
    setGridActive(true);
  };

  const onItemPress = (item: Item) => {
    if (item.answer) {
      router.push({
        pathname: "/(app)/write-answer",
        params: {
          itemId: item.answer.id,
          promptId: item.answer.prompt_id,
        },
      });
    } else {
      router.push("/(app)/prompts");
    }
  };

  const handleDelete = async (item: Item) => {
    if (!item.answer) return;

    const answerId = item.answer.id;

    const newData = data.filter((d) => d.key !== item.key);
    setData(newData);

    const updatedAnswers = newData
      .filter((i) => i.answer && !i.answer.id.startsWith("temp_"))
      .map((i, index) => ({ ...i.answer, answer_order: index }));

    setMyProfileChanges({ ...profile, answers: updatedAnswers });

    if (!answerId.startsWith("temp_")) {
      try {
        await deleteProfileAnswer(answerId);
      } catch (err) {
        console.error("deleteProfileAnswer error:", err);
      }
    }
  };

  return (
    <View
      style={{
        width: actualContainerWidth,
        alignSelf: "center",
        height: containerHeight,
      }}
    >
      <DraggableGrid
        numColumns={columns}
        renderItem={renderItem}
        data={data}
        onDragRelease={onDragRelease}
        onDragItemActive={onDragItemActive}
        onItemPress={onItemPress}
        itemHeight={height}
      />
    </View>
  );
};
