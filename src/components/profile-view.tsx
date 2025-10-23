import { FC } from "react";
import { ScrollView, Text, View } from "react-native";
import { Profile } from "../types/profile";
import { ProfileAnswer } from "./profile-answer";
import { ProfileItem } from "./profile-item";
import { ProfilePhoto } from "./profile-photo";
import { ProfileTraits } from "./profile-traits";

interface Props {
  profile: Profile;
  myProfile?: boolean;
  onLike?: (id: string, type: "answer" | "photo") => void;
}

export const ProfileView: FC<Props> = ({ profile, myProfile, onLike }) => {
  const generateProfile = (): JSX.Element[] => {
    const elements: JSX.Element[] = [];

    const layout: ("photo" | "answer" | "traits")[] = [
      "photo",
      "answer",
      "traits",
      "photo",
      "photo",
      "answer",
      "photo",
      "answer",
      "photo",
      "photo",
    ];

    const { photos, answers } = profile;
    let photoIndex = 0;
    let answerIndex = 0;

    layout.forEach((item, index) => {
      if (item === "traits") {
        elements.push(
          <ProfileTraits key={`traits-${index}`} profile={profile} />
        );
      }
      if (item === "photo" && photoIndex < photos.length) {
        const p = photos[photoIndex++];
        elements.push(
          <ProfileItem key={`p${p.id}`} onLike={onLike} item={p} type="photo">
            <ProfilePhoto photo={p} />
          </ProfileItem>
        );
      }
      if (item === "answer" && answerIndex < answers.length) {
        const a = answers[answerIndex++];
        elements.push(
          <ProfileItem key={`a${a.id}`} onLike={onLike} item={a} type="answer">
            <ProfileAnswer answer={a} />
          </ProfileItem>
        );
      }
    });

    return elements;
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pt-5 pb-28"
      showsVerticalScrollIndicator={false}
    >
      {!myProfile && (
        <Text className="text-3xl font-poppins-semibold mb-5 text-center md:text-left">
          {profile.first_name}
        </Text>
      )}

      {/* ✅ Responsive grid container */}
      <View className="flex flex-col md:flex-row md:flex-wrap md:justify-center md:gap-6 gap-5">
        {generateProfile().map((item, index) => (
          <View
            key={index}
            className="w-full md:w-[48%]" // 1 column on mobile, 2 columns on web
          >
            {item}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
