import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  PillIcon,
  HomeOutlineIcon,
  HeartOutlineIcon,
  PlaneOutlineIcon,
  GraduationOutlineIcon,
  PawOutlineIcon,
  LeafOutlineIcon,
  DumbbellOutlineIcon
} from './icons/CategoryIcons';
import { CustomCategoryIcon } from '../hooks/useCustomCategoryIcons';
import { useCategoryVisuals } from '../hooks/useCategoryVisuals';

export interface CategoryIconDef {
  id: string;
  name: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

export const PRESET_CATEGORY_ICONS: CategoryIconDef[] = [
  { id: 'mandatory', name: 'MandatoryIcon', label: 'Dép. récurrentes', icon: MandatoryIcon },
  { id: 'groceries', name: 'GroceriesIcon', label: 'Courses', icon: GroceriesIcon },
  { id: 'fuel', name: 'FuelIcon', label: 'Carburant', icon: FuelIcon },
  { id: 'restaurant', name: 'RestaurantIcon', label: 'Restaurant', icon: RestaurantIcon },
  { id: 'heating', name: 'HeatingIcon', label: 'Chauffage', icon: HeatingIcon },
  { id: 'carrepairs', name: 'CarRepairsIcon', label: 'Voiture', icon: CarRepairsIcon },
  { id: 'vacation', name: 'PalmTreeIcon', label: 'Vacances', icon: PalmTreeIcon },
  { id: 'clothing', name: 'ClothingIcon', label: 'Vêtements', icon: ClothingIcon },
  { id: 'gift', name: 'GiftIcon', label: 'Cadeau', icon: GiftIcon },
  { id: 'pill', name: 'PillIcon', label: 'Complément alim.', icon: PillIcon },
  { id: 'misc', name: 'MiscIcon', label: 'Divers', icon: MiscIcon },
  { id: 'birthday', name: 'BirthdayIcon', label: 'Anniversaire', icon: BirthdayIcon },
  { id: 'shield', name: 'ShieldIcon', label: 'Assurance', icon: ShieldIcon },
  { id: 'wifi', name: 'WifiIcon', label: 'Internet', icon: WifiIcon },
  { id: 'music', name: 'MusicNoteIcon', label: 'Musique', icon: MusicNoteIcon },
  { id: 'phone', name: 'DevicePhoneMobileIcon', label: 'Téléphone', icon: DevicePhoneMobileIcon },
  { id: 'water', name: 'CeoIcon', label: 'Eau', icon: CeoIcon },
  { id: 'energy', name: 'TotalEnergiesIcon', label: 'Énergie', icon: TotalEnergiesIcon },
  { id: 'trash', name: 'TrashBinIcon', label: 'Poubelles', icon: TrashBinIcon },
  { id: 'streaming', name: 'NetflixIcon', label: 'Streaming', icon: NetflixIcon },
  { id: 'sfr', name: 'SfrIcon', label: 'SFR', icon: SfrIcon },
  { id: 'home', name: 'HomeIcon', label: 'Maison', icon: HomeOutlineIcon },
  { id: 'heart', name: 'HeartIcon', label: 'Santé', icon: HeartOutlineIcon },
  { id: 'plane', name: 'PlaneIcon', label: 'Voyage', icon: PlaneOutlineIcon },
  { id: 'graduation', name: 'GraduationIcon', label: 'Études', icon: GraduationOutlineIcon },
  { id: 'paw', name: 'PawIcon', label: 'Animaux', icon: PawOutlineIcon },
  { id: 'leaf', name: 'LeafIcon', label: 'Nature', icon: LeafOutlineIcon },
  { id: 'dumbbell', name: 'DumbbellIcon', label: 'Sport', icon: DumbbellOutlineIcon },
];

export interface ColorSwatch {
  id: string;
  label: string;
  bgClass: string;
  badgeBgClass: string;
  textColorClass: string;
  hex: string;
}

export const CATEGORY_COLORS: ColorSwatch[] = [
  { id: 'blue', label: 'Bleu', bgClass: 'bg-[#3b82f6]', badgeBgClass: 'bg-[#dbeafe] dark:bg-blue-950/70', textColorClass: 'text-[#2563eb] dark:text-blue-400', hex: '#3b82f6' },
  { id: 'emerald', label: 'Vert', bgClass: 'bg-[#10b981]', badgeBgClass: 'bg-[#d1fae5] dark:bg-emerald-950/70', textColorClass: 'text-[#059669] dark:text-emerald-400', hex: '#10b981' },
  { id: 'orange', label: 'Orange', bgClass: 'bg-[#f97316]', badgeBgClass: 'bg-[#ffedd5] dark:bg-orange-950/70', textColorClass: 'text-[#ea580c] dark:text-orange-400', hex: '#f97316' },
  { id: 'pink', label: 'Rose', bgClass: 'bg-[#ec4899]', badgeBgClass: 'bg-[#fce7f3] dark:bg-pink-950/70', textColorClass: 'text-[#db2777] dark:text-pink-400', hex: '#ec4899' },
  { id: 'purple', label: 'Violet', bgClass: 'bg-[#a855f7]', badgeBgClass: 'bg-[#f3e8ff] dark:bg-purple-950/70', textColorClass: 'text-[#9333ea] dark:text-purple-400', hex: '#a855f7' },
  { id: 'red', label: 'Rouge', bgClass: 'bg-[#ef4444]', badgeBgClass: 'bg-[#fee2e2] dark:bg-rose-950/70', textColorClass: 'text-[#dc2626] dark:text-rose-400', hex: '#ef4444' },
  { id: 'amber', label: 'Ambre', bgClass: 'bg-[#f59e0b]', badgeBgClass: 'bg-[#fef3c7] dark:bg-amber-950/70', textColorClass: 'text-[#d97706] dark:text-amber-400', hex: '#f59e0b' },
  { id: 'teal', label: 'Turquoise', bgClass: 'bg-[#14b8a6]', badgeBgClass: 'bg-[#ccfbf1] dark:bg-teal-950/70', textColorClass: 'text-[#0d9488] dark:text-teal-400', hex: '#14b8a6' },
  { id: 'indigo', label: 'Indigo', bgClass: 'bg-[#6366f1]', badgeBgClass: 'bg-[#e0e7ff] dark:bg-indigo-950/70', textColorClass: 'text-[#4f46e5] dark:text-indigo-400', hex: '#6366f1' },
  { id: 'sky', label: 'Bleu ciel', bgClass: 'bg-[#0ea5e9]', badgeBgClass: 'bg-[#e0f2fe] dark:bg-sky-950/70', textColorClass: 'text-[#0284c7] dark:text-sky-400', hex: '#0ea5e9' },
  { id: 'slate', label: 'Ardoise', bgClass: 'bg-[#64748b]', badgeBgClass: 'bg-[#f1f5f9] dark:bg-slate-800', textColorClass: 'text-[#475569] dark:text-slate-300', hex: '#64748b' },
  { id: 'mint', label: 'Menthe', bgClass: 'bg-[#86efac]', badgeBgClass: 'bg-[#dcfce7] dark:bg-emerald-950/70', textColorClass: 'text-[#16a34a] dark:text-emerald-400', hex: '#86efac' },
];

export function getColorDef(colorValue?: string): ColorSwatch {
  if (!colorValue) return CATEGORY_COLORS[0];
  const found = CATEGORY_COLORS.find(
    c => c.id === colorValue || c.bgClass === colorValue || c.hex.toLowerCase() === colorValue.toLowerCase()
  );
  if (found) return found;

  // Generic fallback based on color name inside string
  if (colorValue.includes('emerald') || colorValue.includes('green')) return CATEGORY_COLORS[1];
  if (colorValue.includes('orange')) return CATEGORY_COLORS[2];
  if (colorValue.includes('pink') || colorValue.includes('fuchsia')) return CATEGORY_COLORS[3];
  if (colorValue.includes('purple')) return CATEGORY_COLORS[4];
  if (colorValue.includes('red') || colorValue.includes('rose')) return CATEGORY_COLORS[5];
  if (colorValue.includes('amber') || colorValue.includes('yellow')) return CATEGORY_COLORS[6];
  if (colorValue.includes('teal')) return CATEGORY_COLORS[7];
  if (colorValue.includes('indigo')) return CATEGORY_COLORS[8];
  if (colorValue.includes('sky') || colorValue.includes('cyan')) return CATEGORY_COLORS[9];
  if (colorValue.includes('slate') || colorValue.includes('gray')) return CATEGORY_COLORS[10];
  if (colorValue.includes('mint')) return CATEGORY_COLORS[11];

  return CATEGORY_COLORS[0];
}

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName?: string;
  initialIconId?: string;
  initialColor?: string;
  onSave: (newName: string, iconId: string, color: string) => void;
  isCreateMode?: boolean;
}

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  isOpen,
  onClose,
  categoryName = '',
  initialIconId = 'misc',
  initialColor = 'bg-[#3b82f6]',
  onSave,
  isCreateMode = false,
}) => {
  const { customIcons: rawCustomIcons, deleteCustomIcon } = useCategoryVisuals();
  const customIcons = rawCustomIcons.filter(ci => !ci.id?.startsWith('mapping_'));
  const [name, setName] = useState(categoryName);
  const [selectedIconId, setSelectedIconId] = useState(initialIconId);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [error, setError] = useState('');

  const activeMapping = rawCustomIcons.find(
    ci => ci.id?.startsWith('mapping_') && ci.category?.toLowerCase() === categoryName.toLowerCase()
  );
  const hasActiveMapping = !!activeMapping;

  const handleResetMapping = () => {
    if (activeMapping) {
      deleteCustomIcon(activeMapping.id);
      
      const norm = categoryName.toLowerCase().trim();
      let defaultIcon = 'misc';
      let defaultColor = 'bg-[#3b82f6]';

      if (norm.includes('obligatoire') || norm.includes('dépenses récurrentes') || norm.includes('depenses recurrentes') || norm.includes('dép. recurentes') || norm.includes('dép. récurrentes')) {
        defaultIcon = 'mandatory'; defaultColor = 'bg-[#3b82f6]';
      } else if (norm.includes('essence') || norm.includes('gasoil') || norm.includes('carburant') || norm.includes('diesel')) {
        defaultIcon = 'fuel'; defaultColor = 'bg-[#f97316]';
      } else if (norm.includes('course') || norm.includes('supermarch') || norm.includes('hyper')) {
        defaultIcon = 'groceries'; defaultColor = 'bg-[#3b82f6]';
      } else if (norm.includes('restaurant') || norm.includes('resto') || norm.includes('bar') || norm.includes('brasserie')) {
        defaultIcon = 'restaurant'; defaultColor = 'bg-[#a855f7]';
      } else if (norm.includes('chauffage') || norm.includes('bois') || norm.includes('gaz') || norm.includes('pellet') || norm.includes('fioul')) {
        defaultIcon = 'heating'; defaultColor = 'bg-[#10b981]';
      } else if (norm.includes('voiture') || norm.includes('garage') || norm.includes('auto') || norm.includes('réparation')) {
        defaultIcon = 'carrepairs'; defaultColor = 'bg-[#f59e0b]';
      } else if (norm.includes('vacances') || norm.includes('voyage') || norm.includes('mer') || norm.includes('montagne')) {
        defaultIcon = 'vacation'; defaultColor = 'bg-[#14b8a6]';
      } else if (norm.includes('vêtement') || norm.includes('clothing') || norm.includes('habits') || norm.includes('mode')) {
        defaultIcon = 'clothing'; defaultColor = 'bg-[#ec4899]';
      } else if (norm.includes('cadeau') || norm.includes('offrir') || norm.includes('noel') || norm.includes('noël')) {
        defaultIcon = 'gift'; defaultColor = 'bg-[#ec4899]';
      } else if (norm.includes('complément') || norm.includes('sante') || norm.includes('santé') || norm.includes('pharmac') || norm.includes('pill')) {
        defaultIcon = 'pill'; defaultColor = 'bg-[#10b981]';
      } else if (norm.includes('anniversaire') || norm.includes('anniv')) {
        defaultIcon = 'birthday'; defaultColor = 'bg-[#10b981]';
      } else if (norm.includes('assurance') || norm.includes('assur')) {
        defaultIcon = 'shield'; defaultColor = 'bg-[#10b981]';
      } else if (norm.includes('internet') || norm.includes('wifi') || norm.includes('box')) {
        defaultIcon = 'wifi'; defaultColor = 'bg-[#6366f1]';
      } else if (norm.includes('musique') || norm.includes('spotify') || norm.includes('deezer')) {
        defaultIcon = 'music'; defaultColor = 'bg-[#a855f7]';
      } else if (norm.includes('téléphone') || norm.includes('mobile') || norm.includes('forfait')) {
        defaultIcon = 'phone'; defaultColor = 'bg-[#0ea5e9]';
      } else if (norm.includes('eau')) {
        defaultIcon = 'water'; defaultColor = 'bg-[#0ea5e9]';
      } else if (norm.includes('energie') || norm.includes('électricité') || norm.includes('edf') || norm.includes('totalenergies')) {
        defaultIcon = 'energy'; defaultColor = 'bg-[#f59e0b]';
      } else if (norm.includes('poubelle') || norm.includes('ordure') || norm.includes('déchet')) {
        defaultIcon = 'trash'; defaultColor = 'bg-[#ef4444]';
      } else if (norm.includes('streaming') || norm.includes('netflix') || norm.includes('disney') || norm.includes('canal')) {
        defaultIcon = 'streaming'; defaultColor = 'bg-[#ec4899]';
      } else if (norm.includes('sfr')) {
        defaultIcon = 'sfr'; defaultColor = 'bg-[#ef4444]';
      } else if (norm.includes('maison') || norm.includes('foyer')) {
        defaultIcon = 'home'; defaultColor = 'bg-[#3b82f6]';
      } else if (norm.includes('sport') || norm.includes('gym') || norm.includes('fitness')) {
        defaultIcon = 'dumbbell'; defaultColor = 'bg-[#14b8a6]';
      }

      setSelectedIconId(defaultIcon);
      setSelectedColor(defaultColor);
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setName(categoryName);
      setSelectedIconId(initialIconId || 'misc');
      setSelectedColor(initialColor || 'bg-[#3b82f6]');
      setError('');
    }
  }, [isOpen, categoryName, initialIconId, initialColor]);

  if (!isOpen) return null;

  // Combine built-in presets and custom uploaded icons
  const totalIconsCount = PRESET_CATEGORY_ICONS.length + customIcons.length;
  const colorDef = getColorDef(selectedColor);

  // Find selected icon metadata for preview and label
  const selectedPreset = PRESET_CATEGORY_ICONS.find(
    p => p.id === selectedIconId || p.name === selectedIconId || p.name.toLowerCase().replace(/icon$/, '') === selectedIconId.toLowerCase()
  );
  const selectedCustom = customIcons.find(
    ci => ci.id === selectedIconId || ci.name === selectedIconId || ci.name.toLowerCase().replace(/icon$/, '') === selectedIconId.toLowerCase()
  );

  const selectedIconLabel = selectedPreset
    ? selectedPreset.label
    : selectedCustom
    ? selectedCustom.name.replace(/Icon$/, '')
    : 'Divers';

  const renderIconContent = (iconId: string, custom?: CustomCategoryIcon, _isSelected = false) => {
    if (custom) {
      if (custom.type === 'svg' && custom.svgContent) {
        return (
          <div
            className="w-5 h-5 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 [&>svg]:max-h-5"
            dangerouslySetInnerHTML={{ __html: custom.svgContent }}
          />
        );
      }
      if (custom.imageUrl) {
        return <img src={custom.imageUrl} className="w-5 h-5 object-contain" alt={custom.name} />;
      }
      return <span className="text-sm">✨</span>;
    }

    const preset = PRESET_CATEGORY_ICONS.find(
      p => p.id === iconId || 
           p.name === iconId || 
           p.name.toLowerCase() === iconId.toLowerCase() || 
           p.id.toLowerCase() === iconId.toLowerCase() ||
           p.name.toLowerCase().replace(/icon$/, '') === iconId.toLowerCase()
    );
    if (preset) {
      const IconComp = preset.icon;
      return <IconComp className="w-5 h-5" />;
    }

    return <MiscIcon className="w-5 h-5" />;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Le nom de la catégorie est requis.');
      return;
    }
    onSave(trimmed, selectedIconId, selectedColor);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[250] flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md p-5 sm:p-6 space-y-4 border border-slate-100 dark:border-slate-700 max-h-[92vh] flex flex-col">
        {/* Top grab bar & Header */}
        <div className="shrink-0 space-y-1">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full mx-auto mb-2" />
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isCreateMode ? 'Ajouter une catégorie' : 'Modifier la catégorie'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Modifiez le nom, l'icône et la couleur de la catégorie.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* 1. NOM DE LA CATÉGORIE */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Nom de la catégorie
            </label>
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ex: Chauffage, Courses, Loisirs..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200/90 dark:border-slate-600 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {error && <p className="text-xs text-rose-500 font-bold mt-1">{error}</p>}
          </div>

          {/* 2. APERÇU */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Aperçu
              </label>
              {!isCreateMode && hasActiveMapping && (
                <button
                  type="button"
                  onClick={handleResetMapping}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Réinitialiser l'icône et la couleur par défaut de cette catégorie"
                >
                  <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Réinitialiser</span>
                </button>
              )}
            </div>
            <div className="bg-slate-50/70 dark:bg-slate-700/40 rounded-2xl p-3.5 border border-slate-100/90 dark:border-slate-700/60 flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${colorDef.badgeBgClass} ${colorDef.textColorClass} transition-colors shadow-2xs`}
              >
                {selectedCustom ? (
                  renderIconContent(selectedIconId, selectedCustom)
                ) : (
                  renderIconContent(selectedIconId)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug truncate">
                  {name.trim() || 'Nom de la catégorie'}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                  Voici comment la catégorie apparaîtra dans vos listes.
                </p>
              </div>
            </div>
          </div>

          {/* 3. CHOISIR UNE ICÔNE */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Choisir une icône
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {totalIconsCount} icônes disponibles
              </span>
            </div>

            {/* Grid of Icons (6 cols matching mockup) */}
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1.5 rounded-2xl bg-slate-50/50 dark:bg-slate-700/30 border border-slate-200/70 dark:border-slate-700/70">
              {/* Preset built-ins */}
              {PRESET_CATEGORY_ICONS.map(preset => {
                const isSelected = selectedIconId === preset.id || selectedIconId === preset.name;
                const IconComp = preset.icon;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedIconId(preset.id)}
                    className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#e0f2fe] dark:bg-sky-950/60 border-2 border-[#0284c7] dark:border-sky-500 text-[#0284c7] dark:text-sky-400 shadow-xs scale-105'
                        : 'bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={preset.label}
                  >
                    <IconComp className="w-5 h-5" />
                  </button>
                );
              })}

              {/* Custom Uploaded Icons from Admin */}
              {customIcons.map(ci => {
                const isSelected = selectedIconId === ci.id || selectedIconId === ci.name;
                return (
                  <button
                    key={ci.id}
                    type="button"
                    onClick={() => setSelectedIconId(ci.id)}
                    className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#e0f2fe] dark:bg-sky-950/60 border-2 border-[#0284c7] dark:border-sky-500 text-[#0284c7] dark:text-sky-400 shadow-xs scale-105'
                        : 'bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={ci.name}
                  >
                    {renderIconContent(ci.id, ci, isSelected)}
                  </button>
                );
              })}
            </div>

            {/* Selected Icon Label Display */}
            <div className="text-center pt-1">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Icône sélectionnée
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white capitalize mt-0.5">
                {selectedIconLabel}
              </p>
            </div>
          </div>

          {/* 4. COULEUR DU MACARON */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Couleur du macaron
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 sm:gap-3 py-1">
              {CATEGORY_COLORS.map(color => {
                const isSelected =
                  selectedColor === color.bgClass ||
                  selectedColor === color.id ||
                  selectedColor === color.hex;

                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColor(color.bgClass)}
                    className={`w-9 h-9 rounded-full ${color.bgClass} flex items-center justify-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-800 scale-110 shadow-xs'
                        : 'opacity-85 hover:opacity-100 hover:scale-105'
                    }`}
                    title={color.label}
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-white dark:bg-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Bottom Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm sm:text-base transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 px-4 rounded-2xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-sm sm:text-base shadow-xs transition-colors cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
