import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';

export interface CustomCategoryIcon {
  id: string;
  name: string;
  category: string;
  type: 'svg' | 'image';
  svgContent?: string;
  imageUrl?: string;
  color?: string;
  createdAt: string;
}

const DEFAULT_STORAGE_KEY = 'custom_category_icons';
const DEFAULT_FOYER_ID = 'foyer_vincent_sophie';

export function useCustomCategoryIcons(foyerId?: string) {
  const normalizedFoyerId = (!foyerId || foyerId === DEFAULT_FOYER_ID) ? undefined : foyerId;
  const storageKey = normalizedFoyerId ? `custom_category_icons_${normalizedFoyerId}` : DEFAULT_STORAGE_KEY;

  const [customIcons, setCustomIcons] = useState<CustomCategoryIcon[]>(() => {
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
      setCustomIcons(saved ? JSON.parse(saved) : []);
    } catch {
      setCustomIcons([]);
    }
  }, [storageKey]);

  // Sync to Supabase & Broadcast
  const syncToCloud = useCallback(async (icons: CustomCategoryIcon[]) => {
    localStorage.setItem(storageKey, JSON.stringify(icons));
    if (storageKey !== DEFAULT_STORAGE_KEY) {
      localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(icons));
    }
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'custom_category_icons_changed',
        payload: { icons, foyerId: foyerId || DEFAULT_FOYER_ID }
      });
    }
    try {
      await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `setting_${storageKey}`);
      await (supabase.from('push_subscriptions') as any).insert({
        user_id: `setting_${storageKey}`,
        subscription: { icons },
        created_at: new Date().toISOString()
      });

      if (storageKey !== DEFAULT_STORAGE_KEY) {
        await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `setting_${DEFAULT_STORAGE_KEY}`);
        await (supabase.from('push_subscriptions') as any).insert({
          user_id: `setting_${DEFAULT_STORAGE_KEY}`,
          subscription: { icons },
          created_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn(`Could not sync ${storageKey} to Supabase push_subscriptions:`, e);
    }
  }, [storageKey, foyerId]);

  // Fetch initial from Cloud
  useEffect(() => {
    const fetchFromCloud = async () => {
      try {
        const keysToFetch = normalizedFoyerId 
          ? [`setting_${storageKey}`] 
          : [`setting_${DEFAULT_STORAGE_KEY}`, `setting_custom_category_icons_foyer_vincent_sophie`];

        const { data, error } = await (supabase.from('push_subscriptions') as any)
          .select('user_id, subscription')
          .in('user_id', keysToFetch);

        if (!error && data && data.length > 0) {
          let combined: CustomCategoryIcon[] = [];
          data.forEach((row: any) => {
            if (row.subscription?.icons) {
              try {
                const parsed = row.subscription.icons;
                if (Array.isArray(parsed)) {
                  combined = [...combined, ...parsed];
                }
              } catch {}
            }
          });

          const uniqueMap = new Map<string, CustomCategoryIcon>();
          combined.forEach(item => {
            const key = item.category ? `cat_${item.category.toLowerCase().trim()}` : `id_${item.id}`;
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, item);
            }
          });

          const deduplicated = Array.from(uniqueMap.values());
          if (deduplicated.length > 0) {
            setCustomIcons(deduplicated);
            localStorage.setItem(storageKey, JSON.stringify(deduplicated));
          }
        }
      } catch (err) {
        console.warn("Could not fetch custom category icons from cloud:", err);
      }
    };

    fetchFromCloud();

    const channel = supabase.channel(`duobudget_icons_${storageKey}`, {
      config: { broadcast: { ack: false, self: true } }
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'custom_category_icons_changed' }, (payload: any) => {
        const data = payload?.payload || payload;
        if (data && Array.isArray(data.icons)) {
          setCustomIcons(data.icons);
          localStorage.setItem(storageKey, JSON.stringify(data.icons));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'push_subscriptions' }, (payload: any) => {
        if (payload.new && (payload.new.user_id === `setting_${storageKey}` || payload.new.user_id === `setting_${DEFAULT_STORAGE_KEY}`) && payload.new.subscription?.icons) {
          try {
            const parsed = payload.new.subscription.icons;
            if (Array.isArray(parsed)) {
              setCustomIcons(parsed);
              localStorage.setItem(storageKey, JSON.stringify(parsed));
            }
          } catch {
            // ignore
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storageKey, normalizedFoyerId, foyerId]);

  const addCustomIcon = useCallback((iconData: Omit<CustomCategoryIcon, 'id' | 'createdAt'>) => {
    const newIcon: CustomCategoryIcon = {
      ...iconData,
      id: `custom_icon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };

    setCustomIcons(prev => {
      // Replace if same name or category exists
      const filtered = prev.filter(i => i.name.toLowerCase() !== newIcon.name.toLowerCase());
      const updated = [newIcon, ...filtered];
      syncToCloud(updated);
      return updated;
    });

    return newIcon;
  }, [syncToCloud]);

  const saveCategoryIconMapping = useCallback((categoryName: string, iconId: string, color?: string) => {
    const trimmedCat = categoryName.trim();
    if (!trimmedCat) return;

    setCustomIcons(prev => {
      // Find if iconId refers to an existing uploaded custom icon
      const foundCustom = prev.find(i => i.id === iconId || i.name === iconId || i.name.toLowerCase().replace(/icon$/, '') === iconId.toLowerCase());

      // Filter out any previous mapping specifically assigned to this category (keep pure icon assets that have no category or different category)
      const filtered = prev.filter(i => !i.category || i.category.toLowerCase() !== trimmedCat.toLowerCase());

      const newMapping: CustomCategoryIcon = {
        id: `mapping_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: foundCustom ? foundCustom.name : iconId,
        category: trimmedCat,
        type: foundCustom ? foundCustom.type : 'svg',
        svgContent: foundCustom?.svgContent,
        imageUrl: foundCustom?.imageUrl,
        color: color,
        createdAt: new Date().toISOString()
      };
      const updated = [newMapping, ...filtered];
      syncToCloud(updated);
      return updated;
    });
  }, [syncToCloud]);

  const deleteCustomIcon = useCallback((iconId: string) => {
    setCustomIcons(prev => {
      const updated = prev.filter(i => i.id !== iconId);
      syncToCloud(updated);
      return updated;
    });
  }, [syncToCloud]);

  return {
    customIcons,
    addCustomIcon,
    saveCategoryIconMapping,
    deleteCustomIcon
  };
}
