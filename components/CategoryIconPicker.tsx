import React from 'react';
import {
  MandatoryIcon,
  FuelIcon,
  HeatingIcon,
  GroceriesIcon,
  RestaurantIcon,
  CarRepairsIcon,
  MiscIcon,
  GiftIcon,
  ClothingIcon,
  PalmTreeIcon,
  BirthdayIcon,
  ShieldIcon,
  WifiIcon,
  MusicNoteIcon,
  DevicePhoneMobileIcon,
  CeoIcon,
  SfrIcon,
  TotalEnergiesIcon,
  TrashBinIcon,
  NetflixIcon,
  PillIcon
} from './icons/CategoryIcons';
import { CustomCategoryIcon } from '../hooks/useCustomCategoryIcons';

export interface CategoryIconDefinition {
  id: string;
  name: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string; // Tailwind background or text class
  badgeBg: string; // Tailwind background class for badges
  textColor: string;
}

export const PRESET_CATEGORY_ICONS: CategoryIconDefinition[] = [
  { id: 'mandatory', name: 'MandatoryIcon', label: 'Dép. récurrentes', icon: MandatoryIcon, color: 'bg-slate-500', badgeBg: 'bg-slate-100 dark:bg-slate-700', textColor: 'text-slate-600 dark:text-slate-300' },
  { id: 'groceries', name: 'GroceriesIcon', label: 'Courses', icon: GroceriesIcon, color: 'bg-emerald-500', badgeBg: 'bg-[#dbeafe] dark:bg-sky-950/70', textColor: 'text-[#2563eb] dark:text-sky-400' },
  { id: 'fuel', name: 'FuelIcon', label: 'Carburant', icon: FuelIcon, color: 'bg-orange-500', badgeBg: 'bg-[#ffe4e6] dark:bg-rose-950/70', textColor: 'text-[#f43f5e] dark:text-rose-400' },
  { id: 'restaurant', name: 'RestaurantIcon', label: 'Restaurant', icon: RestaurantIcon, color: 'bg-purple-500', badgeBg: 'bg-[#f3e8ff] dark:bg-purple-950/70', textColor: 'text-[#a855f7] dark:text-purple-400' },
  { id: 'heating', name: 'HeatingIcon', label: 'Chauffage', icon: HeatingIcon, color: 'bg-red-500', badgeBg: 'bg-[#dcfce7] dark:bg-emerald-950/70', textColor: 'text-[#10b981] dark:text-emerald-400' },
  { id: 'carrepairs', name: 'CarRepairsIcon', label: 'Voiture', icon: CarRepairsIcon, color: 'bg-amber-500', badgeBg: 'bg-[#dbeafe] dark:bg-sky-950/70', textColor: 'text-[#0284c7] dark:text-sky-400' },
  { id: 'vacation', name: 'PalmTreeIcon', label: 'Vacances', icon: PalmTreeIcon, color: 'bg-teal-500', badgeBg: 'bg-[#dcfce7] dark:bg-emerald-950/70', textColor: 'text-[#10b981] dark:text-emerald-400' },
  { id: 'clothing', name: 'ClothingIcon', label: 'Vêtements', icon: ClothingIcon, color: 'bg-indigo-500', badgeBg: 'bg-[#ffe4e6] dark:bg-rose-950/70', textColor: 'text-[#f43f5e] dark:text-rose-400' },
  { id: 'gift', name: 'GiftIcon', label: 'Cadeau', icon: GiftIcon, color: 'bg-fuchsia-500', badgeBg: 'bg-[#ffe4e6] dark:bg-pink-950/70', textColor: 'text-[#ec4899] dark:text-pink-400' },
  { id: 'pill', name: 'PillIcon', label: 'Santé / Compl.', icon: PillIcon, color: 'bg-emerald-500', badgeBg: 'bg-[#dcfce7] dark:bg-emerald-950/70', textColor: 'text-[#10b981] dark:text-emerald-400' },
  { id: 'birthday', name: 'BirthdayIcon', label: 'Anniversaire', icon: BirthdayIcon, color: 'bg-emerald-500', badgeBg: 'bg-[#fef3c7] dark:bg-amber-950/70', textColor: 'text-[#d97706] dark:text-amber-400' },
  { id: 'shield', name: 'ShieldIcon', label: 'Assurance', icon: ShieldIcon, color: 'bg-emerald-500', badgeBg: 'bg-[#dcfce7] dark:bg-emerald-950/70', textColor: 'text-[#059669] dark:text-emerald-400' },
  { id: 'wifi', name: 'WifiIcon', label: 'Internet', icon: WifiIcon, color: 'bg-indigo-500', badgeBg: 'bg-[#e0e7ff] dark:bg-indigo-950/70', textColor: 'text-[#4f46e5] dark:text-indigo-400' },
  { id: 'phone', name: 'DevicePhoneMobileIcon', label: 'Téléphone', icon: DevicePhoneMobileIcon, color: 'bg-sky-500', badgeBg: 'bg-[#e0f2fe] dark:bg-sky-950/70', textColor: 'text-[#0284c7] dark:text-sky-400' },
  { id: 'music', name: 'MusicNoteIcon', label: 'Musique / Deezer', icon: MusicNoteIcon, color: 'bg-purple-500', badgeBg: 'bg-[#fae8ff] dark:bg-fuchsia-950/70', textColor: 'text-[#a21caf] dark:text-fuchsia-400' },
  { id: 'water', name: 'CeoIcon', label: 'Eau / Énergie', icon: CeoIcon, color: 'bg-sky-500', badgeBg: 'bg-[#e0f2fe] dark:bg-sky-950/70', textColor: 'text-[#0284c7] dark:text-sky-400' },
  { id: 'energy', name: 'TotalEnergiesIcon', label: 'TotalEnergies', icon: TotalEnergiesIcon, color: 'bg-amber-400', badgeBg: 'bg-[#fef9c3] dark:bg-yellow-950/70', textColor: 'text-[#ca8a04] dark:text-yellow-400' },
  { id: 'trash', name: 'TrashBinIcon', label: 'Poubelles', icon: TrashBinIcon, color: 'bg-rose-500', badgeBg: 'bg-[#fee2e2] dark:bg-rose-950/70', textColor: 'text-[#e11d48] dark:text-rose-400' },
  { id: 'streaming', name: 'NetflixIcon', label: 'Streaming', icon: NetflixIcon, color: 'bg-black', badgeBg: 'bg-slate-100 dark:bg-slate-700', textColor: 'text-slate-800 dark:text-slate-200' },
  { id: 'misc', name: 'MiscIcon', label: 'Divers', icon: MiscIcon, color: 'bg-cyan-500', badgeBg: 'bg-[#dbeafe] dark:bg-blue-950/70', textColor: 'text-[#3b82f6] dark:text-blue-400' },
];

export const COLOR_SWATCHES = [
  { label: 'Bleu', value: 'bg-blue-500' },
  { label: 'Vert / Émeraude', value: 'bg-emerald-500' },
  { label: 'Orange', value: 'bg-orange-500' },
  { label: 'Rose / Fushia', value: 'bg-pink-500' },
  { label: 'Violet', value: 'bg-purple-500' },
  { label: 'Rouge', value: 'bg-red-500' },
  { label: 'Ambre / Jaune', value: 'bg-amber-500' },
  { label: 'Teal / Turquoise', value: 'bg-teal-500' },
  { label: 'Indigo', value: 'bg-indigo-500' },
  { label: 'Cyan / Ciel', value: 'bg-cyan-500' },
  { label: 'Gris / Ardoise', value: 'bg-slate-500' },
  { label: 'Noir', value: 'bg-black' },
];

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
  selectedColor,
  onSelectColor,
  customIcons = [],
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Choisir une icône
        </label>
        <span className="text-[11px] text-slate-400 font-medium">
          {PRESET_CATEGORY_ICONS.length + customIcons.length} disponibles
        </span>
      </div>

      {/* Grid of Icons */}
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-52 overflow-y-auto p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/80 dark:border-slate-700">
        {/* Presets */}
        {PRESET_CATEGORY_ICONS.map((item) => {
          const isSelected = selectedIconId === item.id || selectedIconId === item.name;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectIcon(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 ring-2 ring-[#4f83f8] shadow-sm scale-105'
                  : 'hover:bg-white/60 dark:hover:bg-slate-800/50 opacity-80 hover:opacity-100'
              }`}
              title={item.label}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? item.badgeBg : 'bg-slate-200/60 dark:bg-slate-600/50'}`}>
                <div className={isSelected ? item.textColor : 'text-slate-600 dark:text-slate-300'}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center mt-1">
                {item.label}
              </span>
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
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 ring-2 ring-[#4f83f8] shadow-sm scale-105'
                  : 'hover:bg-white/60 dark:hover:bg-slate-800/50 opacity-80 hover:opacity-100'
              }`}
              title={ci.name}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${ci.color || 'bg-fuchsia-500'} text-white`}>
                {ci.type === 'svg' && ci.svgContent ? (
                  <div
                    className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4"
                    dangerouslySetInnerHTML={{ __html: ci.svgContent }}
                  />
                ) : ci.imageUrl ? (
                  <img src={ci.imageUrl} className="w-4 h-4 object-contain" alt={ci.name} />
                ) : (
                  <span className="text-xs">✨</span>
                )}
              </div>
              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center mt-1">
                {ci.name.replace(/Icon$/, '')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Color selection if provided */}
      {onSelectColor && (
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Couleur du macaron
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => onSelectColor(c.value)}
                className={`w-6 h-6 rounded-lg ${c.value} transition-transform cursor-pointer ${
                  selectedColor === c.value ? 'ring-2 ring-offset-2 ring-[#4f83f8] scale-110' : 'opacity-75 hover:opacity-100'
                }`}
                title={c.label}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
