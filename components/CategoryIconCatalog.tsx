import React, { useState, useMemo } from 'react';
import {
  PRESET_CATEGORY_ICONS,
  CATEGORY_THEMES,
  CategoryIconDef
} from './CategoryEditModal';
import { CustomCategoryIcon } from '../hooks/useCustomCategoryIcons';

export interface CategoryIconCatalogProps {
  selectedIconId: string;
  onSelectIcon: (iconId: string, customIcon?: CustomCategoryIcon) => void;
  customIcons?: CustomCategoryIcon[];
  onDeleteCustomIcon?: (id: string) => void;
  className?: string;
  maxHeight?: string;
}

export const CategoryIconCatalog: React.FC<CategoryIconCatalogProps> = ({
  selectedIconId,
  onSelectIcon,
  customIcons = [],
  onDeleteCustomIcon,
  className = '',
  maxHeight = 'max-h-56 sm:max-h-64',
}) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter out system icons marked as deleted
  const deletedSystemIcons = useMemo(() => {
    return customIcons
      .filter(ci => ci.category === 'deleted_system_icon')
      .map(ci => ci.name);
  }, [customIcons]);

  const pureCustomIcons = useMemo(() => {
    return customIcons.filter(
      ci => !ci.id?.startsWith('mapping_') && ci.category !== 'deleted_system_icon'
    );
  }, [customIcons]);

  const activePresets = useMemo(() => {
    return PRESET_CATEGORY_ICONS.filter(preset => !deletedSystemIcons.includes(preset.name));
  }, [deletedSystemIcons]);

  // Counts per theme
  const themeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: activePresets.length + pureCustomIcons.length,
      custom: pureCustomIcons.length,
    };

    CATEGORY_THEMES.forEach(t => {
      if (t.id !== 'all' && t.id !== 'custom') {
        counts[t.id] = activePresets.filter(p => p.theme === t.id).length;
      }
    });

    return counts;
  }, [activePresets, pureCustomIcons]);

  // Search filtering
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredPresets = useMemo(() => {
    return activePresets.filter(preset => {
      // Theme filter
      if (selectedThemeId !== 'all' && preset.theme !== selectedThemeId) {
        return false;
      }

      // Search filter
      if (!normalizedQuery) return true;

      const matchLabel = preset.label.toLowerCase().includes(normalizedQuery);
      const matchName = preset.name.toLowerCase().includes(normalizedQuery);
      const matchKeywords = preset.keywords?.some(k => k.toLowerCase().includes(normalizedQuery));

      return matchLabel || matchName || matchKeywords;
    });
  }, [activePresets, selectedThemeId, normalizedQuery]);

  const filteredCustomIcons = useMemo(() => {
    if (selectedThemeId !== 'all' && selectedThemeId !== 'custom') {
      return [];
    }

    return pureCustomIcons.filter(ci => {
      if (!normalizedQuery) return true;
      return ci.name.toLowerCase().includes(normalizedQuery);
    });
  }, [pureCustomIcons, selectedThemeId, normalizedQuery]);

  // Grouped presets by theme for "all" view when not searching
  const groupedThemes = useMemo(() => {
    if (selectedThemeId !== 'all' || normalizedQuery) return null;

    return CATEGORY_THEMES.filter(t => t.id !== 'all' && t.id !== 'custom').map(theme => {
      const icons = activePresets.filter(p => p.theme === theme.id);
      return {
        theme,
        icons,
      };
    }).filter(group => group.icons.length > 0);
  }, [selectedThemeId, normalizedQuery, activePresets]);

  // Find info about currently selected icon
  const currentSelectedInfo = useMemo(() => {
    const preset = activePresets.find(
      p => p.id === selectedIconId || p.name === selectedIconId || p.name.toLowerCase().replace(/icon$/, '') === selectedIconId.toLowerCase()
    );
    if (preset) {
      const theme = CATEGORY_THEMES.find(t => t.id === preset.theme);
      return {
        name: preset.label,
        themeLabel: theme ? `${theme.emoji} ${theme.label}` : 'Standard',
      };
    }

    const custom = pureCustomIcons.find(
      ci => ci.id === selectedIconId || ci.name === selectedIconId || ci.name.toLowerCase().replace(/icon$/, '') === selectedIconId.toLowerCase()
    );
    if (custom) {
      return {
        name: custom.name.replace(/Icon$/, ''),
        themeLabel: '🎨 Personnalisée',
      };
    }

    return {
      name: 'Divers',
      themeLabel: 'Général',
    };
  }, [selectedIconId, activePresets, pureCustomIcons]);

  const renderSingleIconTile = (preset: CategoryIconDef) => {
    const isSelected = selectedIconId === preset.id || selectedIconId === preset.name;
    const IconComp = preset.icon;

    return (
      <button
        key={preset.id}
        type="button"
        onClick={() => onSelectIcon(preset.id)}
        className={`group relative aspect-square w-full rounded-xl flex flex-col items-center justify-center p-1 transition-all duration-150 cursor-pointer overflow-hidden ${
          isSelected
            ? 'bg-[#e0f2fe] dark:bg-sky-950/70 border-2 border-[#0284c7] dark:border-sky-500 text-[#0284c7] dark:text-sky-400 shadow-xs scale-[1.04]'
            : 'bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60'
        }`}
        title={preset.label}
      >
        <div className="w-6 h-6 flex items-center justify-center shrink-0">
          <IconComp className="w-5 h-5 shrink-0" />
        </div>
        <span
          className={`text-[8px] leading-[10px] text-center w-full px-0.5 truncate mt-0.5 ${
            isSelected
              ? 'font-black text-[#0284c7] dark:text-sky-300'
              : 'font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
          }`}
        >
          {preset.label}
        </span>
      </button>
    );
  };

  const renderSingleCustomIconTile = (ci: CustomCategoryIcon) => {
    const isSelected = selectedIconId === ci.id || selectedIconId === ci.name;

    return (
      <div key={ci.id} className="relative group">
        <button
          type="button"
          onClick={() => onSelectIcon(ci.id, ci)}
          className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center p-1 transition-all duration-150 cursor-pointer overflow-hidden ${
            isSelected
              ? 'bg-[#e0f2fe] dark:bg-sky-950/70 border-2 border-[#0284c7] dark:border-sky-500 text-[#0284c7] dark:text-sky-400 shadow-xs scale-[1.04]'
              : 'bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60'
          }`}
          title={ci.name}
        >
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            {ci.type === 'svg' && ci.svgContent ? (
              <div
                className="w-5 h-5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: ci.svgContent }}
              />
            ) : ci.imageUrl ? (
              <img
                src={ci.imageUrl}
                className="w-5 h-5 object-contain"
                alt={ci.name}
              />
            ) : (
              <span className="text-xs">✨</span>
            )}
          </div>
          <span
            className={`text-[8px] leading-[10px] text-center w-full px-0.5 truncate mt-0.5 ${
              isSelected
                ? 'font-black text-[#0284c7] dark:text-sky-300'
                : 'font-medium text-slate-500 dark:text-slate-400'
            }`}
          >
            {ci.name.replace(/Icon$/, '')}
          </span>
        </button>

        {onDeleteCustomIcon && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCustomIcon(ci.id);
            }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer z-10"
            title={`Supprimer « ${ci.name} »`}
          >
            <svg className="w-3 h-3 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une icône... (courses, voiture, sport, santé, café...)"
          className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Theme Pills Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-semibold">
        {CATEGORY_THEMES.map((theme) => {
          // Hide custom theme if no custom icons
          if (theme.id === 'custom' && pureCustomIcons.length === 0) return null;

          const isActive = selectedThemeId === theme.id;
          const count = themeCounts[theme.id] || 0;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                setSelectedThemeId(theme.id);
                // Clear search query when switching theme for cleaner discovery
                if (searchQuery) setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
              }`}
            >
              <span>{theme.emoji}</span>
              <span>{theme.label}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid Container */}
      <div className={`${maxHeight} overflow-y-auto p-2 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 space-y-3`}>
        {/* Case 1: Search results */}
        {normalizedQuery && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Résultats de recherche ({filteredPresets.length + filteredCustomIcons.length})
            </div>
            {filteredPresets.length === 0 && filteredCustomIcons.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                Aucune icône trouvée pour « {searchQuery} »
              </div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {filteredPresets.map(renderSingleIconTile)}
                {filteredCustomIcons.map(renderSingleCustomIconTile)}
              </div>
            )}
          </div>
        )}

        {/* Case 2: Specific theme selected (not "all") */}
        {!normalizedQuery && selectedThemeId !== 'all' && (
          <div>
            {selectedThemeId === 'custom' ? (
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {pureCustomIcons.map(renderSingleCustomIconTile)}
              </div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {filteredPresets.map(renderSingleIconTile)}
              </div>
            )}
          </div>
        )}

        {/* Case 3: "All" theme view without search: Organized into theme sections */}
        {!normalizedQuery && selectedThemeId === 'all' && (
          <>
            {groupedThemes?.map(({ theme, icons }) => (
              <div key={theme.id} className="space-y-1.5">
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-xs">{theme.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {theme.label}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">
                    ({icons.length})
                  </span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {icons.map(renderSingleIconTile)}
                </div>
              </div>
            ))}

            {/* Custom icons section in "all" */}
            {pureCustomIcons.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🎨</span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Mes icônes personnalisées
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">
                    ({pureCustomIcons.length})
                  </span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {pureCustomIcons.map(renderSingleCustomIconTile)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected Icon Label Display */}
      <div className="flex items-center justify-between text-[11px] px-1 pt-0.5">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          Icône sélectionnée :
        </span>
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <span className="capitalize">{currentSelectedInfo.name}</span>
          <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
            · {currentSelectedInfo.themeLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
