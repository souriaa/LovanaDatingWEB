import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { getProfilePlansByUser } from "../../../../service/profilePlanService";
import { getProfile } from "../../../../service/userService";
import {
  useLikeProfile,
  useProfiles,
  useReviewProfiles,
  useSkipProfile,
  useSuperlikeProfile,
} from "../../../api/profiles";
import { Empty } from "../../../components/empty";
import { Fab } from "../../../components/fab";
import { Loader } from "../../../components/loader";
import { ProfileView } from "../../../components/profile-view";
import { useRefreshOnFocus } from "../../../hooks/refetch";
import { supabase } from "../../../lib/supabase";
import { transformPublicProfile } from "../../../utils/profile";

export default function Page() {
  const { data, isFetching, error, refetch } = useProfiles();
  useRefreshOnFocus(refetch);

  const [currentIndex, setCurrentIndex] = useState(0);
  const { mutate: skip, isPending: skipPending } = useSkipProfile();
  const { mutate: review, isPending: reviewPending } = useReviewProfiles();
  const { mutate: like, isPending: likePending } = useLikeProfile();
  const { mutate: superlike, isPending: superlikePending } =
    useSuperlikeProfile();
  const [loading, setLoading] = useState(true);
  const [canUsePremium, setCanUsePremium] = useState(false);
  const queryClient = useQueryClient();

  const hasProfiles = data && data.length > 0;

  const profile = hasProfiles
    ? transformPublicProfile(data[currentIndex])
    : null;

  useEffect(() => {
    const fetchProfilePlan = async () => {
      try {
        const profile = await getProfile();
        if (!profile?.id) return;

        const profilePlans = await getProfilePlansByUser(profile.id);

        if (profilePlans && profilePlans.length > 0) {
          const now = new Date();
          const validPlans = profilePlans.filter((plan) => {
            if (!plan.plan_due_date) return true;
            const dueDate = new Date(plan.plan_due_date);
            return now <= dueDate;
          });

          if (validPlans.length > 0) {
            const plan = validPlans[0];
            setCanUsePremium(plan.plan_id !== 1);
          } else {
            setCanUsePremium(false);
          }
        } else {
          setCanUsePremium(false);
        }
      } catch (err) {
        console.error("fetchProfilePlan error:", err);
        setCanUsePremium(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfilePlan();
  }, []);

  useEffect(() => {
    const updateProfileWithLocation = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          console.log("❌ No user found:", authError);
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Location permission not granted");
          return;
        }

        const { coords } = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = coords;

        console.log("Got location:", latitude, longitude);

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            latitude,
            longitude,
            updated_at: new Date(),
          })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Unexpected error updating location:", updateError);
        }
      } catch (err) {
        console.error("Unexpected error updating location:", err);
      }
    };

    updateProfileWithLocation();
  }, []);

  const handleSkip = () => {
    if (profile) {
      skip(profile?.id, {
        onSuccess: () => {
          if (hasProfiles && currentIndex < data.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else if (hasProfiles) {
            queryClient.invalidateQueries({
              queryKey: ["profiles"],
            });
            setCurrentIndex(0);
          }
        },
        onError: () => {
          Alert.alert("Error", "Something went wrong, please try again later");
        },
      });
    }
  };

  const handleReview = () => {
    review(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["profiles"],
        });
      },
      onError: () => {
        Alert.alert("Error", "Something went wrong, please try again later");
      },
    });
  };

  const handleLike = (id: string, type: "answer" | "photo") => {
    if (profile) {
      like(
        {
          profile: profile?.id,
          answer: type === "answer" ? id : undefined,
          photo: type === "photo" ? id : undefined,
        },
        {
          onSuccess: () => {
            if (hasProfiles && currentIndex < data.length - 1) {
              setCurrentIndex(currentIndex + 1);
            } else if (hasProfiles) {
              queryClient.invalidateQueries({
                queryKey: ["profiles"],
              });
              setCurrentIndex(0);
            }
          },
          onError: () => {
            Alert.alert(
              "Error",
              "Something went wrong, please try again later"
            );
          },
        }
      );
    }
  };

  const handleSuperlike = () => {
    if (!profile) return;

    superlike(
      { profile: profile.id },
      {
        onSuccess: () => {
          if (hasProfiles && currentIndex < data.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else if (hasProfiles) {
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
            setCurrentIndex(0);
          }
        },
        onError: () => {
          Alert.alert(
            "Error",
            "Something went wrong with superlike. Please try again."
          );
        },
      }
    );
  };

  if (
    isFetching ||
    skipPending ||
    reviewPending ||
    likePending ||
    superlikePending
  ) {
    return <Loader />;
  }

  if (error) {
    return (
      <Empty
        title="Something went wrong"
        subTitle="We ran into a problem loading new people, sorry about that!"
        onPrimaryPress={refetch}
        primaryText="Try again"
      />
    );
  }

  if (!hasProfiles) {
    return (
      <Empty
        title="You've seen everyone for now"
        subTitle="Try changing your filters..."
        primaryText="Change filters"
        secondaryText="Review skipped profiles"
        onPrimaryPress={() => router.push("/preferences")}
        onSecondaryPress={handleReview}
        secondaryDisabled={!canUsePremium}
      />
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5">
        <Link href={"/preferences"} suppressHighlighting>
          <Ionicons name="options-outline" className="text-3xl" />
        </Link>
        {profile && <ProfileView profile={profile} onLike={handleLike} />}
      </ScrollView>
      <Fab
        onPress={handleSkip}
        iconName="close"
        className="bg-white shadow-sm active:h-[4.75rem] h-20 absolute bottom-20 left-5"
        iconClassName="text-black text-4xl"
        loaderClassName="text-black"
      />
      <Fab
        onPress={handleSuperlike}
        iconName="star"
        className="bg-white shadow-sm active:h-[4.75rem] h-20 absolute bottom-20 right-5"
        iconClassName="text-red-900 text-4xl text-4xl"
        loaderClassName="text-black"
      />
    </View>
  );
}
