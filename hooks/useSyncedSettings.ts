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

  const storedValueRef = useRef<T>(storedValue);
  storedValueRef.current = storedValue;

  const initialValueRef = useRef<T>(initialValue);
  initialValueRef.current = initialValue;

  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Keep state in sync if key changes (e.g. foyer switch)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      const next = item ? JSON.parse(item) : initialValueRef.current;
      storedValueRef.current = next;
      setStoredValue(next);
    } catch {
      storedValueRef.current = initialValueRef.current;
      setStoredValue(initialValueRef.current);
    }
  }, [key]);

  const channelRef = useRef<any>(null);

  // Sync to Cloud
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    const nextValue = value instanceof Function ? value(storedValueRef.current) : value;
    storedValueRef.current = nextValue;
    setStoredValue(nextValue);

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

    // Serialize Supabase writes so rapid clicks / StrictMode never create duplicate rows
    writeQueueRef.current = writeQueueRef.current.then(async () => {
      try {
        await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `setting_${key}`);
        await (supabase.from('push_subscriptions') as any).insert({
          user_id: `setting_${key}`,
          subscription: { value: nextValue },
          created_at: new Date().toISOString()
        });
        await (supabase.from('app_settings') as any).upsert({
          key: key,
          value: JSON.stringify(nextValue),
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn(`Could not sync ${key} to Supabase:`, e);
      }
    });
  }, [key]);

  // Fetch initial from Cloud & setup Realtime
  useEffect(() => {
    const fetchFromCloud = async () => {
      try {
        // Try app_settings first
        const { data: appData } = await (supabase.from('app_settings') as any)
          .select('value')
          .eq('key', key)
          .maybeSingle();

        if (appData && appData.value) {
          try {
            const parsed = JSON.parse(appData.value);
            storedValueRef.current = parsed;
            setStoredValue(parsed);
            window.localStorage.setItem(key, JSON.stringify(parsed));
            return;
          } catch {}
        }

        // Fallback to push_subscriptions (use limit(1) to tolerate any historical duplicate rows)
        const { data: rows, error } = await (supabase.from('push_subscriptions') as any)
          .select('subscription')
          .eq('user_id', `setting_${key}`)
          .order('created_at', { ascending: false })
          .limit(1);

        const latest = Array.isArray(rows) ? rows[0] : rows;
        if (!error && latest && latest.subscription && latest.subscription.value !== undefined) {
          const cloudVal = latest.subscription.value;
          storedValueRef.current = cloudVal;
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
          storedValueRef.current = data.value;
          setStoredValue(data.value);
          window.localStorage.setItem(key, JSON.stringify(data.value));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload: any) => {
        if (payload.new && payload.new.key === key && payload.new.value) {
          try {
            const parsed = JSON.parse(payload.new.value);
            storedValueRef.current = parsed;
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
