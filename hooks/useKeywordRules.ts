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
const DEFAULT_FOYER_ID = 'foyer_vincent_sophie';

export function useKeywordRules(foyerId?: string) {
  const normalizedFoyerId = (!foyerId || foyerId === DEFAULT_FOYER_ID) ? undefined : foyerId;
  const storageKey = normalizedFoyerId ? `keyword_icon_rules_${normalizedFoyerId}` : DEFAULT_STORAGE_KEY;

  const [rules, setRules] = useState<KeywordRule[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey) || localStorage.getItem(DEFAULT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const channelRef = useRef<any>(null);

  // Keep state in sync when foyerId / storageKey changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey) || localStorage.getItem(DEFAULT_STORAGE_KEY);
      setRules(saved ? JSON.parse(saved) : []);
    } catch {
      setRules([]);
    }
  }, [storageKey]);

  // Sync to Supabase & Broadcast
  const syncToCloud = useCallback(async (updatedRules: KeywordRule[]) => {
    localStorage.setItem(storageKey, JSON.stringify(updatedRules));
    if (storageKey !== DEFAULT_STORAGE_KEY) {
      localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(updatedRules));
    }
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'keyword_icon_rules_changed',
        payload: { rules: updatedRules, foyerId: foyerId || DEFAULT_FOYER_ID }
      });
    }
    try {
      await (supabase.from('app_settings') as any).upsert({
        key: storageKey,
        value: JSON.stringify(updatedRules),
        updated_at: new Date().toISOString()
      });
      if (storageKey !== DEFAULT_STORAGE_KEY) {
        await (supabase.from('app_settings') as any).upsert({
          key: DEFAULT_STORAGE_KEY,
          value: JSON.stringify(updatedRules),
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn(`Could not sync ${storageKey} to Supabase app_settings:`, e);
    }
  }, [storageKey, foyerId]);

  // Fetch initial from Cloud
  useEffect(() => {
    const fetchFromCloud = async () => {
      try {
        const keysToFetch = normalizedFoyerId 
          ? [storageKey] 
          : ['keyword_icon_rules', 'keyword_icon_rules_foyer_vincent_sophie'];

        const { data, error } = await (supabase.from('app_settings') as any)
          .select('key, value')
          .in('key', keysToFetch);

        if (!error && data && data.length > 0) {
          let combined: KeywordRule[] = [];
          data.forEach((row: any) => {
            if (row.value) {
              try {
                const parsed = JSON.parse(row.value);
                if (Array.isArray(parsed)) {
                  combined = [...combined, ...parsed];
                }
              } catch {}
            }
          });

          const uniqueMap = new Map<string, KeywordRule>();
          combined.forEach(item => {
            if (item.keyword) {
              uniqueMap.set(item.keyword.toLowerCase().trim(), item);
            }
          });

          const deduplicated = Array.from(uniqueMap.values());
          if (deduplicated.length > 0) {
            setRules(deduplicated);
            localStorage.setItem(storageKey, JSON.stringify(deduplicated));
          }
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
        if (data && Array.isArray(data.rules)) {
          setRules(data.rules);
          localStorage.setItem(storageKey, JSON.stringify(data.rules));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload: any) => {
        if (payload.new && (payload.new.key === storageKey || payload.new.key === DEFAULT_STORAGE_KEY) && payload.new.value) {
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
  }, [storageKey, normalizedFoyerId, foyerId]);

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
