import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';

export function useSyncedSettings<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Keep state in sync if key changes (e.g. foyer switch)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        setStoredValue(initialValue);
      }
    } catch {
      setStoredValue(initialValue);
    }
  }, [key]);

  const channelRef = useRef<any>(null);

  // Sync to Cloud
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((prev) => {
      const nextValue = value instanceof Function ? value(prev) : value;
      
      // Save locally
      try {
        window.localStorage.setItem(key, JSON.stringify(nextValue));
      } catch (e) {
        console.error(e);
      }

      // Broadcast immediately
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: `sync_${key}`,
          payload: { value: nextValue }
        });
      }

      // Save to Supabase (using durable push_subscriptions key-value table)
      (async () => {
        try {
          await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `setting_${key}`);
          await (supabase.from('push_subscriptions') as any).insert({
            user_id: `setting_${key}`,
            subscription: { value: nextValue }
          });
        } catch (e) {
          console.warn(`Could not sync ${key} to Supabase:`, e);
        }
      })();

      return nextValue;
    });
  }, [key]);

  // Fetch initial from Cloud & setup Realtime
  useEffect(() => {
    const fetchFromCloud = async () => {
      try {
        const { data, error } = await (supabase.from('push_subscriptions') as any)
          .select('subscription')
          .eq('user_id', `setting_${key}`)
          .maybeSingle();

        if (!error && data && data.subscription && data.subscription.value !== undefined) {
          const cloudVal = data.subscription.value;
          setStoredValue(cloudVal);
          window.localStorage.setItem(key, JSON.stringify(cloudVal));
        }
      } catch {
        // ignore
      }
    };

    fetchFromCloud();

    const channel = supabase.channel(`sync_channel_${key}`, {
      config: { broadcast: { ack: false, self: true } }
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: `sync_${key}` }, (payload: any) => {
        const data = payload?.payload || payload;
        if (data && data.value !== undefined) {
          setStoredValue(data.value);
          window.localStorage.setItem(key, JSON.stringify(data.value));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload: any) => {
        if (payload.new && payload.new.key === key && payload.new.value) {
          try {
            const parsed = JSON.parse(payload.new.value);
            setStoredValue(parsed);
            window.localStorage.setItem(key, JSON.stringify(parsed));
          } catch {
            // ignore
          }
        }
      })
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [key]);

  return [storedValue, setValue];
}
