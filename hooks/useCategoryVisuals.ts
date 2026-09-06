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
  PillIcon,
  HomeOutlineIcon,
  CartOutlineIcon,
  GasPumpOutlineIcon,
  UtensilsOutlineIcon,
  FlameOutlineIcon,
  HeartOutlineIcon,
  CarOutlineIcon,
  PlaneOutlineIcon,
  PalmOutlineIcon,
  ShoppingBagOutlineIcon,
  GiftOutlineIcon,
  PillCapsuleOutlineIcon,
  GraduationOutlineIcon,
  PawOutlineIcon,
  LeafOutlineIcon,
  DumbbellOutlineIcon,
  PhoneOutlineIcon,
  MoreDotsOutlineIcon
} from '../components/icons/CategoryIcons';
import { CustomCategoryIcon, useCustomCategoryIcons } from './useCustomCategoryIcons';
import { getColorDef } from '../components/CategoryEditModal';

export interface CategoryVisual {
  icon: React.FC<{ className?: string }>;
  color: string; // background color class for badges (e.g. 'bg-orange-500' or custom)
  textColor: string;
  badgeBg: string;
  bannerBg?: string;
  borderColor: string;
  isCustomImage?: boolean;
  imageUrl?: string;
  isCustomSvg?: boolean;
  svgContent?: string;
  pieColor?: string;
  isFullBadge?: boolean;
}

// Built-in presets map
// Built-in presets map with real icons used throughout the app
export const PRESET_CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  "Dép. récurrentes": {
    icon: MandatoryIcon,
    color: 'bg-[#3b82f6]',
    textColor: 'text-[#2563eb] dark:text-blue-400',
    badgeBg: 'bg-[#dbeafe] dark:bg-blue-950/70',
    borderColor: 'border-blue-100 dark:border-blue-900/40'
  },
  "Dép. recurentes": {
    icon: MandatoryIcon,
    color: 'bg-[#3b82f6]',
    textColor: 'text-[#2563eb] dark:text-blue-400',
    badgeBg: 'bg-[#dbeafe] dark:bg-blue-950/70',
    borderColor: 'border-blue-100 dark:border-blue-900/40'
  },
  "Dépenses obligatoires": {
    icon: MandatoryIcon,
    color: 'bg-[#3b82f6]',
    textColor: 'text-[#2563eb] dark:text-blue-400',
    badgeBg: 'bg-[#dbeafe] dark:bg-blue-950/70',
    borderColor: 'border-blue-100 dark:border-blue-900/40'
  },
  "Carburant": {
    icon: FuelIcon,
    color: 'bg-[#f97316]',
    textColor: 'text-[#ea580c] dark:text-orange-400',
    badgeBg: 'bg-[#ffedd5] dark:bg-orange-950/70',
    borderColor: 'border-orange-100 dark:border-orange-900/40'
  },
  "Chauffage": {
    icon: HeatingIcon,
    color: 'bg-[#10b981]',
    textColor: 'text-[#059669] dark:text-emerald-400',
    badgeBg: 'bg-[#dcfce7] dark:bg-emerald-950/70',
    borderColor: 'border-emerald-100 dark:border-emerald-900/40'
  },
  "Courses": {
    icon: GroceriesIcon,
    color: 'bg-[#3b82f6]',
    textColor: 'text-[#2563eb] dark:text-blue-400',
    badgeBg: 'bg-[#dbeafe] dark:bg-blue-950/70',
    borderColor: 'border-blue-100 dark:border-blue-900/40'
  },
  "Restaurant": {
    icon: RestaurantIcon,
    color: 'bg-[#a855f7]',
    textColor: 'text-[#9333ea] dark:text-purple-400',
    badgeBg: 'bg-[#f3e8ff] dark:bg-purple-950/70',
    borderColor: 'border-purple-100 dark:border-purple-900/40'
  },
  "Vacances": {
    icon: PalmTreeIcon,
    color: 'bg-[#10b981]',
    textColor: 'text-[#059669] dark:text-emerald-400',
    badgeBg: 'bg-[#dcfce7] dark:bg-emerald-950/70',
    borderColor: 'border-emerald-100 dark:border-emerald-900/40'
  },
  "Voiture": {
    icon: CarRepairsIcon,
    color: 'bg-[#0ea5e9]',
    textColor: 'text-[#0284c7] dark:text-sky-400',
    badgeBg: 'bg-[#e0f2fe] dark:bg-sky-950/70',
    borderColor: 'border-sky-100 dark:border-sky-900/40'
  },
  "Réparation voitures": {
    icon: CarRepairsIcon,
    color: 'bg-[#0ea5e9]',
    textColor: 'text-[#0284c7] dark:text-sky-400',
    badgeBg: 'bg-[#e0f2fe] dark:bg-sky-950/70',
    borderColor: 'border-sky-100 dark:border-sky-900/40'
  },
  "Vêtements": {
    icon: ClothingIcon,
    color: 'bg-[#ec4899]',
    textColor: 'text-[#db2777] dark:text-pink-400',
    badgeBg: 'bg-[#fce7f3] dark:bg-pink-950/70',
    borderColor: 'border-pink-100 dark:border-pink-900/40'
  },
  "Cadeau": {
    icon: GiftIcon,
    color: 'bg-[#ec4899]',
    textColor: 'text-[#db2777] dark:text-pink-400',
    badgeBg: 'bg-[#fce7f3] dark:bg-pink-950/70',
    borderColor: 'border-pink-100 dark:border-pink-900/40'
  },
  "Complément alimentaire": {
    icon: PillIcon,
    color: 'bg-[#10b981]',
    textColor: 'text-[#059669] dark:text-emerald-400',
    badgeBg: 'bg-[#dcfce7] dark:bg-emerald-950/70',
    borderColor: 'border-emerald-100 dark:border-emerald-900/40'
  },
  "Divers": {
    icon: MiscIcon,
    color: 'bg-[#3b82f6]',
    textColor: 'text-[#2563eb] dark:text-blue-400',
    badgeBg: 'bg-[#dbeafe] dark:bg-blue-950/70',
    borderColor: 'border-blue-100 dark:border-blue-900/40'
  }
};

export function normalizeCategoryName(name: string): string {
  if (!name) return '';
  let norm = name.toLowerCase().trim();
  // Strip accents
  norm = norm.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Normalize recurrentes/obligatoires/recurentes variations
  if (
    norm.includes('recurent') || 
    norm.includes('recurrent') || 
    norm.includes('obligatoire') || 
    norm.includes('loyer')
  ) {
    return 'dep. recurentes';
  }
  return norm;
}

export const FULL_BADGE_ICONS = new Set<React.FC<any>>([
  TrashBinIcon,
  BirthdayIcon,
  MusicNoteIcon,
  SfrIcon,
  ShieldIcon,
  CeoIcon,
  TotalEnergiesIcon,
  NetflixIcon,
  WifiIcon
]);

export function resolveCategoryVisual(categoryName: string, customIcons: CustomCategoryIcon[] = [], description?: string): CategoryVisual {
  const result = resolveCategoryVisualInner(categoryName, customIcons, description);
  result.isFullBadge = FULL_BADGE_ICONS.has(result.icon);
  if (!result.pieColor) {
    const colorDef = getColorDef(result.color);
    result.pieColor = colorDef.hex;
  }
  return result;
}

function resolveCategoryVisualInner(categoryName: string, customIcons: CustomCategoryIcon[] = [], description?: string): CategoryVisual {
  if (!categoryName) return PRESET_CATEGORY_VISUALS["Divers"];

  // 1. Check custom icons first (matching associated category name or custom icon name)
  const normCategoryName = normalizeCategoryName(categoryName);
  const matchedCustom = customIcons.find(ci => {
    if (!ci.category) return false;
    return normalizeCategoryName(ci.category) === normCategoryName;
  }) || customIcons.find(ci => 
    ci.name.toLowerCase() === categoryName.toLowerCase() ||
    ci.name.toLowerCase().replace(/icon$/, '') === categoryName.toLowerCase()
  );

  if (matchedCustom) {
    const PRESET_LOOKUP: Record<string, { icon: React.FC<{ className?: string }>; defaultColor: string }> = {
      mandatory: { icon: MandatoryIcon, defaultColor: 'bg-[#3b82f6]' },
      mandatoryicon: { icon: MandatoryIcon, defaultColor: 'bg-[#3b82f6]' },
      groceries: { icon: GroceriesIcon, defaultColor: 'bg-[#3b82f6]' },
      groceriesicon: { icon: GroceriesIcon, defaultColor: 'bg-[#3b82f6]' },
      fuel: { icon: FuelIcon, defaultColor: 'bg-[#f97316]' },
      fuelicon: { icon: FuelIcon, defaultColor: 'bg-[#f97316]' },
      restaurant: { icon: RestaurantIcon, defaultColor: 'bg-[#a855f7]' },
      restauranticon: { icon: RestaurantIcon, defaultColor: 'bg-[#a855f7]' },
      heating: { icon: HeatingIcon, defaultColor: 'bg-[#10b981]' },
      heatingicon: { icon: HeatingIcon, defaultColor: 'bg-[#10b981]' },
      carrepairs: { icon: CarRepairsIcon, defaultColor: 'bg-[#0ea5e9]' },
      carrepairsicon: { icon: CarRepairsIcon, defaultColor: 'bg-[#0ea5e9]' },
      vacation: { icon: PalmTreeIcon, defaultColor: 'bg-[#10b981]' },
      palmtreeicon: { icon: PalmTreeIcon, defaultColor: 'bg-[#10b981]' },
      clothing: { icon: ClothingIcon, defaultColor: 'bg-[#ec4899]' },
      clothingicon: { icon: ClothingIcon, defaultColor: 'bg-[#ec4899]' },
      gift: { icon: GiftIcon, defaultColor: 'bg-[#ec4899]' },
      gifticon: { icon: GiftIcon, defaultColor: 'bg-[#ec4899]' },
      pill: { icon: PillIcon, defaultColor: 'bg-[#10b981]' },
      pillicon: { icon: PillIcon, defaultColor: 'bg-[#10b981]' },
      misc: { icon: MiscIcon, defaultColor: 'bg-[#3b82f6]' },
      miscicon: { icon: MiscIcon, defaultColor: 'bg-[#3b82f6]' },
      birthday: { icon: BirthdayIcon, defaultColor: 'bg-[#10b981]' },
      birthdayicon: { icon: BirthdayIcon, defaultColor: 'bg-[#10b981]' },
      shield: { icon: ShieldIcon, defaultColor: 'bg-[#10b981]' },
      shieldicon: { icon: ShieldIcon, defaultColor: 'bg-[#10b981]' },
      wifi: { icon: WifiIcon, defaultColor: 'bg-[#6366f1]' },
      wifiicon: { icon: WifiIcon, defaultColor: 'bg-[#6366f1]' },
      music: { icon: MusicNoteIcon, defaultColor: 'bg-[#a855f7]' },
      musicnoteicon: { icon: MusicNoteIcon, defaultColor: 'bg-[#a855f7]' },
      phone: { icon: DevicePhoneMobileIcon, defaultColor: 'bg-[#0ea5e9]' },
      devicephonemobileicon: { icon: DevicePhoneMobileIcon, defaultColor: 'bg-[#0ea5e9]' },
      water: { icon: CeoIcon, defaultColor: 'bg-[#0ea5e9]' },
      ceoicon: { icon: CeoIcon, defaultColor: 'bg-[#0ea5e9]' },
      energy: { icon: TotalEnergiesIcon, defaultColor: 'bg-[#f59e0b]' },
      totalenergiesicon: { icon: TotalEnergiesIcon, defaultColor: 'bg-[#f59e0b]' },
      trash: { icon: TrashBinIcon, defaultColor: 'bg-[#ef4444]' },
      trashbinicon: { icon: TrashBinIcon, defaultColor: 'bg-[#ef4444]' },
      streaming: { icon: NetflixIcon, defaultColor: 'bg-black' },
      netflixicon: { icon: NetflixIcon, defaultColor: 'bg-black' },
      sfr: { icon: SfrIcon, defaultColor: 'bg-[#ef4444]' },
      sfricon: { icon: SfrIcon, defaultColor: 'bg-[#ef4444]' },
      home: { icon: HomeOutlineIcon, defaultColor: 'bg-[#3b82f6]' },
      heart: { icon: HeartOutlineIcon, defaultColor: 'bg-[#ef4444]' },
      plane: { icon: PlaneOutlineIcon, defaultColor: 'bg-[#3b82f6]' },
      graduation: { icon: GraduationOutlineIcon, defaultColor: 'bg-[#3b82f6]' },
      paw: { icon: PawOutlineIcon, defaultColor: 'bg-[#f59e0b]' },
      leaf: { icon: LeafOutlineIcon, defaultColor: 'bg-[#10b981]' },
      dumbbell: { icon: DumbbellOutlineIcon, defaultColor: 'bg-[#64748b]' },
    };

    const cleanPresetKey = matchedCustom.name.toLowerCase().replace(/icon$/, '');
    const presetIconDef = PRESET_LOOKUP[matchedCustom.name.toLowerCase()] ||
      PRESET_LOOKUP[cleanPresetKey];

    const colorDef = getColorDef(matchedCustom.color || (presetIconDef ? presetIconDef.defaultColor : 'bg-[#3b82f6]'));

    if (presetIconDef) {
      return {
        icon: presetIconDef.icon,
        color: colorDef.bgClass,
        textColor: colorDef.textColorClass,
        badgeBg: colorDef.badgeBgClass,
        borderColor: 'border-slate-200 dark:border-slate-700'
      };
    }

    if (matchedCustom.type === 'svg' && matchedCustom.svgContent) {
      const svgHtml = matchedCustom.svgContent;
      const CustomSvgIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
        React.createElement('div', {
          className: `${className} flex items-center justify-center [&>svg]:w-full [&>svg]:h-full`,
          dangerouslySetInnerHTML: { __html: svgHtml }
        })
      );
      return {
        icon: CustomSvgIcon,
        color: colorDef.bgClass,
        textColor: colorDef.textColorClass,
        badgeBg: colorDef.badgeBgClass,
        borderColor: 'border-slate-200 dark:border-slate-700',
        isCustomSvg: true,
        svgContent: matchedCustom.svgContent
      };
    } else if (matchedCustom.imageUrl) {
      const imgUrl = matchedCustom.imageUrl;
      const CustomImgIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
        React.createElement('img', {
          src: imgUrl,
          className: `${className} object-contain`,
          alt: matchedCustom.name
        })
      );
      return {
        icon: CustomImgIcon,
        color: colorDef.bgClass,
        textColor: colorDef.textColorClass,
        badgeBg: colorDef.badgeBgClass,
        borderColor: 'border-slate-200 dark:border-slate-700',
        isCustomImage: true,
        imageUrl: matchedCustom.imageUrl
      };
    }
  }

  // 1.5 Check description brand matching if no custom category icon is defined
  if (description) {
    const descNorm = description.toLowerCase();
    if (descNorm.includes('sfr')) {
      return { icon: SfrIcon, color: 'bg-red-600', textColor: 'text-red-600', badgeBg: 'bg-red-50 dark:bg-red-500/10', borderColor: 'border-red-200' };
    }
    if (descNorm.includes('netflix')) {
      return { icon: NetflixIcon, color: 'bg-black', textColor: 'text-slate-800', badgeBg: 'bg-slate-100', borderColor: 'border-slate-200' };
    }
    if (descNorm.includes('total energies')) {
      return { icon: TotalEnergiesIcon, color: 'bg-yellow-400', textColor: 'text-yellow-600', badgeBg: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    }
    if (descNorm.includes('deezer') || descNorm.includes('musique') || descNorm.includes('spotify')) {
      return { icon: MusicNoteIcon, color: 'bg-purple-500', textColor: 'text-purple-600', badgeBg: 'bg-purple-50', borderColor: 'border-purple-200' };
    }
    if (descNorm.includes('poubelles') || descNorm.includes('poubelle') || descNorm.includes('dechet') || descNorm.includes('déchet')) {
      return { icon: TrashBinIcon, color: 'bg-rose-500', textColor: 'text-rose-600', badgeBg: 'bg-rose-50', borderColor: 'border-rose-200' };
    }
    if (descNorm.includes('wifi') || descNorm.includes('internet') || descNorm.includes('fibre') || descNorm.includes('box')) {
      return { icon: WifiIcon, color: 'bg-indigo-500', textColor: 'text-indigo-600', badgeBg: 'bg-indigo-50', borderColor: 'border-indigo-200' };
    }
    if (descNorm.includes('téléphone') || descNorm.includes('telephone') || descNorm.includes('mobile')) {
      return { icon: PhoneOutlineIcon, color: 'bg-[#0ea5e9]', textColor: 'text-[#0284c7]', badgeBg: 'bg-[#e0f2fe]', borderColor: 'border-sky-200' };
    }
    if (descNorm.includes('eau') || descNorm.includes('energie') || descNorm.includes('énergie') || descNorm.includes('ceo')) {
      return { icon: CeoIcon, color: 'bg-sky-500', textColor: 'text-sky-600', badgeBg: 'bg-sky-50', borderColor: 'border-sky-200' };
    }
    if (descNorm.includes('assurance') || descNorm.includes('mutuelle')) {
      return { icon: ShieldIcon, color: 'bg-emerald-500', textColor: 'text-emerald-600', badgeBg: 'bg-emerald-50', borderColor: 'border-emerald-200' };
    }
  }

  // 2. Check direct preset match
  if (PRESET_CATEGORY_VISUALS[categoryName]) {
    return PRESET_CATEGORY_VISUALS[categoryName];
  }

  // 3. Fallback name heuristics for fuzzy matches
  const norm = categoryName.toLowerCase().trim();
  if (norm.includes('recurent') || norm.includes('récurrent') || norm.includes('obligatoire') || norm.includes('loyer')) {
    return PRESET_CATEGORY_VISUALS["Dép. récurrentes"];
  }
  if (norm.includes('essence') || norm.includes('gasoil') || norm.includes('carburant') || norm.includes('diesel')) {
    return PRESET_CATEGORY_VISUALS["Carburant"];
  }
  if (norm.includes('course') || norm.includes('supermarch') || norm.includes('hyper')) {
    return PRESET_CATEGORY_VISUALS["Courses"];
  }
  if (norm.includes('restaurant') || norm.includes('resto') || norm.includes('bar') || norm.includes('brasserie')) {
    return PRESET_CATEGORY_VISUALS["Restaurant"];
  }
  if (norm.includes('chauffage') || norm.includes('bois') || norm.includes('gaz') || norm.includes('pellet') || norm.includes('fioul')) {
    return PRESET_CATEGORY_VISUALS["Chauffage"];
  }
  if (norm.includes('voiture') || norm.includes('garage') || norm.includes('auto') || norm.includes('reparation') || norm.includes('réparation')) {
    return PRESET_CATEGORY_VISUALS["Voiture"];
  }
  if (norm.includes('vacance') || norm.includes('voyage') || norm.includes('hotel') || norm.includes('hôtel')) {
    return PRESET_CATEGORY_VISUALS["Vacances"];
  }
  if (norm.includes('vêtement') || norm.includes('vetement') || norm.includes('habit') || norm.includes('mode')) {
    return PRESET_CATEGORY_VISUALS["Vêtements"];
  }
  if (norm.includes('cadeau') || norm.includes('anniversaire') || norm.includes('fête')) {
    return PRESET_CATEGORY_VISUALS["Cadeau"];
  }
  if (norm.includes('complément') || norm.includes('complement') || norm.includes('santé') || norm.includes('pharmacie') || norm.includes('pill')) {
    return PRESET_CATEGORY_VISUALS["Complément alimentaire"];
  }

  // Special named brand/service matchings
  if (norm.includes('sfr')) {
    return { icon: SfrIcon, color: 'bg-red-600', textColor: 'text-red-600', badgeBg: 'bg-red-50 dark:bg-red-500/10', borderColor: 'border-red-200' };
  }
  if (norm.includes('netflix')) {
    return { icon: NetflixIcon, color: 'bg-black', textColor: 'text-slate-800', badgeBg: 'bg-slate-100', borderColor: 'border-slate-200' };
  }
  if (norm.includes('total')) {
    return { icon: TotalEnergiesIcon, color: 'bg-yellow-400', textColor: 'text-yellow-600', badgeBg: 'bg-yellow-50', borderColor: 'border-yellow-200' };
  }
  if (norm.includes('deezer') || norm.includes('musique') || norm.includes('spotify')) {
    return { icon: MusicNoteIcon, color: 'bg-purple-500', textColor: 'text-purple-600', badgeBg: 'bg-purple-50', borderColor: 'border-purple-200' };
  }
  if (norm.includes('poubelle') || norm.includes('dechet') || norm.includes('déchet')) {
    return { icon: TrashBinIcon, color: 'bg-rose-500', textColor: 'text-rose-600', badgeBg: 'bg-rose-50', borderColor: 'border-rose-200' };
  }
  if (norm.includes('wifi') || norm.includes('internet') || norm.includes('fibre') || norm.includes('box')) {
    return { icon: WifiIcon, color: 'bg-indigo-500', textColor: 'text-indigo-600', badgeBg: 'bg-indigo-50', borderColor: 'border-indigo-200' };
  }
  if (norm.includes('téléphone') || norm.includes('telephone') || norm.includes('mobile')) {
    return { icon: PhoneOutlineIcon, color: 'bg-[#0ea5e9]', textColor: 'text-[#0284c7]', badgeBg: 'bg-[#e0f2fe]', borderColor: 'border-sky-200' };
  }
  if (norm.includes('eau') || norm.includes('energie') || norm.includes('énergie') || norm.includes('ceo')) {
    return { icon: CeoIcon, color: 'bg-sky-500', textColor: 'text-sky-600', badgeBg: 'bg-sky-50', borderColor: 'border-sky-200' };
  }
  if (norm.includes('assurance') || norm.includes('mutuelle')) {
    return { icon: ShieldIcon, color: 'bg-emerald-500', textColor: 'text-emerald-600', badgeBg: 'bg-emerald-50', borderColor: 'border-emerald-200' };
  }

  // Default Divers
  return PRESET_CATEGORY_VISUALS["Divers"];
}

export function useCategoryVisuals() {
  const { customIcons } = useCustomCategoryIcons();

  const getVisual = React.useCallback((categoryName: string, description?: string): CategoryVisual => {
    return resolveCategoryVisual(categoryName, customIcons, description);
  }, [customIcons]);

  return {
    getVisual,
    customIcons
  };
}
