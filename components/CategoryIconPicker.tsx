import React from 'react';
import {
  PRESET_CATEGORY_ICONS,
  CATEGORY_COLORS,
  getColorDef,
  CategoryIconDef
} from './CategoryEditModal';
import { CustomCategoryIcon } from '../hooks/useCustomCategoryIcons';

export { PRESET_CATEGORY_ICONS, CATEGORY_COLORS, getColorDef };

interface CategoryIconPickerProps {
  selectedIconId: string;
  onSelectIcon: (iconId: string, customIcon?: CustomCategoryIcon) => void;
  selectedColor?: string;
  onSelectColor?: (color: string) => void;
  customIcons?: CustomCategoryIcon[];
}

export const CategoryIconPicker: React.FC<CategoryIconPickerProps> = ({
  selectedIconId,
  onSelectIcon,
  selectedColor = 'bg-[#3b82f6]',
  onSelectColor,
  customIcons = [],
}) => {
  const totalCount = PRESET_CATEGORY_ICONS.length + customIcons.length;

  const selectedPreset = PRESET_CATEGORY_ICONS.find(
    p => p.id === selectedIconId || p.name === selectedIconId || p.name.toLowerCase().replace(/icon$/, '') === selectedIconId.toLowerCase()
  );
  const selectedCustom = customIcons.find(
    ci => ci.id === selectedIconId || ci.name === selectedIconId || ci.name.toLowerCase().replace(/icon$/, '') === selectedIconId.toLowerCase()
  );
  const selectedLabel = selectedPreset
    ? selectedPreset.label
    : selectedCustom
    ? selectedCustom.name.replace(/Icon$/, '')
    : 'Divers';

  const renderIconContent = (iconDef?: CategoryIconDef, custom?: CustomCategoryIcon) => {
    if (custom) {
      if (custom.type === 'svg' && custom.svgContent) {
        return (
          <div
            className="w-5 h-5 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5"
            dangerouslySetInnerHTML={{ __html: custom.svgContent }}
          />
        );
      }
      if (custom.imageUrl) {
        return <img src={custom.imageUrl} className="w-5 h-5 object-contain" alt={custom.name} />;
      }
      return <span className="text-sm">✨</span>;
    }

    if (iconDef) {
      const IconComp = iconDef.icon;
      return <IconComp className="w-5 h-5" />;
    }

    return <span className="text-sm">📌</span>;
  };

  return (
    <div className="space-y-3">
      {/* Header with counter */}
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Choisir une icône
        </label>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          {totalCount} icônes disponibles
        </span>
      </div>

      {/* Grid of Icons */}
      <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1.5 rounded-2xl bg-slate-50/50 dark:bg-slate-700/30 border border-slate-200/70 dark:border-slate-700/70">
        {/* Built-ins */}
        {PRESET_CATEGORY_ICONS.map((item) => {
          const isSelected = selectedIconId === item.id || selectedIconId === item.name;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectIcon(item.id)}
              className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#e0f2fe] dark:bg-sky-950/60 border-2 border-[#0284c7] dark:border-sky-500 text-[#0284c7] dark:text-sky-400 shadow-xs scale-105'
                  : 'bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={item.label}
            >
              {renderIconContent(item)}
            </button>
          );
        })}

        {/* Custom Uploaded Icons */}
        {customIcons.map((ci) => {
          const isSelected = selectedIconId === ci.id || selectedIconId === ci.name;
          return (
            <button
              key={ci.id}
              type="button"
              onClick={() => onSelectIcon(ci.id, ci)}
              className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#e0f2fe] dark:bg-sky-950/60 border-2 border-[#0284c7] dark:border-sky-500 text-[#0284c7] dark:text-sky-400 shadow-xs scale-105'
                  : 'bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={ci.name}
            >
              {renderIconContent(undefined, ci)}
            </button>
          );
        })}
      </div>

      {/* Selected icon name */}
      <div className="text-center pt-0.5">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Icône sélectionnée
        </p>
        <p className="text-sm font-bold text-slate-900 dark:text-white capitalize mt-0.5">
          {selectedLabel}
        </p>
      </div>

      {/* Color Swatches */}
      {onSelectColor && (
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Couleur du macaron
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 py-1">
            {CATEGORY_COLORS.map((c) => {
              const isSelected =
                selectedColor === c.bgClass ||
                selectedColor === c.id ||
                selectedColor === c.hex;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectColor(c.bgClass)}
                  className={`w-9 h-9 rounded-full ${c.bgClass} flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-800 scale-110 shadow-xs'
                      : 'opacity-85 hover:opacity-100 hover:scale-105'
                  }`}
                  title={c.label}
                >
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-white dark:bg-slate-900" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
