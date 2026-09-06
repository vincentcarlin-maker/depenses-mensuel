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

const STORAGE_KEY = 'custom_category_icons';

export function useCustomCategoryIcons() {
  const [customIcons, setCustomIcons] = useState<CustomCategoryIcon[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const channelRef = useRef<any>(null);

  // Sync to Supabase & Broadcast
  const syncToCloud = useCallback(async (icons: CustomCategoryIcon[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'custom_category_icons_changed',
        payload: { icons }
      });
    }
    try {
      await (supabase.from('app_settings') as any).upsert({
        key: 'custom_category_icons',
        value: JSON.stringify(icons),
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Could not sync custom_category_icons to Supabase app_settings:', e);
    }
  }, []);

  // Fetch initial from Cloud
  useEffect(() => {
    const fetchFromCloud = async () => {
      try {
        const { data, error } = await (supabase.from('app_settings') as any)
          .select('value')
          .eq('key', 'custom_category_icons')
          .maybeSingle();

        if (!error && data && (data as any).value) {
          const parsed = JSON.parse((data as any).value);
          if (Array.isArray(parsed)) {
            setCustomIcons(parsed);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
        }
      } catch {
        // ignore
      }
    };

    fetchFromCloud();

    const channel = supabase.channel('duobudget_icons_channel', {
      config: { broadcast: { ack: false, self: true } }
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'custom_category_icons_changed' }, (payload: any) => {
        const data = payload?.payload || payload;
        if (data && Array.isArray(data.icons)) {
          setCustomIcons(data.icons);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.icons));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload: any) => {
        if (payload.new && payload.new.key === 'custom_category_icons' && payload.new.value) {
          try {
            const parsed = JSON.parse(payload.new.value);
            if (Array.isArray(parsed)) {
              setCustomIcons(parsed);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
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
  }, []);

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
