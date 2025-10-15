import React from "react";
import { Text, View } from "react-native";

interface AboutUsProps {
  primaryEmail?: string;
  secondaryEmail?: string;
}

const AboutUs: React.FC<AboutUsProps> = ({
  primaryEmail = "support@lovana.io.vn",
  secondaryEmail = "hungndhe180182@fpt.edu.vn",
}) => {
  return (
    <View className="items-center my-10 px-4">
      <View className="items-center my-10 px-4" style={{ width: "70%" }}>
        <Text className="text-xl font-semibold mb-2 font-poppins-semibold">
          About Lovana
        </Text>
        <Text className="text-center text-base text-gray-700 mb-4 font-poppins-regular">
          Welcome to Lovana – your safe and friendly space to connect with
          like-minded people. Whether you're looking for meaningful friendships
          or your next great love, Lovana is here to help you meet, chat, and
          create real connections. Your journey to love starts here!
        </Text>
        <Text className="text-center text-base text-red-900 mb-1 font-poppins-semibold">
          Contact us: <Text className="underline">{primaryEmail}</Text>
        </Text>
        <Text className="text-center text-base text-red-900 font-poppins-semibold">
          Secondary contact: <Text className="underline">{secondaryEmail}</Text>
        </Text>
      </View>
    </View>
  );
};

export default AboutUs;
