import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';

const MAINTENANCE_KEY = 'duobudget_maintenance_mode';

export const useMaintenanceMode = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem(MAINTENANCE_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  });

  const channelRef = useRef<any>(null);

  useEffect(() => {
    // 1. Query Supabase DB app_settings table
    const fetchMaintenanceStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .maybeSingle();

        if (!error && data) {
          const rowData = data as any;
          const active = rowData.value === 'true' || rowData.value === true;
          setIsMaintenanceMode(prev => {
            if (prev !== active) {
              localStorage.setItem(MAINTENANCE_KEY, String(active));
              return active;
            }
            return prev;
          });
        }
      } catch {
        // Ignore table missing errors
      }
    };

    fetchMaintenanceStatus();

    // 2. Realtime Broadcast Channel for instant <100ms multi-client updates
    const channel = supabase.channel('duobudget_system_channel', {
      config: { broadcast: { ack: false, self: true } }
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'maintenance_mode_changed' }, (payload: any) => {
        const data = payload?.payload || payload;
        if (data && typeof data.isMaintenanceMode === 'boolean') {
          const active = data.isMaintenanceMode;
          setIsMaintenanceMode(active);
          localStorage.setItem(MAINTENANCE_KEY, String(active));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload: any) => {
        if (payload.new && payload.new.key === 'maintenance_mode') {
          const active = payload.new.value === 'true' || payload.new.value === true;
          setIsMaintenanceMode(active);
          localStorage.setItem(MAINTENANCE_KEY, String(active));
        }
      })
      .subscribe();

    // 3. Local BroadcastChannel & storage listener for multi-tabs
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('duobudget_maintenance_bc');
      bc.onmessage = (event) => {
        if (event.data && typeof event.data.isMaintenanceMode === 'boolean') {
          setIsMaintenanceMode(event.data.isMaintenanceMode);
        }
      };
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MAINTENANCE_KEY && e.newValue !== null) {
        setIsMaintenanceMode(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Polling fallback every 3 seconds to guarantee sync
    const intervalId = setInterval(fetchMaintenanceStatus, 3000);

    const handleFocus = () => fetchMaintenanceStatus();
    window.addEventListener('focus', handleFocus);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, []);

  const toggleMaintenanceMode = useCallback(async (newState?: boolean) => {
    const targetState = newState !== undefined ? newState : !isMaintenanceMode;
    setIsMaintenanceMode(targetState);
    localStorage.setItem(MAINTENANCE_KEY, String(targetState));

    // Local tab broadcast
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('duobudget_maintenance_bc');
        bc.postMessage({ isMaintenanceMode: targetState });
        bc.close();
      } catch {
        // Ignore
      }
    }

    // Supabase Realtime Broadcast (instant)
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'maintenance_mode_changed',
        payload: { isMaintenanceMode: targetState }
      });
    }

    // Persist in Supabase app_settings
    try {
      await (supabase.from('app_settings') as any).upsert({
        key: 'maintenance_mode',
        value: String(targetState),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not save maintenance_mode to Supabase:', err);
    }
  }, [isMaintenanceMode]);

  return { isMaintenanceMode, toggleMaintenanceMode };
};

