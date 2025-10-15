import { useEffect, useState } from "react";
import { Image, TouchableWithoutFeedback, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { theme } from "../../constants/theme";
import { setConversationStatus } from "../../service/messageService"; // import hàm update

export const CountdownCircle = ({
  conversationId,
  createdAt,
  expirationAt,
  firstMessageSent,
  avatarUrl,
  size = 48,
  strokeWidth = 4,
  conversationStatus,
  onPressAvatar,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const [timeLeft, setTimeLeft] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (firstMessageSent) return;

    const start = new Date(createdAt);
    const exp = new Date(expirationAt);

    const total = Math.max(exp - start, 0);
    setDuration(total);

    const updateTime = async () => {
      const now = new Date();
      const diff = Math.max(exp - now, 0);
      setTimeLeft(diff);

      if (diff === 0 && !expired) {
        setExpired(true);
        try {
          await setConversationStatus(conversationId, false);
        } catch (err) {
          console.error("Failed to update conversation status:", err);
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt, expirationAt, firstMessageSent, conversationId, expired]);

  const progress = duration > 0 ? timeLeft / duration : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const strokeColor =
    timeLeft <= 5 * 60 * 1000
      ? theme.colors.primaryDark
      : theme.colors.primaryLight;

  return (
    <View style={{ width: size, height: size }}>
      {!firstMessageSent && (
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e0e0e0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>
      )}
      <TouchableWithoutFeedback onPress={onPressAvatar}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={{ uri: avatarUrl }}
            style={[
              {
                width: size - strokeWidth * 3,
                height: size - strokeWidth * 3,
                borderRadius: (size - strokeWidth * 2) / 2,
              },
              !conversationStatus && { opacity: 0.5 },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};
