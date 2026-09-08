import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';

export interface KeywordRule {
  id: string;
  keyword: string;       // e.g. "sfr" or "netflix"
  iconId: string;        // e.g. "sfr" or "streaming"
  color: string;         // background color class (e.g., bg-[#ef4444])
  createdAt: string;
}

const DEFAULT_STORAGE_KEY = 'keyword_icon_rules';

export function useKeywordRules(foyerId?: string) {
  const storageKey = foyerId ? `keyword_icon_rules_${foyerId}` : DEFAULT_STORAGE_KEY;

  const [rules, setRules] = useState<KeywordRule[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const channelRef = useRef<any>(null);

  // Keep state in sync when foyerId / storageKey changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setRules(saved ? JSON.parse(saved) : []);
    } catch {
      setRules([]);
    }
  }, [storageKey]);

  // Sync to Supabase & Broadcast
  const syncToCloud = useCallback(async (updatedRules: KeywordRule[]) => {
    localStorage.setItem(storageKey, JSON.stringify(updatedRules));
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'keyword_icon_rules_changed',
        payload: { rules: updatedRules, foyerId }
      });
    }
    try {
      await (supabase.from('app_settings') as any).upsert({
        key: storageKey,
        value: JSON.stringify(updatedRules),
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn(`Could not sync ${storageKey} to Supabase app_settings:`, e);
    }
  }, [storageKey, foyerId]);

  // Fetch initial from Cloud
  useEffect(() => {
    const fetchFromCloud = async () => {
      try {
        const { data, error } = await (supabase.from('app_settings') as any)
          .select('value')
          .eq('key', storageKey)
          .maybeSingle();

        if (!error && data && (data as any).value) {
          const parsed = JSON.parse((data as any).value);
          if (Array.isArray(parsed)) {
            setRules(parsed);
            localStorage.setItem(storageKey, JSON.stringify(parsed));
          }
        } else if (!error && !data) {
          // No cloud data yet for this foyer: ensure state is empty
          setRules([]);
        }
      } catch {
        // ignore
      }
    };

    fetchFromCloud();

    const channel = supabase.channel(`duobudget_keyword_rules_${storageKey}`, {
      config: { broadcast: { ack: false, self: true } }
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'keyword_icon_rules_changed' }, (payload: any) => {
        const data = payload?.payload || payload;
        if (data && Array.isArray(data.rules) && (!data.foyerId || data.foyerId === foyerId)) {
          setRules(data.rules);
          localStorage.setItem(storageKey, JSON.stringify(data.rules));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload: any) => {
        if (payload.new && payload.new.key === storageKey && payload.new.value) {
          try {
            const parsed = JSON.parse(payload.new.value);
            if (Array.isArray(parsed)) {
              setRules(parsed);
              localStorage.setItem(storageKey, JSON.stringify(parsed));
            }
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
  }, [storageKey, foyerId]);

  const addRule = useCallback((keyword: string, iconId: string, color: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return false;
    
    const newRule: KeywordRule = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      keyword: trimmed,
      iconId,
      color,
      createdAt: new Date().toISOString()
    };
    const updated = [newRule, ...rules.filter(r => r.keyword.toLowerCase() !== trimmed.toLowerCase())];
    setRules(updated);
    syncToCloud(updated);
    return true;
  }, [rules, syncToCloud]);

  const deleteRule = useCallback((id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    syncToCloud(updated);
  }, [rules, syncToCloud]);

  const updateRule = useCallback((id: string, keyword: string, iconId: string, color: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return false;
    
    const updated = rules.map(r => {
      if (r.id === id) {
        return {
          ...r,
          keyword: trimmed,
          iconId,
          color
        };
      }
      return r;
    });
    setRules(updated);
    syncToCloud(updated);
    return true;
  }, [rules, syncToCloud]);

  return {
    rules,
    addRule,
    deleteRule,
    updateRule,
    setRules
  };
}
