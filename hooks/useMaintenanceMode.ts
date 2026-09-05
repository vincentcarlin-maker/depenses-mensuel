import { useState, useEffect, useCallback } from 'react';
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

  // Sync with Supabase table or custom event
  useEffect(() => {
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
          setIsMaintenanceMode(active);
          localStorage.setItem(MAINTENANCE_KEY, String(active));
        }
      } catch (e) {
        console.warn('Unable to query app_settings for maintenance_mode:', e);
      }
    };

    fetchMaintenanceStatus();

    // Subscribe to realtime changes on app_settings
    const channel = supabase
      .channel('public:app_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload: any) => {
        if (payload.new && payload.new.key === 'maintenance_mode') {
          const active = payload.new.value === 'true' || payload.new.value === true;
          setIsMaintenanceMode(active);
          localStorage.setItem(MAINTENANCE_KEY, String(active));
        }
      })
      .subscribe();

    const handleCustomEvent = (e: any) => {
      if (e.detail !== undefined) {
        setIsMaintenanceMode(Boolean(e.detail));
      }
    };
    window.addEventListener('maintenance_mode_changed', handleCustomEvent);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('maintenance_mode_changed', handleCustomEvent);
    };
  }, []);

  const toggleMaintenanceMode = useCallback(async (newState?: boolean) => {
    const targetState = newState !== undefined ? newState : !isMaintenanceMode;
    setIsMaintenanceMode(targetState);
    localStorage.setItem(MAINTENANCE_KEY, String(targetState));
    window.dispatchEvent(new CustomEvent('maintenance_mode_changed', { detail: targetState }));

    // Persist to Supabase app_settings
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
