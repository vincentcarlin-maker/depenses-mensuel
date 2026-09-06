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
} from '../components/icons/CategoryIcons';
import { CustomCategoryIcon, useCustomCategoryIcons } from './useCustomCategoryIcons';

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
}

// Built-in presets map
export const PRESET_CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  "Dép. récurrentes": {
    icon: MandatoryIcon,
    color: 'bg-slate-500',
    textColor: 'text-slate-600 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-700',
    borderColor: 'border-slate-200 dark:border-slate-600'
  },
  "Dép. recurentes": {
    icon: MandatoryIcon,
    color: 'bg-slate-500',
    textColor: 'text-slate-600 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-700',
    borderColor: 'border-slate-200 dark:border-slate-600'
  },
  "Dépenses obligatoires": {
    icon: MandatoryIcon,
    color: 'bg-slate-500',
    textColor: 'text-slate-600 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-700',
    borderColor: 'border-slate-200 dark:border-slate-600'
  },
  "Carburant": {
    icon: FuelIcon,
    color: 'bg-orange-500',
    textColor: 'text-orange-600 dark:text-orange-400',
    badgeBg: 'bg-orange-50 dark:bg-orange-500/10',
    borderColor: 'border-orange-100 dark:border-orange-500/20'
  },
  "Chauffage": {
    icon: HeatingIcon,
    color: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    badgeBg: 'bg-red-50 dark:bg-red-500/10',
    borderColor: 'border-red-100 dark:border-red-500/20'
  },
  "Courses": {
    icon: GroceriesIcon,
    color: 'bg-green-500',
    textColor: 'text-green-600 dark:text-green-400',
    badgeBg: 'bg-green-50 dark:bg-green-500/10',
    borderColor: 'border-green-100 dark:border-green-500/20'
  },
  "Restaurant": {
    icon: RestaurantIcon,
    color: 'bg-purple-500',
    textColor: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-50 dark:bg-purple-500/10',
    borderColor: 'border-purple-100 dark:border-purple-500/20'
  },
  "Vacances": {
    icon: PalmTreeIcon,
    color: 'bg-teal-500',
    textColor: 'text-teal-600 dark:text-teal-400',
    badgeBg: 'bg-teal-50 dark:bg-teal-500/10',
    borderColor: 'border-teal-100 dark:border-teal-500/20'
  },
  "Réparation voitures": {
    icon: CarRepairsIcon,
    color: 'bg-yellow-400',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    badgeBg: 'bg-yellow-50 dark:bg-yellow-500/10',
    borderColor: 'border-yellow-100 dark:border-yellow-500/20'
  },
  "Vêtements": {
    icon: ClothingIcon,
    color: 'bg-indigo-500',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    borderColor: 'border-indigo-100 dark:border-indigo-500/20'
  },
  "Cadeau": {
    icon: GiftIcon,
    color: 'bg-fuchsia-500',
    textColor: 'text-fuchsia-600 dark:text-fuchsia-400',
    badgeBg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10',
    borderColor: 'border-fuchsia-100 dark:border-fuchsia-500/20'
  },
  "Complément alimentaire": {
    icon: PillIcon,
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    borderColor: 'border-emerald-100 dark:border-emerald-500/20'
  },
  "Divers": {
    icon: MiscIcon,
    color: 'bg-cyan-500',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-500/10',
    borderColor: 'border-cyan-100 dark:border-cyan-500/20'
  }
};

export function resolveCategoryVisual(categoryName: string, customIcons: CustomCategoryIcon[] = []): CategoryVisual {
  if (!categoryName) return PRESET_CATEGORY_VISUALS["Divers"];

  // 1. Check custom icons first (matching associated category name or custom icon name)
  const matchedCustom = customIcons.find(ci => 
    ci.category?.trim().toLowerCase() === categoryName.trim().toLowerCase() ||
    ci.name.toLowerCase() === categoryName.toLowerCase() ||
    ci.name.toLowerCase().replace(/icon$/, '') === categoryName.toLowerCase()
  );

  if (matchedCustom) {
    const PRESET_LOOKUP: Record<string, { icon: React.FC<{ className?: string }>; defaultColor: string }> = {
      mandatory: { icon: MandatoryIcon, defaultColor: 'bg-slate-500' },
      groceries: { icon: GroceriesIcon, defaultColor: 'bg-emerald-500' },
      fuel: { icon: FuelIcon, defaultColor: 'bg-orange-500' },
      restaurant: { icon: RestaurantIcon, defaultColor: 'bg-purple-500' },
      heating: { icon: HeatingIcon, defaultColor: 'bg-red-500' },
      carrepairs: { icon: CarRepairsIcon, defaultColor: 'bg-amber-500' },
      vacation: { icon: PalmTreeIcon, defaultColor: 'bg-teal-500' },
      clothing: { icon: ClothingIcon, defaultColor: 'bg-indigo-500' },
      gift: { icon: GiftIcon, defaultColor: 'bg-fuchsia-500' },
      pill: { icon: PillIcon, defaultColor: 'bg-emerald-500' },
      birthday: { icon: BirthdayIcon, defaultColor: 'bg-amber-500' },
      shield: { icon: ShieldIcon, defaultColor: 'bg-emerald-500' },
      wifi: { icon: WifiIcon, defaultColor: 'bg-indigo-500' },
      phone: { icon: DevicePhoneMobileIcon, defaultColor: 'bg-sky-500' },
      music: { icon: MusicNoteIcon, defaultColor: 'bg-purple-500' },
      water: { icon: CeoIcon, defaultColor: 'bg-sky-500' },
      energy: { icon: TotalEnergiesIcon, defaultColor: 'bg-amber-400' },
      trash: { icon: TrashBinIcon, defaultColor: 'bg-rose-500' },
      streaming: { icon: NetflixIcon, defaultColor: 'bg-black' },
      misc: { icon: MiscIcon, defaultColor: 'bg-cyan-500' },
    };

    const presetIconDef = PRESET_LOOKUP[matchedCustom.name.toLowerCase()] ||
      PRESET_LOOKUP[matchedCustom.name.toLowerCase().replace(/icon$/, '')];

    if (presetIconDef) {
      const color = matchedCustom.color || presetIconDef.defaultColor;
      return {
        icon: presetIconDef.icon,
        color,
        textColor: 'text-slate-700 dark:text-slate-200',
        badgeBg: 'bg-slate-100 dark:bg-slate-700',
        borderColor: 'border-slate-200 dark:border-slate-600'
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
        color: matchedCustom.color || 'bg-fuchsia-500',
        textColor: 'text-fuchsia-600 dark:text-fuchsia-400',
        badgeBg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10',
        borderColor: 'border-fuchsia-200 dark:border-fuchsia-500/20',
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
        color: matchedCustom.color || 'bg-fuchsia-500',
        textColor: 'text-fuchsia-600 dark:text-fuchsia-400',
        badgeBg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10',
        borderColor: 'border-fuchsia-200 dark:border-fuchsia-500/20',
        isCustomImage: true,
        imageUrl: matchedCustom.imageUrl
      };
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
    return PRESET_CATEGORY_VISUALS["Réparation voitures"];
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
    return { icon: DevicePhoneMobileIcon, color: 'bg-sky-500', textColor: 'text-sky-600', badgeBg: 'bg-sky-50', borderColor: 'border-sky-200' };
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

  const getVisual = React.useCallback((categoryName: string): CategoryVisual => {
    return resolveCategoryVisual(categoryName, customIcons);
  }, [customIcons]);

  return {
    getVisual,
    customIcons
  };
}
