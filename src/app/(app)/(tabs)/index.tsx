import { useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { getProfilePlansByUser } from "../../../../service/profilePlanService";
import { getProfile, isProfileComplete } from "../../../../service/userService";
import { useSignOut } from "../../../api/auth";
import {
  useLikeProfile,
  useProfiles,
  useReviewProfiles,
  useSkipProfile,
  useSuperlikeProfile,
} from "../../../api/profiles";
import { useAlert } from "../../../components/alert-provider";
import { Empty } from "../../../components/empty";
import { Fab } from "../../../components/fab";
import { Loader } from "../../../components/loader";
import { ProfileView } from "../../../components/profile-view";
import { useRefreshOnFocus } from "../../../hooks/refetch";
import { supabase } from "../../../lib/supabase";
import { transformPublicProfile } from "../../../utils/profile";

export default function Page() {
  const { mutate: signOut } = useSignOut();
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
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  const { showAlert } = useAlert();

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

        const [address] = await Location.reverseGeocodeAsync(coords);

        // console.log("Got location:", latitude, longitude);
        // console.log("Country:", address.country);

        if (address.country !== "Vietnam") {
          showAlert({
            title: "Access Forbidden",
            message:
              "Logging in from outside Vietnam is not allowed. Please contact the developer.",
            buttons: [
              {
                text: "OK",
                style: "cancel",
                onPress: () => signOut(),
              },
            ],
          });
          return;
        }

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

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const complete = await isProfileComplete();
        setProfileComplete(complete);
      } catch (error) {
        console.error("Failed to check profile completeness:", error);
        setProfileComplete(false);
      }
    };

    checkProfile();
  }, [isFetching]);

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
          showAlert({
            title: "Error",
            message: "Something went wrong, please try again later",
            buttons: [{ text: "OK", style: "cancel" }],
          });
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
        showAlert({
          title: "Error",
          message: "Something went wrong, please try again later",
          buttons: [{ text: "OK", style: "cancel" }],
        });
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
            showAlert({
              title: "Error",
              message: "Something went wrong, please try again later",
              buttons: [{ text: "OK", style: "cancel" }],
            });
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
          showAlert({
            title: "Error",
            message: "Something went wrong, please try again later",
            buttons: [{ text: "OK", style: "cancel" }],
          });
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

  if (profileComplete === false) {
    return (
      <Empty
        title="Complete Your Profile"
        subTitle="You need to fill out your personal information and add at least one photo before you can start matching."
        primaryText="Update Profile"
        onPrimaryPress={() => router.push("/profile")}
      />
    );
  }

  return (
    <View className="flex-1 bg-white items-center">
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {profile && <ProfileView profile={profile} onLike={handleLike} />}
      </ScrollView>
      <View className="absolute bottom-20 w-full flex flex-row justify-center space-x-8">
        <Fab
          onPress={handleSkip}
          iconName="close"
          className="bg-white h-20 active:h-[4.75rem] rounded-full"
          iconClassName="text-black text-4xl"
          loaderClassName="text-black"
          iconSize={40}
        />
        <Fab
          onPress={handleSuperlike}
          iconName="star"
          className="bg-white h-20 active:h-[4.75rem] rounded-full"
          iconClassName="text-red-900 text-4xl"
          loaderClassName="text-black"
          iconSize={40}
        />
      </View>
    </View>
  );
}
