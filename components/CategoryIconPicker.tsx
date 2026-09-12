import React from 'react';
import {
  PRESET_CATEGORY_ICONS,
  CATEGORY_THEMES,
  CATEGORY_COLORS,
  getColorDef,
  CategoryIconDef,
  CategoryThemeDef
} from './CategoryEditModal';
import { CustomCategoryIcon } from '../hooks/useCustomCategoryIcons';
import { useCategoryVisuals } from '../hooks/useCategoryVisuals';
import { CategoryIconCatalog } from './CategoryIconCatalog';
import { ColorPalettePicker } from './ColorPalettePicker';

export { PRESET_CATEGORY_ICONS, CATEGORY_THEMES, CATEGORY_COLORS, getColorDef };
export type { CategoryIconDef, CategoryThemeDef };

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
  customIcons: passedCustomIcons = [],
}) => {
  const { customIcons: contextCustomIcons, deleteCustomIcon } = useCategoryVisuals();
  const customIconsSource = contextCustomIcons.length > 0 ? contextCustomIcons : passedCustomIcons;

  return (
    <div className="space-y-3">
      {/* Header with thematic catalog description */}
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Catalogue d'icônes
        </label>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Classées par thème
        </span>
      </div>

      {/* Thematic Icon Catalog */}
      <CategoryIconCatalog
        selectedIconId={selectedIconId}
        onSelectIcon={onSelectIcon}
        customIcons={customIconsSource}
        onDeleteCustomIcon={deleteCustomIcon}
        maxHeight="max-h-52 sm:max-h-60"
      />

      {/* Expanded Color Palette Picker */}
      {onSelectColor && (
        <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60">
          <ColorPalettePicker
            selectedColor={selectedColor}
            onSelectColor={onSelectColor}
          />
        </div>
      )}
    </div>
  );
};
