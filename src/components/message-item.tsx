// File: components/chat/MessageItem.tsx
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../constants/theme";
import { getSupabaseFileUrl } from "../../service/imageService";
import { SwipeableMessage } from "./swipeable-message";

interface MessageItemProps {
  item: any;
  index: number;
  isMine: boolean;
  userId: string;
  onToggleTime: (id: string) => void;
  onLongPress: (message: any) => void;
  statusText: string;
  onReply: (message: any) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  item,
  index,
  isMine,
  userId,
  onToggleTime,
  onLongPress,
  statusText,
  onReply,
}) => {
  let bubbleStyle = item.reply_to
    ? styles.singleBubble
    : item.isFirstInGroup && item.isLastInGroup
      ? styles.singleBubble
      : item.isFirstInGroup
        ? isMine
          ? styles.firstBubbleMine
          : styles.firstBubble
        : item.isLastInGroup
          ? isMine
            ? styles.lastBubbleMine
            : styles.lastBubble
          : isMine
            ? styles.middleBubbleMine
            : styles.middleBubble;

  const showTimestamp = item.showTime; // toggledTimeIds logic moved to parent if needed

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();

    const isSameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isSameDay) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const dayDiff = (now - date) / (1000 * 60 * 60 * 24);

    if (dayDiff < 7) {
      return `${date.toLocaleDateString("vi-VN", { weekday: "long" })} ${date.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )}`;
    }

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View>
      {showTimestamp && (
        <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
      )}

      <SwipeableMessage onReply={() => onReply(item)} isMine={isMine}>
        <Pressable
          onPress={() => onToggleTime(item.id)}
          onLongPress={() => onLongPress(item)}
          delayLongPress={300}
        >
          {/* Reply Bubble */}
          {item.reply_to && (
            <View
              style={[
                styles.messageContainer,
                isMine ? styles.myMessageReply : styles.theirMessageReply,
                styles.replyBubble,
              ]}
            >
              <Text style={styles.messageText}>
                {item.reply_to.sender?.first_name}
              </Text>
              <Text
                style={[
                  styles.messageText,
                  { color: theme.colors.textDarkGray },
                ]}
              >
                {item.reply_to.body}
              </Text>
            </View>
          )}

          {/* Image Preview from Supabase */}
          {item.files?.map((filePath: string, i: number) => (
            <View
              key={i}
              style={{
                alignSelf: isMine ? "flex-end" : "flex-start",
                marginVertical: 5,
              }}
            >
              <Image
                source={getSupabaseFileUrl(filePath)}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            </View>
          ))}

          {/* Message Bubble */}
          {!!item.body && (
            <View
              style={[
                styles.messageContainer,
                isMine ? styles.myMessage : styles.theirMessage,
                bubbleStyle,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  {
                    color: isMine
                      ? theme.colors.textLight
                      : theme.colors.textDarkGray,
                  },
                ]}
              >
                {item.body}
              </Text>
            </View>
          )}
        </Pressable>
      </SwipeableMessage>

      {/* Status Seen */}
      {index === 0 && statusText !== "" && (
        <View style={styles.statusSeen}>
          <Text style={styles.typingText}>{statusText}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  timestamp: {
    marginTop: 20,
    textAlign: "center",
    fontFamily: "Poppins-Regular",
    fontSize: 12,
  },
  messageContainer: {
    marginVertical: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.xxl,
    maxWidth: "80%",
    flexShrink: 1,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.primary,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.backgroundGray,
  },
  singleBubble: {
    borderRadius: theme.radius.xxl,
    marginVertical: 6,
  },
  firstBubble: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xxl,
    borderBottomLeftRadius: theme.radius.xxs,
    borderBottomRightRadius: theme.radius.xxl,
    marginTop: 6,
  },
  middleBubble: {
    borderTopLeftRadius: theme.radius.xxs,
    borderTopRightRadius: theme.radius.xxl,
    borderBottomLeftRadius: theme.radius.xxs,
    borderBottomRightRadius: theme.radius.xxl,
  },
  lastBubble: {
    borderTopLeftRadius: theme.radius.xxs,
    borderTopRightRadius: theme.radius.xxl,
    borderBottomLeftRadius: theme.radius.xl1,
    borderBottomRightRadius: theme.radius.xxl,
    marginBottom: 6,
  },
  firstBubbleMine: {
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xl1,
    borderBottomLeftRadius: theme.radius.xxl,
    borderBottomRightRadius: theme.radius.xxs,
    marginTop: 6,
  },
  middleBubbleMine: {
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxs,
    borderBottomLeftRadius: theme.radius.xxl,
    borderBottomRightRadius: theme.radius.xxs,
  },
  lastBubbleMine: {
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxs,
    borderBottomLeftRadius: theme.radius.xxl,
    borderBottomRightRadius: theme.radius.xl1,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    flexWrap: "wrap",
    fontFamily: "Poppins-Regular",
  },
  statusSeen: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  typingText: {
    fontSize: 13,
    color: theme.colors.textLighterGray,
    fontFamily: "Poppins-Regular",
  },
  replyBubble: {
    marginBottom: -20,
    paddingBottom: 18,
  },
  myMessageReply: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.backgroundGray,
    opacity: 0.5,
    borderBottomRightRadius: 0,
  },
  theirMessageReply: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.backgroundGray,
    opacity: 0.5,
    borderBottomLeftRadius: 0,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
});
