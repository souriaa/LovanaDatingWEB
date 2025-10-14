import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { getInteractionWithOtherProfileById } from "../../../../service/interactionService";
import { Loader } from "../../../components/loader";
import { ProfileView } from "../../../components/profile-view";
import { transformPublicProfile } from "../../../utils/profile";

const Page = () => {
  const { id } = useLocalSearchParams();

  const [like, setLike] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInteraction = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const interactionWithProfile =
          await getInteractionWithOtherProfileById(id);
        if (!interactionWithProfile) {
          console.warn("No interaction or profile found");
          setLike(null);
        } else {
          setLike(interactionWithProfile);
        }
      } catch (err) {
        console.error("Error fetching interaction with other profile:", err);
        setLike(null);
      } finally {
        setLoading(false);
      }
    };

    loadInteraction();
  }, [id]);

  if (loading) {
    return <Loader />;
  }

  if (!like) {
    return <Redirect href={"/likes"} />;
  }

  const profile = transformPublicProfile(like.profile);

  console.log(profile.photos);

  return (
    <View className="flex-1 px-5 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileView profile={profile} />
      </ScrollView>
    </View>
  );
};

export default Page;
