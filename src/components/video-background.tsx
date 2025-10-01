import { FC, useEffect } from "react";
import { View } from "react-native";
import { useVideoPlayer, VideoSource, VideoView } from "expo-video";

interface Props {
  source: VideoSource;
  children?: React.ReactNode;
}

export const VideoBackground: FC<Props> = ({ source, children }) => {
  const player = useVideoPlayer(source, (player) => {
    player.loop = true;  
  });

  useEffect(() => {
    player.play();
  }, [player]);

  return (
    <View className="flex-1">
      <VideoView
        className="absolute top-0 right-0 bottom-0 left-0"
        player={player}
        contentFit="cover"
      />

      <View
        className="absolute top-0 right-0 bottom-0 left-0"
        style={{ backgroundColor: 'rgba(128,128,128,0.4)' }}
      />

      <View className="absolute top-0 right-0 bottom-0 left-0">
        {children}
      </View>
    </View>
  );
};
