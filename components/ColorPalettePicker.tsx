import React, { useState, useMemo } from 'react';
import { CATEGORY_COLORS } from './CategoryEditModal';

export interface ColorPalettePickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  className?: string;
}

const COLOR_FAMILIES = [
  { id: 'all', label: 'Toutes', emoji: '🎨' },
  { id: 'blue', label: 'Bleus', emoji: '🌊' },
  { id: 'green', label: 'Verts', emoji: '🌿' },
  { id: 'warm', label: 'Chauds', emoji: '☀️' },
  { id: 'red', label: 'Rouges', emoji: '🍓' },
  { id: 'purple', label: 'Violets', emoji: '💜' },
  { id: 'teal', label: 'Turquoise', emoji: '💎' },
  { id: 'neutral', label: 'Neutres', emoji: '🏔️' },
  { id: 'pastel', label: 'Pastels', emoji: '🍬' },
];

export const ColorPalettePicker: React.FC<ColorPalettePickerProps> = ({
  selectedColor,
  onSelectColor,
  className = '',
}) => {
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [customHex, setCustomHex] = useState<string>(() => {
    if (selectedColor.startsWith('#')) return selectedColor;
    const match = selectedColor.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
    return match ? `#${match[1]}` : '#3b82f6';
  });

  const filteredColors = useMemo(() => {
    if (selectedFamily === 'all') return CATEGORY_COLORS;
    return CATEGORY_COLORS.filter(c => (c as any).family === selectedFamily);
  }, [selectedFamily]);

  const activeColorDef = useMemo(() => {
    return CATEGORY_COLORS.find(
      c => c.bgClass === selectedColor || c.id === selectedColor || c.hex.toLowerCase() === selectedColor.toLowerCase()
    );
  }, [selectedColor]);

  const isCustomColor = !activeColorDef && (selectedColor.startsWith('#') || selectedColor.includes('#'));

  const handleCustomColorChange = (hex: string) => {
    setCustomHex(hex);
    onSelectColor(`bg-[${hex}]`);
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Familles de couleurs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-semibold">
        {COLOR_FAMILIES.map(family => {
          const isActive = selectedFamily === family.id;
          const count = family.id === 'all'
            ? CATEGORY_COLORS.length
            : CATEGORY_COLORS.filter(c => (c as any).family === family.id).length;

          return (
            <button
              key={family.id}
              type="button"
              onClick={() => setSelectedFamily(family.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="text-xs">{family.emoji}</span>
              <span>{family.label}</span>
              <span className="text-[9px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Nuancier étendu */}
      <div className="p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70">
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2 max-h-36 overflow-y-auto pr-1">
          {filteredColors.map(color => {
            const isSelected =
              selectedColor === color.bgClass ||
              selectedColor === color.id ||
              selectedColor === color.hex;

            return (
              <button
                key={color.id}
                type="button"
                onClick={() => onSelectColor(color.bgClass)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${color.bgClass} flex items-center justify-center transition-transform cursor-pointer relative shrink-0 ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white dark:ring-offset-slate-900 scale-110 shadow-sm z-10'
                    : 'opacity-90 hover:opacity-100 hover:scale-110'
                }`}
                title={`${color.label} (${color.hex})`}
              >
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-white dark:bg-slate-900 shadow-xs" />
                )}
              </button>
            );
          })}
        </div>

        {/* Sélecteur de couleur personnalisée */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="custom-color-input"
              className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-600 shadow-xs cursor-pointer flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
              style={{ backgroundColor: customHex }}
              title="Choisir une couleur personnalisée dans le nuancier"
            >
              <input
                id="custom-color-input"
                type="color"
                value={customHex}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
              <span className="sr-only">Couleur personnalisée</span>
            </label>

            <div>
              <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Couleur sur-mesure
              </span>
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {isCustomColor ? customHex.toUpperCase() : 'Pipette ou code hex'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-mono">#</span>
            <input
              type="text"
              maxLength={7}
              value={customHex.replace('#', '')}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9a-fA-F]/g, '');
                if (val.length <= 6) {
                  const fullHex = `#${val}`;
                  setCustomHex(fullHex);
                  if (val.length === 6 || val.length === 3) {
                    handleCustomColorChange(fullHex);
                  }
                }
              }}
              placeholder="3b82f6"
              className="w-20 px-2 py-1 text-xs font-mono font-bold uppercase bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
