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

      // Save to Supabase
      (async () => {
        try {
          await (supabase.from('app_settings') as any).upsert({
            key: key,
            value: JSON.stringify(nextValue),
            updated_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn(`Could not sync ${key} to Supabase app_settings:`, e);
        }
      })();

      return nextValue;
    });
  }, [key]);

  // Fetch initial from Cloud & setup Realtime
  useEffect(() => {
    const fetchFromCloud = async () => {
      try {
        const { data, error } = await (supabase.from('app_settings') as any)
          .select('value')
          .eq('key', key)
          .maybeSingle();

        if (!error && data && data.value) {
          const parsed = JSON.parse(data.value);
          setStoredValue(parsed);
          window.localStorage.setItem(key, JSON.stringify(parsed));
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
