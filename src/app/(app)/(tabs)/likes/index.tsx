import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { getInteractionsByTargetId } from "../../../../../service/interactionService";
import { getProfile } from "../../../../../service/userService";
import { useLikes } from "../../../../api/profiles";
import { Empty } from "../../../../components/empty";
import { LikeCard } from "../../../../components/like-card";
import { Loader } from "../../../../components/loader";
import { useRefreshOnFocus } from "../../../../hooks/refetch";

export default function Page() {
  const { data, isFetching, isError, refetch } = useLikes();
  const [interactionMap, setInteractionMap] = useState<Record<string, number>>(
    {}
  );
  useRefreshOnFocus(refetch);

  useEffect(() => {
    const fetchInteractions = async () => {
      const profile = await getProfile();
      if (!profile) return;

      const interactions = await getInteractionsByTargetId(profile.id);
      if (!interactions) return;

      const map: Record<string, number> = {};
      interactions.forEach((i) => {
        map[i.actor_id] = i.status_id;
      });

      setInteractionMap(map);
    };

    fetchInteractions();
  }, []);

  const renderHeader = () => {
    if (data.length === 0) return null;

    const firstProfileId = data[0].profile.id;
    const isSuperLike = interactionMap[firstProfileId] === 7;
    return (
      <View className="gap-5 bg-white ">
        <Text className="text-3xl font-poppins-semibold">Likes You</Text>
        {data.length > 0 && (
          <>
            <Link href={`/likes/${data[0].id}`} asChild>
              <Pressable className="bg-white flex-1 rounded-lg overflow-hidden border border-neutral-200">
                <View className="p-4 gap-5">
                  <Text className="text-base font-poppins-light">
                    {isSuperLike ? (
                      <View style={{ flexDirection: "row" }}>
                        <Ionicons name="star-outline" size={20} color="gold" />
                        <Text
                          className="font-poppins-semibold"
                          style={{ marginLeft: 4, fontSize: 16 }}
                        >
                          Super Liked You
                        </Text>
                      </View>
                    ) : (
                      `Liked your ${data[0].photo_url ? "photo" : "answer"}`
                    )}
                  </Text>
                  <Text className="text-xl font-poppins-medium">
                    {data[0].profile.first_name}
                  </Text>
                </View>
                <View className="p-4">
                  <View className="rounded-lg flex-1 bg-neutral-200 aspect-square w-full overflow-hidden">
                    <Image
                      source={data[0].profile.photos[0].photo_url}
                      className="flex-1"
                    />
                  </View>
                </View>
              </Pressable>
            </Link>
          </>
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    if (data.length === 1) {
      return null;
    }

    if (isFetching) {
      return <Loader />;
    }

    if (isError) {
      return (
        <Empty
          title="Something went wrong"
          subTitle=" We ran into a problem loading your likes, sorry about that!"
          primaryText="Try again"
          onPrimaryPress={() => refetch()}
        />
      );
    }

    return (
      <Empty
        title="No likes yet"
        subTitle="We can help you get your first one sooner."
      />
    );
  };

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={data.length > 1 ? data.slice(1) : []}
        renderItem={({ item, index }) => {
          const isSuperLike = interactionMap[item.profile.id] === 7;

          return (
            <>
              <LikeCard like={item} isSuperLike={isSuperLike} />
              {data.length % 2 === 0 && index === data.length - 2 && (
                <View className="flex-1" />
              )}
            </>
          );
        }}
        numColumns={2}
        contentContainerClassName="gap-4 px-5 pb-20 grow justify-content"
        columnWrapperClassName="gap-4"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}
