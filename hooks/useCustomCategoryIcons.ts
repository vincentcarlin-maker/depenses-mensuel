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

export function useCustomCategoryIcons(foyerId?: string) {
  const storageKey = foyerId ? `custom_category_icons_${foyerId}` : DEFAULT_STORAGE_KEY;

  const [customIcons, setCustomIcons] = useState<CustomCategoryIcon[]>(() => {
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
      setCustomIcons(saved ? JSON.parse(saved) : []);
    } catch {
      setCustomIcons([]);
    }
  }, [storageKey]);

  // Sync to Supabase & Broadcast
  const syncToCloud = useCallback(async (icons: CustomCategoryIcon[]) => {
    localStorage.setItem(storageKey, JSON.stringify(icons));
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'custom_category_icons_changed',
        payload: { icons, foyerId }
      });
    }
    try {
      await (supabase.from('app_settings') as any).upsert({
        key: storageKey,
        value: JSON.stringify(icons),
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
            setCustomIcons(parsed);
            localStorage.setItem(storageKey, JSON.stringify(parsed));
          }
        } else if (!error && !data) {
          setCustomIcons([]);
        }
      } catch {
        // ignore
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
        if (data && Array.isArray(data.icons) && (!data.foyerId || data.foyerId === foyerId)) {
          setCustomIcons(data.icons);
          localStorage.setItem(storageKey, JSON.stringify(data.icons));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload: any) => {
        if (payload.new && payload.new.key === storageKey && payload.new.value) {
          try {
            const parsed = JSON.parse(payload.new.value);
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
  }, [storageKey, foyerId]);

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
