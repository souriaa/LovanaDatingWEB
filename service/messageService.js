import { supabase } from "@/lib/supabase";

export const fetchConversations = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("conversation_members")
      .select(`
        user_id,
        is_seen,
        conversation:conversations (
          id,
          is_group,
          title,
          created_at,
          created_by,
          first_message_sent,
          expiration_at,
          status,
          is_extended,
          members:conversation_members (
            user_id,
            profiles (
              id,
              first_name,
              last_name,
              phone,
              user_id,
              created_at,
              photos:profile_photos (
                photo_url,
                photo_order,
                is_active
              )
            )
          ),
          messages (
            id,
            body,
            created_at,
            sender_id,
            files
          )
        )
      `)
      .eq("user_id", userId);

    if (error) throw error;

    const conversations = data.map((cm) => {
      const conv = cm.conversation || {};

      const sortedMessages = conv.messages?.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      const lastMessage = sortedMessages?.[0] || null;

      let otherUser = null;
      if (conv.members?.length) {
        const otherMember = conv.members.find(
          (m) => String(m.user_id) !== String(userId)
        );

        if (otherMember?.profiles) {
          const user = otherMember.profiles;
          const mainPhoto =
            (user.photos && user.photos.find((p) => p.photo_order === 0)) ||
            (user.photos && user.photos[0]) ||
            null;

          otherUser = {
            ...user,
            photo_url: mainPhoto ? mainPhoto.photo_url : null,
          };
        }
      }

      return {
        ...conv,
        is_seen: cm.is_seen,
        last_message: lastMessage
          ? {
            id: lastMessage.id,
            body: lastMessage.body,
            created_at: lastMessage.created_at,
            sender_id: lastMessage.sender_id,
            files: lastMessage.files,
          }
          : null,
        other_user: otherUser,
        first_message_sent: conv.first_message_sent,
        expiration_at: conv.expiration_at,
        conversation_status: conv.status,
        conversation_is_extended: conv.is_extended
      };
    });

    return conversations;
  } catch (err) {
    console.error("Error fetching conversations:", err.message || err);
    return [];
  }
};


export const createConversation = async ({ userIds, isGroup = false, title, first_message_sent = false, }) => {
  try {
    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert([{ is_group: isGroup, title, created_by: userIds[0], first_message_sent }])
      .select()
      .single();

    if (error) throw error;

    const members = userIds.map((id) => ({
      conversation_id: conversation.id,
      user_id: id,
    }));

    const { error: memberError } = await supabase
      .from("conversation_members")
      .insert(members);

    if (memberError) throw memberError;

    return { success: true, data: conversation };
  } catch (err) {
    console.error("Error creating conversation:", err.message || err);
    return { success: false, message: err.message };
  }
};

export const fetchAvailableUsers = async (currentUserId) => {
  try {
    const { data: userConversations } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", currentUserId);

    const conversationIds = userConversations?.map((c) => c.conversation_id) || [];

    const { data: existingMembers } = await supabase
      .from("conversation_members")
      .select("user_id")
      .in("conversation_id", conversationIds)
      .neq("user_id", currentUserId);

    const existingUserIds = existingMembers?.map((m) => m.user_id) || [];

    const excludeList = [currentUserId, ...existingUserIds];

    // Build not-in clause safely: if excludeList empty use simple select
    let query = supabase.from("profiles").select("id, first_name, last_name, phone, user_id");
    if (excludeList.length) {
      // supabase .not("id","in", `(${...})`) expects csv of ids
      query = query.not("id", "in", `(${excludeList.join(",")})`);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    return users || [];
  } catch (err) {
    console.error("Error fetching available users:", err.message || err);
    return [];
  }
};

export const fetchAvailableUsersFilterByFriend = async (currentUserId) => {
  try {
    const { data: userConversations } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", currentUserId);

    const conversationIds = userConversations?.map((c) => c.conversation_id) || [];

    const { data: existingMembers } = await supabase
      .from("conversation_members")
      .select("user_id")
      .in("conversation_id", conversationIds)
      .neq("user_id", currentUserId);

    const existingUserIds = existingMembers?.map((m) => m.user_id) || [];

    const { data: friends, error: friendsError } = await supabase
      .from("friends")
      .select("user_id, friend_id")
      .eq("status", "accepted")
      .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

    if (friendsError) throw friendsError;

    const friendIds =
      friends?.map((f) =>
        f.user_id === currentUserId ? f.friend_id : f.user_id
      ) || [];

    const excludeIds = [currentUserId, ...existingUserIds];
    const availableFriendIds = friendIds.filter((id) => !excludeIds.includes(id));

    if (availableFriendIds.length === 0) return [];

    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, phone, user_id")
      .in("id", availableFriendIds);

    if (error) throw error;

    return users || [];
  } catch (err) {
    console.error("Error fetching available users by friend:", err.message || err);
    return [];
  }
};

export const fetchMessages = async (conversation_id) => {
  try {
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*, sender:profiles(id, first_name, last_name, phone, user_id)")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    const replyIds = messages.map(m => m.reply_to_id).filter(Boolean);
    let repliesMap = {};
    if (replyIds.length > 0) {
      const { data: replyData, error: replyError } = await supabase
        .from("messages")
        .select("id, body, created_at, sender:profiles(id, first_name, last_name, phone, user_id)")
        .in("id", replyIds);

      if (replyError) throw replyError;

      repliesMap = Object.fromEntries(replyData.map(r => [r.id, r]));
    }

    return messages.map(m => ({
      ...m,
      reply_to: m.reply_to_id ? repliesMap[m.reply_to_id] || null : null,
    }));
  } catch (err) {
    console.error("Error fetching messages:", err.message || err);
    return [];
  }
};


export const sendMessage = async ({
  conversation_id,
  sender_id,
  body,
  files = [],
  reply_to_id = null,
  creator_id,
}) => {
  try {
    const { data: messageData, error: insertError } = await supabase
      .from("messages")
      .insert([{ conversation_id, sender_id, body, files, reply_to_id }])
      .select()
      .single();

    if (insertError) throw insertError;

    if (creator_id && creator_id === sender_id) {
      const { error: updateError } = await supabase
        .from("conversations")
        .update({ first_message_sent: true })
        .eq("id", conversation_id)
        .eq("first_message_sent", false);

      if (updateError) throw updateError;
    }

    return messageData;
  } catch (err) {
    console.error("Error sending message:", err.message || err);
    throw err;
  }
};

export const getOtherUserInConversation = async (conversationId, currentUserId) => {
  try {
    const { data, error } = await supabase
      .from("conversation_members")
      .select(`
        user:profiles (
          id,
          first_name,
          last_name,
          phone,
          user_id,
          created_at,
          photos:profile_photos (
            photo_url,
            photo_order,
            is_active
          )
        )
      `)
      .eq("conversation_id", conversationId);

    if (error) throw error;

    const otherMember = data.find(
      (member) =>
        String(member.user?.id) !== String(currentUserId)
    );

    if (!otherMember) return null;

    const user = otherMember.user;

    const mainPhoto =
      (user.photos && user.photos.find((p) => p.photo_order === 0)) ||
      (user.photos && user.photos[0]) ||
      null;

    return {
      ...user,
      photo_url: mainPhoto ? mainPhoto.photo_url : null,
    };
  } catch (err) {
    console.error("Error fetching other user:", err.message || err);
    return null;
  }
};

export const getConversationBySenderAndReceiver = async (currentId, otherId) => {
  try {
    const { data: currentUserConvs, error: currentError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", currentId);

    if (currentError) throw currentError;

    const currentUserConvIds = currentUserConvs?.map(c => c.conversation_id) || [];

    const { data: otherUserConvs, error: otherError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", otherId);

    if (otherError) throw otherError;

    const otherUserConvIds = otherUserConvs?.map(c => c.conversation_id) || [];

    const commonConvId = currentUserConvIds.find(id => otherUserConvIds.includes(id));

    if (!commonConvId) return null;

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", commonConvId)
      .single();

    if (convError) throw convError;

    return conversation;

  } catch (err) {
    console.error("Error fetching conversation by sender and receiver:", err.message || err);
    return null;
  }
};

export const markConversationAsSeen = async (conversationId, userId) => {
  try {
    const { error } = await supabase
      .from("conversation_members")
      .update({ is_seen: true })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    if (error) {
      console.error("markConversationAsSeen error:", error);
      return { success: false, msg: "Could not mark as seen" };
    }

    return { success: true };
  } catch (err) {
    console.error("markConversationAsSeen exception:", err);
    return { success: false, msg: "Could not mark as seen" };
  }
};

export const markConversationAsUnseen = async (conversationId, otherId) => {
  try {
    const { error } = await supabase
      .from("conversation_members")
      .update({ is_seen: false })
      .eq("conversation_id", conversationId)
      .eq("user_id", otherId);

    if (error) {
      console.error("markConversationAsUnseen error:", error);
      return { success: false, msg: "Could not mark as unseen" };
    }

    return { success: true };
  } catch (err) {
    console.error("markConversationAsUnseen exception:", err);
    return { success: false, msg: "Could not mark as unseen" };
  }
};

export const fetchUnseenConversation = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("conversation_members")
      .select("conversation_id, is_seen")
      .eq("user_id", userId);

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("Error fetching unseen conversations:", err.message || err);
    return [];
  }
};

export const fetchConversationSeenStatus = async (conversationId, currentUserId, otherUserId) => {
  try {
    const { data, error } = await supabase
      .from("conversation_members")
      .select("user_id, is_seen")
      .eq("conversation_id", conversationId)
      .in("user_id", [currentUserId, otherUserId]);

    if (error) throw error;

    const status = {
      currentUser: data.find((m) => String(m.user_id) === String(currentUserId)) || null,
      otherUser: data.find((m) => String(m.user_id) === String(otherUserId)) || null,
    };

    return status;
  } catch (err) {
    console.error("Error fetching conversation seen status:", err.message || err);
    return { currentUser: null, otherUser: null };
  }
};

export const deleteConversationById = async (conversationId) => {
  try {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (error) {
      console.error("Failed to delete conversation:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected error deleting conversation:", err);
    return false;
  }
};

export const getConversationCreatorAndMessageFirst = async (conversationId) => {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("created_by, first_message_sent, status")
      .eq("id", conversationId)
      .single();

    if (error) {
      console.error("Failed to fetch conversation info:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Unexpected error fetching conversation info:", err);
    return null;
  }
};

export async function setConversationStatus(conversationId, newStatus) {
  const { data, error } = await supabase
    .from("conversations")
    .update({ status: newStatus })
    .eq("id", conversationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function extendConversationTime(userId, conversationId) {
  try {
    const { data: likeData, error: likeError } = await supabase
      .from("likes_remain")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (likeError) throw likeError;
    if (!likeData) throw new Error("User likes_remain record not found");

    if (likeData.time_extend_remaining <= 0) {
      throw new Error("No remaining extend credits");
    }

    const { data: updatedLikes, error: updateLikeError } = await supabase
      .from("likes_remain")
      .update({ time_extend_remaining: likeData.time_extend_remaining - 1 })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateLikeError) throw updateLikeError;

    const { data: convData, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (convError) throw convError;
    if (!convData) throw new Error("Conversation not found");

    const now = new Date();
    const createdAt = new Date(convData.created_at);
    const expirationAt = new Date(convData.expiration_at);

    let newExpiration;

    if (createdAt.getTime() + 24 * 60 * 60 * 1000 >= now.getTime()) {
      newExpiration = new Date(expirationAt.getTime() + 24 * 60 * 60 * 1000);
    } else {
      newExpiration = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    const { data: updatedConversation, error: updateConvError } = await supabase
      .from("conversations")
      .update({
        expiration_at: newExpiration,
        status: true,
        is_extended: true
      })
      .eq("id", conversationId)
      .select()
      .single();

    if (updateConvError) throw updateConvError;

    return updatedConversation;
  } catch (err) {
    console.error("Error extending conversation time:", err.message || err);
    throw err;
  }
}
