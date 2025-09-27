import React, { useEffect, useState } from "react";
import { View, Image } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { theme } from "~/constants/theme";

export const CountdownCircle = ({
  expirationAt,
  firstMessageSent,
  avatarUrl,
  size = 48,
  strokeWidth = 4,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!firstMessageSent) return; // ⛔ nếu chưa gửi tin nhắn thì không cần timer
    const updateTime = () => {
      const now = new Date();
      const exp = new Date(expirationAt);
      const diff = Math.max(exp - now, 0);
      setTimeLeft(diff);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [expirationAt, firstMessageSent]);

  const progress =
    firstMessageSent && expirationAt
      ? timeLeft / (new Date(expirationAt) - new Date()) || 0
      : 0;

  const strokeDashoffset = circumference * (1 - progress);
  const strokeColor =
    timeLeft <= 5 * 60 * 1000 ? theme.colors.primaryDark : theme.colors.primary;

  return (
    <View style={{ width: size, height: size }}>
      {firstMessageSent && (
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
          style={{
            width: firstMessageSent
              ? size - strokeWidth * 1.5
              : size - strokeWidth * 3,
            height: firstMessageSent
              ? size - strokeWidth * 1.5
              : size - strokeWidth * 3,
            borderRadius: (size - strokeWidth * 2) / 2,
          }}
        />
      </View>
    </View>
  );
};
