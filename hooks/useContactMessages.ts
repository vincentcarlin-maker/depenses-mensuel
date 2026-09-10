import { useState, useEffect, useCallback, useRef } from 'react';
import { ContactMessage, ContactReply, ContactSubject } from '../types';
import { supabase } from '../supabase/client';
import {
  fetchContactMessages,
  persistContactMessages,
  broadcastContactUpdate,
  dispatchContactPushNotification,
  getLocalContactMessages,
  getContactSubjectLabel,
} from '../utils/contactService';

const REALTIME_CHANNEL = 'contact_messages_channel';

interface UseContactMessagesProps {
  currentUser?: string;
  currentUsername?: string;
  currentUserEmail?: string;
  currentFoyerId?: string;
  currentFoyerName?: string;
  isAdmin?: boolean;
  onToast?: (info: { message: string; type: 'info' | 'error' }) => void;
}

export function useContactMessages({
  currentUser,
  currentUsername,
  currentUserEmail,
  currentFoyerId,
  currentFoyerName,
  isAdmin = false,
  onToast,
}: UseContactMessagesProps) {
  const [messages, setMessages] = useState<ContactMessage[]>(() => getLocalContactMessages());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const channelRef = useRef<any>(null);

  const normUser = (currentUsername || currentUser || '').toLowerCase().trim();

  // Load from Cloud & sync
  const refreshMessages = useCallback(async () => {
    try {
      const data = await fetchContactMessages();
      setMessages(data);
    } catch (e) {
      console.warn('Error refreshing contact messages:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMessages();

    // Setup realtime subscription
    const channel = supabase.channel(REALTIME_CHANNEL, {
      config: { broadcast: { ack: false, self: true } },
    });

    channel
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === payload.id);
          if (exists) return prev;
          return [payload, ...prev];
        });
        // If current user is Admin and someone else sent a message, notify in-app
        if (isAdmin && payload.userId !== normUser) {
          onToast?.({
            message: `Nouveau message reçu de ${payload.userName} (${getContactSubjectLabel(payload.subject)})`,
            type: 'info',
          });
        }
      })
      .on('broadcast', { event: 'new_reply' }, ({ payload }) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.id ? payload : m))
        );
        // If current user is the author and admin replied, notify in-app
        if (!isAdmin && payload.userId.toLowerCase() === normUser) {
          onToast?.({
            message: `Vincent vous a répondu dans "Nous contacter" !`,
            type: 'info',
          });
        }
      })
      .on('broadcast', { event: 'status_change' }, ({ payload }) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.id ? payload : m))
        );
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [refreshMessages, isAdmin, normUser, onToast]);

  // Messages created by current user
  const userMessages = messages.filter((m) => {
    if (!normUser) return true;
    const isUser = m.userId.toLowerCase() === normUser;
    const isEmail = currentUserEmail && m.userEmail?.toLowerCase() === currentUserEmail.toLowerCase();
    const isFoyer = currentFoyerId && m.foyerId === currentFoyerId;
    return isUser || isEmail || isFoyer;
  });

  // Unread replies for the regular user
  const unreadRepliesCount = userMessages.filter(
    (m) => !m.isReadByUser && m.replies && m.replies.length > 0
  ).length;

  // Unread messages for Admin (Vincent)
  const unreadAdminCount = messages.filter(
    (m) => !m.isReadByAdmin || m.status === 'pending'
  ).length;

  // Send a new contact message
  const sendMessage = useCallback(
    async ({
      subject,
      title,
      message,
      userEmail,
      deviceInfo,
    }: {
      subject: ContactSubject;
      title: string;
      message: string;
      userEmail?: string;
      deviceInfo?: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> => {
      if (!title.trim() || !message.trim()) {
        return { success: false, error: 'Veuillez renseigner un objet et un message.' };
      }

      const newId = crypto.randomUUID();
      const now = new Date().toISOString();

      const newMsg: ContactMessage = {
        id: newId,
        userId: normUser || 'anonyme',
        userName: currentUsername || currentUser || 'Utilisateur',
        userEmail: userEmail || currentUserEmail || undefined,
        foyerId: currentFoyerId || undefined,
        foyerName: currentFoyerName || undefined,
        subject,
        title: title.trim(),
        message: message.trim(),
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        replies: [],
        isReadByAdmin: false,
        isReadByUser: true,
        deviceInfo,
      };

      const updated = [newMsg, ...messages];
      setMessages(updated);

      await persistContactMessages(updated);
      broadcastContactUpdate('new_message', newMsg);

      // Trigger Push Notification to admin (Vincent)
      await dispatchContactPushNotification({
        type: 'new_message',
        senderName: newMsg.userName,
        subject: getContactSubjectLabel(newMsg.subject),
        title: newMsg.title,
        snippet: newMsg.message.slice(0, 120),
        targetUser: 'Vincent',
        messageId: newId,
      });

      return { success: true, messageId: newId };
    },
    [
      messages,
      normUser,
      currentUsername,
      currentUser,
      currentUserEmail,
      currentFoyerId,
      currentFoyerName,
    ]
  );

  // Send a reply to an existing message
  const sendReply = useCallback(
    async (
      messageId: string,
      replyText: string,
      asAdmin: boolean = isAdmin
    ): Promise<{ success: boolean; error?: string }> => {
      if (!replyText.trim()) {
        return { success: false, error: 'Le texte de la réponse ne peut pas être vide.' };
      }

      const target = messages.find((m) => m.id === messageId);
      if (!target) {
        return { success: false, error: 'Message introuvable.' };
      }

      const now = new Date().toISOString();
      const newReply: ContactReply = {
        id: crypto.randomUUID(),
        authorName: asAdmin ? 'Vincent (Développeur)' : currentUsername || currentUser || 'Utilisateur',
        authorUsername: asAdmin ? 'Vincent' : normUser,
        authorRole: asAdmin ? 'admin' : 'user',
        message: replyText.trim(),
        createdAt: now,
      };

      const updatedMsg: ContactMessage = {
        ...target,
        updatedAt: now,
        status: asAdmin ? 'replied' : target.status,
        isReadByUser: asAdmin ? false : true,
        isReadByAdmin: asAdmin ? true : false,
        replies: [...(target.replies || []), newReply],
      };

      const updatedList = messages.map((m) => (m.id === messageId ? updatedMsg : m));
      setMessages(updatedList);

      await persistContactMessages(updatedList);
      broadcastContactUpdate('new_reply', updatedMsg);

      // Send Push notification
      if (asAdmin) {
        // Notify recipient user
        await dispatchContactPushNotification({
          type: 'admin_reply',
          senderName: 'Vincent',
          subject: getContactSubjectLabel(target.subject),
          title: target.title,
          snippet: replyText.slice(0, 120),
          targetUser: target.userId,
          messageId: target.id,
        });
      } else {
        // User replied back -> notify admin
        await dispatchContactPushNotification({
          type: 'new_message',
          senderName: newReply.authorName,
          subject: getContactSubjectLabel(target.subject),
          title: `Réponse : ${target.title}`,
          snippet: replyText.slice(0, 120),
          targetUser: 'Vincent',
          messageId: target.id,
        });
      }

      return { success: true };
    },
    [messages, isAdmin, currentUsername, currentUser, normUser]
  );

  // Update status (e.g. 'pending' | 'in_progress' | 'replied' | 'closed')
  const updateStatus = useCallback(
    async (messageId: string, newStatus: ContactMessage['status']) => {
      const updatedList = messages.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      });
      setMessages(updatedList);
      await persistContactMessages(updatedList);
      const target = updatedList.find((m) => m.id === messageId);
      if (target) {
        broadcastContactUpdate('status_change', target);
      }
      return true;
    },
    [messages]
  );

  // Mark message as read
  const markAsRead = useCallback(
    async (messageId: string, forAdmin: boolean = isAdmin) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target) return;

      const shouldUpdate = forAdmin ? !target.isReadByAdmin : !target.isReadByUser;
      if (!shouldUpdate) return;

      const updatedList = messages.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            isReadByAdmin: forAdmin ? true : m.isReadByAdmin,
            isReadByUser: forAdmin ? m.isReadByUser : true,
          };
        }
        return m;
      });

      setMessages(updatedList);
      await persistContactMessages(updatedList);
    },
    [messages, isAdmin]
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      const updatedList = messages.filter((m) => m.id !== messageId);
      setMessages(updatedList);
      await persistContactMessages(updatedList);
      return true;
    },
    [messages]
  );

  return {
    messages,
    userMessages,
    allMessages: messages,
    unreadRepliesCount,
    unreadAdminCount,
    isLoading,
    sendMessage,
    sendReply,
    updateStatus,
    markAsRead,
    deleteMessage,
    refreshMessages,
  };
}
