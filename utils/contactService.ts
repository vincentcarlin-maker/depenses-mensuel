import { supabase } from '../supabase/client';
import { ContactMessage, ContactSubject } from '../types';

const LOCAL_STORAGE_KEY = 'duobudget_contact_messages_v1';
const CLOUD_STORAGE_KEY = 'app_contact_messages_v1';
const REALTIME_CHANNEL = 'contact_messages_channel';

// Helper to get cached messages from localStorage
export function getLocalContactMessages(): ContactMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to load local contact messages:', e);
    return [];
  }
}

// Helper to save messages to localStorage
export function saveLocalContactMessages(messages: ContactMessage[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.warn('Failed to save local contact messages:', e);
  }
}

// Dispatch push notification via backend server
export async function dispatchContactPushNotification(payload: {
  type: 'new_message' | 'admin_reply';
  senderName: string;
  subject: string;
  title: string;
  snippet: string;
  targetUser?: string;
  messageId: string;
}): Promise<boolean> {
  try {
    const res = await fetch(`${window.location.origin}/api/send-contact-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      console.log('Contact push notification dispatched successfully');
      return true;
    }
  } catch (e) {
    console.warn('Failed to dispatch contact push notification to server:', e);
  }
  return false;
}

// Fetch all contact messages from cloud (with local fallback)
export async function fetchContactMessages(): Promise<ContactMessage[]> {
  const localList = getLocalContactMessages();
  try {
    const { data, error } = await (supabase.from('push_subscriptions') as any)
      .select('subscription')
      .eq('user_id', CLOUD_STORAGE_KEY)
      .maybeSingle();

    if (!error && data?.subscription?.messages && Array.isArray(data.subscription.messages)) {
      const cloudList: ContactMessage[] = data.subscription.messages;
      // Merge with local list based on latest updatedAt
      const map = new Map<string, ContactMessage>();
      cloudList.forEach(msg => map.set(msg.id, msg));
      localList.forEach(msg => {
        const existing = map.get(msg.id);
        if (!existing || new Date(msg.updatedAt) > new Date(existing.updatedAt)) {
          map.set(msg.id, msg);
        }
      });
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      saveLocalContactMessages(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Could not fetch contact messages from cloud:', err);
  }
  return localList;
}

// Save contact messages list to cloud and local storage
export async function persistContactMessages(messages: ContactMessage[]): Promise<boolean> {
  saveLocalContactMessages(messages);
  try {
    await (supabase.from('push_subscriptions') as any)
      .delete()
      .eq('user_id', CLOUD_STORAGE_KEY);

    const { error } = await (supabase.from('push_subscriptions') as any).insert({
      user_id: CLOUD_STORAGE_KEY,
      subscription: {
        messages,
        updated_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.warn('Error saving contact messages to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to persist contact messages:', err);
    return false;
  }
}

// Broadcast an event to other active clients
export function broadcastContactUpdate(event: 'new_message' | 'new_reply' | 'status_change', payload: any) {
  try {
    const channel = supabase.channel(REALTIME_CHANNEL);
    channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  } catch (err) {
    console.warn('Failed to broadcast contact update:', err);
  }
}

// Helper: Get readable label for subject
export function getContactSubjectLabel(subject: ContactSubject): string {
  switch (subject) {
    case 'bug':
      return 'Bug / Problème technique';
    case 'suggestion':
      return 'Suggestion / Amélioration';
    case 'question':
      return 'Question / Aide';
    case 'other':
    default:
      return 'Autre demande';
  }
}

export function getContactSubjectBadge(subject: ContactSubject): { label: string; icon: string; bg: string; text: string; border: string } {
  switch (subject) {
    case 'bug':
      return {
        label: 'Bug technique',
        icon: '🐞',
        bg: 'bg-rose-50 dark:bg-rose-950/60',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/60',
      };
    case 'suggestion':
      return {
        label: 'Suggestion',
        icon: '💡',
        bg: 'bg-purple-50 dark:bg-purple-950/60',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800/60',
      };
    case 'question':
      return {
        label: 'Question',
        icon: '❓',
        bg: 'bg-sky-50 dark:bg-sky-950/60',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-800/60',
      };
    case 'other':
    default:
      return {
        label: 'Autre',
        icon: '💬',
        bg: 'bg-slate-50 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
      };
  }
}
