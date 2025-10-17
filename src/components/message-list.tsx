import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { theme } from "~/constants/theme";
import { MessageItem } from "./message-item";

interface MessageListProps {
  messages: any[];
  userId: string;
  onReply: (message: any) => void;
  onToggleTime: (id: string) => void;
  onLongPress: (message: any) => void;
  statusText: string;
  loadOlderMessages: () => Promise<any[]>;
  hasMore: boolean;
  toggledTimeIds: string[];
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  userId,
  onReply,
  onToggleTime,
  onLongPress,
  statusText,
  loadOlderMessages,
  hasMore,
  toggledTimeIds,
}) => {
  const [loadingOlder, setLoadingOlder] = useState(false);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const isMine = String(item.sender_id) === String(userId);
      return (
        <MessageItem
          item={item}
          index={index}
          isMine={isMine}
          userId={userId}
          onToggleTime={onToggleTime}
          onLongPress={onLongPress}
          statusText={statusText}
          onReply={onReply}
          showTime={toggledTimeIds.includes(item.id)}
        />
      );
    },
    [userId, onToggleTime, onLongPress, statusText]
  );

  const handleEndReached = async () => {
    if (loadingOlder || !hasMore) return;

    setLoadingOlder(true);
    try {
      await loadOlderMessages();
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingOlder(false);
    }
  };

  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      inverted
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.2}
      ListFooterComponent={
        loadingOlder ? (
          <View style={{ padding: 8 }}>
            <ActivityIndicator size="small" color={theme.colors.primaryDark} />
          </View>
        ) : null
      }
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 10,
        flexGrow: 1,
        justifyContent: "flex-end",
      }}
      initialNumToRender={20}
      maxToRenderPerBatch={20}
      windowSize={5}
    />
  );
};
