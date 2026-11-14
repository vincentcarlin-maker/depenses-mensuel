import React, { createContext, useContext, useMemo } from 'react';
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
  AssuranceBadgeIcon,
  ShieldOutlineIcon,
  WifiIcon,
  WifiOutlineIcon,
  DeezerIcon,
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
  DumbbellOutlineIcon,
  PhoneOutlineIcon,
  CinemaIcon,
  CoffeeIcon,
  DoctorIcon,
  BabyIcon,
  BakeryIcon,
  GamingIcon,
  BarDrinksIcon,
  BeautySalonIcon,
  TvSubscriptionIcon,
  BooksIcon,
  BankFinanceIcon,
  TaxFinanceIcon,
  TrainTransitIcon,
  BicycleIcon,
  HotelIcon,
  DiyToolsIcon,
  GardenPlantIcon,
  LaundryIcon,
  ElectricityIcon,
  WaterDropIcon,
  GasCylinderIcon,
  ConcertFestivalIcon,
  FastFoodIcon,
  DentistIcon,
  GlassesIcon,
  CarWashIcon,
  ParkingTollIcon,
  SavingsPiggyIcon,
  SchoolSuppliesIcon,
  DonationCharityIcon,
  MeatFishIcon,
  IceCreamIcon,
  GroceryFruitIcon,
  PizzaSliceIcon,
  DrinkJuiceIcon,
  WineBottleIcon,
  FurnitureIcon,
  AirConditioningIcon,
  HouseKeyIcon,
  SecurityAlarmIcon,
  CleaningSprayIcon,
  MotorcycleIcon,
  ScooterElectricIcon,
  TaxiCabIcon,
  EvStationIcon,
  BoatFerryIcon,
  VehicleInspectionIcon,
  StethoscopeIcon,
  FirstAidIcon,
  SpaMassageIcon,
  ToyIcon,
  StrollerIcon,
  DogIcon,
  CatIcon,
  GuitarMusicIcon,
  PaintPaletteIcon,
  CameraPhotoIcon,
  SwimmingPoolIcon,
  TentCampingIcon,
  FishingIcon,
  SkiMountainIcon,
  SoccerBallIcon,
  RunningShoeIcon,
  ComputerLaptopIcon,
  HeadphonesAudioIcon,
  CloudServerIcon,
  SmartwatchIcon,
  SalaryPayrollIcon,
  InvoiceBillIcon,
  StockInvestmentIcon,
  CryptoCurrencyIcon,
  LegalLawyerIcon,
  FineTicketIcon,
  RetirementIcon,
  LeclercIcon,
  CarrefourIcon,
  IntermarcheIcon,
  LidlIcon,
  AuchanIcon,
  AldiIcon,
  SuperUIcon,
  MonoprixIcon,
  PicardIcon,
  GrandFraisIcon,
  BiocoopIcon,
  ActionStoreIcon,
  AmazonIcon,
  BoulangerieBadgeIcon,
  BoucherieBadgeIcon,
  McDonaldsIcon,
  BurgerKingIcon,
  KfcIcon,
  SubwayIcon,
  DominosPizzaIcon,
  PizzaBadgeIcon,
  CinemaBadgeIcon,
  SushiRollIcon,
  KebabWrapIcon,
  CreperieBadgeIcon,
  StarbucksIcon,
  CoffeeShopIcon,
  BarPubIcon,
  BrasserieIcon,
  MacifIcon,
  DirectAssuranceIcon,
  AxaIcon,
  MaifIcon,
  MatmutIcon,
  AllianzIcon,
  GroupamaIcon,
  MaafIcon,
  GmfIcon,
  OrangeIcon,
  SoshIcon,
  FreeIcon,
  BouyguesIcon
} from '../components/icons/CategoryIcons';
import { CustomCategoryIcon, useCustomCategoryIcons } from './useCustomCategoryIcons';
import { getColorDef } from '../components/CategoryEditModal';
import { useKeywordRules, KeywordRule } from './useKeywordRules';
import { useSyncedSettings } from './useSyncedSettings';

export type AssuranceIconChoice =
  | 'classic'
  | 'logo'
  | 'macif'
  | 'directassurance'
  | 'axa'
  | 'maif'
  | 'matmut'
  | 'allianz'
  | 'groupama'
  | 'maaf'
  | 'gmf';

export type InternetIconChoice =
  | 'classic'
  | 'logo'
  | 'orange'
  | 'sosh'
  | 'free'
  | 'bouygues'
  | 'sfr';

export type SpecialIconStyle = AssuranceIconChoice | InternetIconChoice;

export const VALID_ASSURANCE_CHOICES = new Set<AssuranceIconChoice>([
  'classic',
  'logo',
  'macif',
  'directassurance',
  'axa',
  'maif',
  'matmut',
  'allianz',
  'groupama',
  'maaf',
  'gmf',
]);

export const VALID_INTERNET_CHOICES = new Set<InternetIconChoice>([
  'classic',
  'logo',
  'orange',
  'sosh',
  'free',
  'bouygues',
  'sfr',
]);

export interface SpecialIconPreferences {
  assurance: AssuranceIconChoice;
  internet: InternetIconChoice;
}

export const DEFAULT_ICON_PREFERENCES: SpecialIconPreferences = {
  assurance: 'logo',
  internet: 'logo',
};

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
  customStyle?: React.CSSProperties;
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
  DeezerIcon,
  SfrIcon,
  ShieldIcon,
  AssuranceBadgeIcon,
  CeoIcon,
  TotalEnergiesIcon,
  NetflixIcon,
  WifiIcon,
  LeclercIcon,
  CarrefourIcon,
  IntermarcheIcon,
  LidlIcon,
  AuchanIcon,
  AldiIcon,
  SuperUIcon,
  MonoprixIcon,
  PicardIcon,
  GrandFraisIcon,
  BiocoopIcon,
  ActionStoreIcon,
  AmazonIcon,
  BoulangerieBadgeIcon,
  BoucherieBadgeIcon,
  McDonaldsIcon,
  BurgerKingIcon,
  KfcIcon,
  SubwayIcon,
  DominosPizzaIcon,
  PizzaBadgeIcon,
  CinemaBadgeIcon,
  SushiRollIcon,
  KebabWrapIcon,
  CreperieBadgeIcon,
  StarbucksIcon,
  CoffeeShopIcon,
  BarPubIcon,
  BrasserieIcon,
  MacifIcon,
  DirectAssuranceIcon,
  AxaIcon,
  MaifIcon,
  MatmutIcon,
  AllianzIcon,
  GroupamaIcon,
  MaafIcon,
  GmfIcon,
  OrangeIcon,
  SoshIcon,
  FreeIcon,
  BouyguesIcon
]);

export const PRESET_LOOKUP: Record<string, { icon: React.FC<{ className?: string }>; defaultColor: string }> = {
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
  assurancebadge: { icon: AssuranceBadgeIcon, defaultColor: 'bg-[#10b981]' },
  assurancebadgeicon: { icon: AssuranceBadgeIcon, defaultColor: 'bg-[#10b981]' },
  shieldoutline: { icon: ShieldOutlineIcon, defaultColor: 'bg-[#10b981]' },
  shieldoutlineicon: { icon: ShieldOutlineIcon, defaultColor: 'bg-[#10b981]' },
  wifi: { icon: WifiIcon, defaultColor: 'bg-[#6366f1]' },
  wifiicon: { icon: WifiIcon, defaultColor: 'bg-[#6366f1]' },
  wifioutline: { icon: WifiOutlineIcon, defaultColor: 'bg-[#6366f1]' },
  wifioutlineicon: { icon: WifiOutlineIcon, defaultColor: 'bg-[#6366f1]' },
  music: { icon: MusicNoteIcon, defaultColor: 'bg-[#a855f7]' },
  musicnoteicon: { icon: MusicNoteIcon, defaultColor: 'bg-[#a855f7]' },
  deezer: { icon: DeezerIcon, defaultColor: 'bg-[#a238ff]' },
  deezericon: { icon: DeezerIcon, defaultColor: 'bg-[#a238ff]' },
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
  cinema: { icon: CinemaIcon, defaultColor: 'bg-[#a855f7]' },
  cinemaicon: { icon: CinemaIcon, defaultColor: 'bg-[#a855f7]' },
  coffee: { icon: CoffeeIcon, defaultColor: 'bg-[#f59e0b]' },
  coffeeicon: { icon: CoffeeIcon, defaultColor: 'bg-[#f59e0b]' },
  doctor: { icon: DoctorIcon, defaultColor: 'bg-[#ef4444]' },
  doctoricon: { icon: DoctorIcon, defaultColor: 'bg-[#ef4444]' },
  baby: { icon: BabyIcon, defaultColor: 'bg-[#ec4899]' },
  babyicon: { icon: BabyIcon, defaultColor: 'bg-[#ec4899]' },
  bakery: { icon: BakeryIcon, defaultColor: 'bg-[#f59e0b]' },
  bakeryicon: { icon: BakeryIcon, defaultColor: 'bg-[#f59e0b]' },
  gaming: { icon: GamingIcon, defaultColor: 'bg-[#6366f1]' },
  gamingicon: { icon: GamingIcon, defaultColor: 'bg-[#6366f1]' },
  bardrinks: { icon: BarDrinksIcon, defaultColor: 'bg-[#ec4899]' },
  bardrinksicon: { icon: BarDrinksIcon, defaultColor: 'bg-[#ec4899]' },
  beautysalon: { icon: BeautySalonIcon, defaultColor: 'bg-[#ec4899]' },
  beautysalonicon: { icon: BeautySalonIcon, defaultColor: 'bg-[#ec4899]' },
  tvsubscription: { icon: TvSubscriptionIcon, defaultColor: 'bg-[#64748b]' },
  tvsubscriptionicon: { icon: TvSubscriptionIcon, defaultColor: 'bg-[#64748b]' },
  books: { icon: BooksIcon, defaultColor: 'bg-[#3b82f6]' },
  booksicon: { icon: BooksIcon, defaultColor: 'bg-[#3b82f6]' },
  bankfinance: { icon: BankFinanceIcon, defaultColor: 'bg-[#10b981]' },
  bankfinanceicon: { icon: BankFinanceIcon, defaultColor: 'bg-[#10b981]' },
  taxfinance: { icon: TaxFinanceIcon, defaultColor: 'bg-[#64748b]' },
  taxfinanceicon: { icon: TaxFinanceIcon, defaultColor: 'bg-[#64748b]' },
  traintransit: { icon: TrainTransitIcon, defaultColor: 'bg-[#0ea5e9]' },
  traintransiticon: { icon: TrainTransitIcon, defaultColor: 'bg-[#0ea5e9]' },
  bicycle: { icon: BicycleIcon, defaultColor: 'bg-[#14b8a6]' },
  bicycleicon: { icon: BicycleIcon, defaultColor: 'bg-[#14b8a6]' },
  hotel: { icon: HotelIcon, defaultColor: 'bg-[#6366f1]' },
  hotelicon: { icon: HotelIcon, defaultColor: 'bg-[#6366f1]' },
  diytools: { icon: DiyToolsIcon, defaultColor: 'bg-[#f59e0b]' },
  diytoolsicon: { icon: DiyToolsIcon, defaultColor: 'bg-[#f59e0b]' },
  gardenplant: { icon: GardenPlantIcon, defaultColor: 'bg-[#10b981]' },
  gardenplanticon: { icon: GardenPlantIcon, defaultColor: 'bg-[#10b981]' },
  laundry: { icon: LaundryIcon, defaultColor: 'bg-[#0ea5e9]' },
  laundryicon: { icon: LaundryIcon, defaultColor: 'bg-[#0ea5e9]' },
  electricity: { icon: ElectricityIcon, defaultColor: 'bg-[#f59e0b]' },
  electricityicon: { icon: ElectricityIcon, defaultColor: 'bg-[#f59e0b]' },
  waterdrop: { icon: WaterDropIcon, defaultColor: 'bg-[#3b82f6]' },
  waterdropicon: { icon: WaterDropIcon, defaultColor: 'bg-[#3b82f6]' },
  gascylinder: { icon: GasCylinderIcon, defaultColor: 'bg-[#f97316]' },
  gascylindericon: { icon: GasCylinderIcon, defaultColor: 'bg-[#f97316]' },
  concertfestival: { icon: ConcertFestivalIcon, defaultColor: 'bg-[#a855f7]' },
  concertfestivalicon: { icon: ConcertFestivalIcon, defaultColor: 'bg-[#a855f7]' },
  fastfood: { icon: FastFoodIcon, defaultColor: 'bg-[#ef4444]' },
  fastfoodicon: { icon: FastFoodIcon, defaultColor: 'bg-[#ef4444]' },
  dentist: { icon: DentistIcon, defaultColor: 'bg-[#14b8a6]' },
  dentisticon: { icon: DentistIcon, defaultColor: 'bg-[#14b8a6]' },
  glasses: { icon: GlassesIcon, defaultColor: 'bg-[#6366f1]' },
  glassesicon: { icon: GlassesIcon, defaultColor: 'bg-[#6366f1]' },
  carwash: { icon: CarWashIcon, defaultColor: 'bg-[#0ea5e9]' },
  carwashicon: { icon: CarWashIcon, defaultColor: 'bg-[#0ea5e9]' },
  parkingtoll: { icon: ParkingTollIcon, defaultColor: 'bg-[#3b82f6]' },
  parkingtollicon: { icon: ParkingTollIcon, defaultColor: 'bg-[#3b82f6]' },
  savingspiggy: { icon: SavingsPiggyIcon, defaultColor: 'bg-[#ec4899]' },
  savingspiggyicon: { icon: SavingsPiggyIcon, defaultColor: 'bg-[#ec4899]' },
  schoolsupplies: { icon: SchoolSuppliesIcon, defaultColor: 'bg-[#f59e0b]' },
  schoolsuppliesicon: { icon: SchoolSuppliesIcon, defaultColor: 'bg-[#f59e0b]' },
  donationcharity: { icon: DonationCharityIcon, defaultColor: 'bg-[#ec4899]' },
  donationcharityicon: { icon: DonationCharityIcon, defaultColor: 'bg-[#ec4899]' },

  // New High-Quality Icons
  pizza: { icon: PizzaSliceIcon, defaultColor: 'bg-[#ef4444]' },
  pizzasliceicon: { icon: PizzaSliceIcon, defaultColor: 'bg-[#ef4444]' },
  meatfish: { icon: MeatFishIcon, defaultColor: 'bg-[#ef4444]' },
  meatfishicon: { icon: MeatFishIcon, defaultColor: 'bg-[#ef4444]' },
  groceryfruit: { icon: GroceryFruitIcon, defaultColor: 'bg-[#10b981]' },
  groceryfruiticon: { icon: GroceryFruitIcon, defaultColor: 'bg-[#10b981]' },
  icecream: { icon: IceCreamIcon, defaultColor: 'bg-[#ec4899]' },
  icecreamicon: { icon: IceCreamIcon, defaultColor: 'bg-[#ec4899]' },
  drinkjuice: { icon: DrinkJuiceIcon, defaultColor: 'bg-[#f97316]' },
  drinkjuiceicon: { icon: DrinkJuiceIcon, defaultColor: 'bg-[#f97316]' },
  winebottle: { icon: WineBottleIcon, defaultColor: 'bg-[#b91c1c]' },
  winebottleicon: { icon: WineBottleIcon, defaultColor: 'bg-[#b91c1c]' },
  furniture: { icon: FurnitureIcon, defaultColor: 'bg-[#f59e0b]' },
  furnitureicon: { icon: FurnitureIcon, defaultColor: 'bg-[#f59e0b]' },
  airconditioning: { icon: AirConditioningIcon, defaultColor: 'bg-[#0ea5e9]' },
  airconditioningicon: { icon: AirConditioningIcon, defaultColor: 'bg-[#0ea5e9]' },
  housekey: { icon: HouseKeyIcon, defaultColor: 'bg-[#f59e0b]' },
  housekeyicon: { icon: HouseKeyIcon, defaultColor: 'bg-[#f59e0b]' },
  securityalarm: { icon: SecurityAlarmIcon, defaultColor: 'bg-[#ef4444]' },
  securityalarmicon: { icon: SecurityAlarmIcon, defaultColor: 'bg-[#ef4444]' },
  cleaningspray: { icon: CleaningSprayIcon, defaultColor: 'bg-[#14b8a6]' },
  cleaningsprayicon: { icon: CleaningSprayIcon, defaultColor: 'bg-[#14b8a6]' },
  motorcycle: { icon: MotorcycleIcon, defaultColor: 'bg-[#f97316]' },
  motorcycleicon: { icon: MotorcycleIcon, defaultColor: 'bg-[#f97316]' },
  scooterelectric: { icon: ScooterElectricIcon, defaultColor: 'bg-[#10b981]' },
  scooterelectricicon: { icon: ScooterElectricIcon, defaultColor: 'bg-[#10b981]' },
  taxicab: { icon: TaxiCabIcon, defaultColor: 'bg-[#eab308]' },
  taxicabicon: { icon: TaxiCabIcon, defaultColor: 'bg-[#eab308]' },
  evstation: { icon: EvStationIcon, defaultColor: 'bg-[#10b981]' },
  evstationicon: { icon: EvStationIcon, defaultColor: 'bg-[#10b981]' },
  boatferry: { icon: BoatFerryIcon, defaultColor: 'bg-[#0ea5e9]' },
  boatferryicon: { icon: BoatFerryIcon, defaultColor: 'bg-[#0ea5e9]' },
  vehicleinspection: { icon: VehicleInspectionIcon, defaultColor: 'bg-[#64748b]' },
  vehicleinspectionicon: { icon: VehicleInspectionIcon, defaultColor: 'bg-[#64748b]' },
  stethoscope: { icon: StethoscopeIcon, defaultColor: 'bg-[#3b82f6]' },
  stethoscopeicon: { icon: StethoscopeIcon, defaultColor: 'bg-[#3b82f6]' },
  firstaid: { icon: FirstAidIcon, defaultColor: 'bg-[#ef4444]' },
  firstaidicon: { icon: FirstAidIcon, defaultColor: 'bg-[#ef4444]' },
  spamassage: { icon: SpaMassageIcon, defaultColor: 'bg-[#14b8a6]' },
  spamassageicon: { icon: SpaMassageIcon, defaultColor: 'bg-[#14b8a6]' },
  toy: { icon: ToyIcon, defaultColor: 'bg-[#ec4899]' },
  toyicon: { icon: ToyIcon, defaultColor: 'bg-[#ec4899]' },
  stroller: { icon: StrollerIcon, defaultColor: 'bg-[#3b82f6]' },
  strollericon: { icon: StrollerIcon, defaultColor: 'bg-[#3b82f6]' },
  dog: { icon: DogIcon, defaultColor: 'bg-[#f59e0b]' },
  dogicon: { icon: DogIcon, defaultColor: 'bg-[#f59e0b]' },
  cat: { icon: CatIcon, defaultColor: 'bg-[#a855f7]' },
  caticon: { icon: CatIcon, defaultColor: 'bg-[#a855f7]' },
  guitar: { icon: GuitarMusicIcon, defaultColor: 'bg-[#f97316]' },
  guitarmusicicon: { icon: GuitarMusicIcon, defaultColor: 'bg-[#f97316]' },
  paintpalette: { icon: PaintPaletteIcon, defaultColor: 'bg-[#a855f7]' },
  paintpaletteicon: { icon: PaintPaletteIcon, defaultColor: 'bg-[#a855f7]' },
  cameraphoto: { icon: CameraPhotoIcon, defaultColor: 'bg-[#6366f1]' },
  cameraphotoicon: { icon: CameraPhotoIcon, defaultColor: 'bg-[#6366f1]' },
  swimmingpool: { icon: SwimmingPoolIcon, defaultColor: 'bg-[#0ea5e9]' },
  swimmingpoolicon: { icon: SwimmingPoolIcon, defaultColor: 'bg-[#0ea5e9]' },
  tentcamping: { icon: TentCampingIcon, defaultColor: 'bg-[#10b981]' },
  tentcampingicon: { icon: TentCampingIcon, defaultColor: 'bg-[#10b981]' },
  fishing: { icon: FishingIcon, defaultColor: 'bg-[#0284c7]' },
  fishingicon: { icon: FishingIcon, defaultColor: 'bg-[#0284c7]' },
  skimountain: { icon: SkiMountainIcon, defaultColor: 'bg-[#0ea5e9]' },
  skimountainicon: { icon: SkiMountainIcon, defaultColor: 'bg-[#0ea5e9]' },
  soccerball: { icon: SoccerBallIcon, defaultColor: 'bg-[#10b981]' },
  soccerballicon: { icon: SoccerBallIcon, defaultColor: 'bg-[#10b981]' },
  runningshoe: { icon: RunningShoeIcon, defaultColor: 'bg-[#f97316]' },
  runningshoeicon: { icon: RunningShoeIcon, defaultColor: 'bg-[#f97316]' },
  computerlaptop: { icon: ComputerLaptopIcon, defaultColor: 'bg-[#6366f1]' },
  computerlaptopicon: { icon: ComputerLaptopIcon, defaultColor: 'bg-[#6366f1]' },
  headphonesaudio: { icon: HeadphonesAudioIcon, defaultColor: 'bg-[#a855f7]' },
  headphonesaudioicon: { icon: HeadphonesAudioIcon, defaultColor: 'bg-[#a855f7]' },
  cloudserver: { icon: CloudServerIcon, defaultColor: 'bg-[#0ea5e9]' },
  cloudservericon: { icon: CloudServerIcon, defaultColor: 'bg-[#0ea5e9]' },
  smartwatch: { icon: SmartwatchIcon, defaultColor: 'bg-[#64748b]' },
  smartwatchicon: { icon: SmartwatchIcon, defaultColor: 'bg-[#64748b]' },
  salarypayroll: { icon: SalaryPayrollIcon, defaultColor: 'bg-[#10b981]' },
  salarypayrollicon: { icon: SalaryPayrollIcon, defaultColor: 'bg-[#10b981]' },
  invoicebill: { icon: InvoiceBillIcon, defaultColor: 'bg-[#64748b]' },
  invoicebillicon: { icon: InvoiceBillIcon, defaultColor: 'bg-[#64748b]' },
  stockinvestment: { icon: StockInvestmentIcon, defaultColor: 'bg-[#10b981]' },
  stockinvestmenticon: { icon: StockInvestmentIcon, defaultColor: 'bg-[#10b981]' },
  cryptocurrency: { icon: CryptoCurrencyIcon, defaultColor: 'bg-[#f59e0b]' },
  cryptocurrencyicon: { icon: CryptoCurrencyIcon, defaultColor: 'bg-[#f59e0b]' },
  legallawyer: { icon: LegalLawyerIcon, defaultColor: 'bg-[#6366f1]' },
  legallawyericon: { icon: LegalLawyerIcon, defaultColor: 'bg-[#6366f1]' },
  fineticket: { icon: FineTicketIcon, defaultColor: 'bg-[#ef4444]' },
  fineticketicon: { icon: FineTicketIcon, defaultColor: 'bg-[#ef4444]' },
  retirement: { icon: RetirementIcon, defaultColor: 'bg-[#f59e0b]' },
  retirementicon: { icon: RetirementIcon, defaultColor: 'bg-[#f59e0b]' },

  // Enseignes Magasins & Supermarchés
  leclerc: { icon: LeclercIcon, defaultColor: 'bg-[#005aa9]' },
  leclercicon: { icon: LeclercIcon, defaultColor: 'bg-[#005aa9]' },
  carrefour: { icon: CarrefourIcon, defaultColor: 'bg-[#003882]' },
  carrefouricon: { icon: CarrefourIcon, defaultColor: 'bg-[#003882]' },
  intermarche: { icon: IntermarcheIcon, defaultColor: 'bg-[#d9232a]' },
  intermarcheicon: { icon: IntermarcheIcon, defaultColor: 'bg-[#d9232a]' },
  lidl: { icon: LidlIcon, defaultColor: 'bg-[#0050aa]' },
  lidlicon: { icon: LidlIcon, defaultColor: 'bg-[#0050aa]' },
  auchan: { icon: AuchanIcon, defaultColor: 'bg-[#d9232a]' },
  auchanicon: { icon: AuchanIcon, defaultColor: 'bg-[#d9232a]' },
  aldi: { icon: AldiIcon, defaultColor: 'bg-[#00205b]' },
  aldiicon: { icon: AldiIcon, defaultColor: 'bg-[#00205b]' },
  superu: { icon: SuperUIcon, defaultColor: 'bg-[#0055a5]' },
  superuicon: { icon: SuperUIcon, defaultColor: 'bg-[#0055a5]' },
  monoprix: { icon: MonoprixIcon, defaultColor: 'bg-[#e3001b]' },
  monoprixicon: { icon: MonoprixIcon, defaultColor: 'bg-[#e3001b]' },
  picard: { icon: PicardIcon, defaultColor: 'bg-[#009fe3]' },
  picardicon: { icon: PicardIcon, defaultColor: 'bg-[#009fe3]' },
  grandfrais: { icon: GrandFraisIcon, defaultColor: 'bg-[#15803d]' },
  grandfraisicon: { icon: GrandFraisIcon, defaultColor: 'bg-[#15803d]' },
  biocoop: { icon: BiocoopIcon, defaultColor: 'bg-[#166534]' },
  biocoopicon: { icon: BiocoopIcon, defaultColor: 'bg-[#166534]' },
  actionstore: { icon: ActionStoreIcon, defaultColor: 'bg-[#00186b]' },
  actionstoreicon: { icon: ActionStoreIcon, defaultColor: 'bg-[#00186b]' },
  amazon: { icon: AmazonIcon, defaultColor: 'bg-[#f59e0b]' },
  amazonicon: { icon: AmazonIcon, defaultColor: 'bg-[#f59e0b]' },
  boulangeriebadge: { icon: BoulangerieBadgeIcon, defaultColor: 'bg-[#d97706]' },
  boulangeriebadgeicon: { icon: BoulangerieBadgeIcon, defaultColor: 'bg-[#d97706]' },
  boucheriebadge: { icon: BoucherieBadgeIcon, defaultColor: 'bg-[#991b1b]' },
  boucheriebadgeicon: { icon: BoucherieBadgeIcon, defaultColor: 'bg-[#991b1b]' },

  // Enseignes Restaurants & Restauration
  mcdonalds: { icon: McDonaldsIcon, defaultColor: 'bg-[#264f36]' },
  mcdonaldsicon: { icon: McDonaldsIcon, defaultColor: 'bg-[#264f36]' },
  mcdo: { icon: McDonaldsIcon, defaultColor: 'bg-[#264f36]' },
  burgerking: { icon: BurgerKingIcon, defaultColor: 'bg-[#d62300]' },
  burgerkingicon: { icon: BurgerKingIcon, defaultColor: 'bg-[#d62300]' },
  bk: { icon: BurgerKingIcon, defaultColor: 'bg-[#d62300]' },
  kfc: { icon: KfcIcon, defaultColor: 'bg-[#a3080c]' },
  kfcicon: { icon: KfcIcon, defaultColor: 'bg-[#a3080c]' },
  subway: { icon: SubwayIcon, defaultColor: 'bg-[#008938]' },
  subwayicon: { icon: SubwayIcon, defaultColor: 'bg-[#008938]' },
  dominos: { icon: DominosPizzaIcon, defaultColor: 'bg-[#006491]' },
  dominospizzaicon: { icon: DominosPizzaIcon, defaultColor: 'bg-[#006491]' },
  pizzabadge: { icon: PizzaBadgeIcon, defaultColor: 'bg-[#ea580c]' },
  pizzabadgeicon: { icon: PizzaBadgeIcon, defaultColor: 'bg-[#ea580c]' },
  cinemabadge: { icon: CinemaBadgeIcon, defaultColor: 'bg-[#dc2626]' },
  cinemabadgeicon: { icon: CinemaBadgeIcon, defaultColor: 'bg-[#dc2626]' },
  sushiroll: { icon: SushiRollIcon, defaultColor: 'bg-[#0f172a]' },
  sushirollicon: { icon: SushiRollIcon, defaultColor: 'bg-[#0f172a]' },
  kebabwrap: { icon: KebabWrapIcon, defaultColor: 'bg-[#c2410c]' },
  kebabwrapicon: { icon: KebabWrapIcon, defaultColor: 'bg-[#c2410c]' },
  creperiebadge: { icon: CreperieBadgeIcon, defaultColor: 'bg-[#ca8a04]' },
  creperiebadgeicon: { icon: CreperieBadgeIcon, defaultColor: 'bg-[#ca8a04]' },
  starbucks: { icon: StarbucksIcon, defaultColor: 'bg-[#006241]' },
  starbucksicon: { icon: StarbucksIcon, defaultColor: 'bg-[#006241]' },
  coffeeshop: { icon: CoffeeShopIcon, defaultColor: 'bg-[#78350f]' },
  coffeeshopicon: { icon: CoffeeShopIcon, defaultColor: 'bg-[#78350f]' },
  barpub: { icon: BarPubIcon, defaultColor: 'bg-[#b45309]' },
  barpubicon: { icon: BarPubIcon, defaultColor: 'bg-[#b45309]' },
  brasserie: { icon: BrasserieIcon, defaultColor: 'bg-[#6b21a8]' },
  brasserieicon: { icon: BrasserieIcon, defaultColor: 'bg-[#6b21a8]' },

  // Assurances
  macif: { icon: MacifIcon, defaultColor: 'bg-[#003a70]' },
  macificon: { icon: MacifIcon, defaultColor: 'bg-[#003a70]' },
  directassurance: { icon: DirectAssuranceIcon, defaultColor: 'bg-[#e30613]' },
  directassuranceicon: { icon: DirectAssuranceIcon, defaultColor: 'bg-[#e30613]' },
  axa: { icon: AxaIcon, defaultColor: 'bg-[#00008f]' },
  axaicon: { icon: AxaIcon, defaultColor: 'bg-[#00008f]' },
  maif: { icon: MaifIcon, defaultColor: 'bg-[#e30613]' },
  maificon: { icon: MaifIcon, defaultColor: 'bg-[#e30613]' },
  matmut: { icon: MatmutIcon, defaultColor: 'bg-[#0066b3]' },
  matmuticon: { icon: MatmutIcon, defaultColor: 'bg-[#0066b3]' },
  allianz: { icon: AllianzIcon, defaultColor: 'bg-[#003781]' },
  allianzicon: { icon: AllianzIcon, defaultColor: 'bg-[#003781]' },
  groupama: { icon: GroupamaIcon, defaultColor: 'bg-[#16a34a]' },
  groupamaicon: { icon: GroupamaIcon, defaultColor: 'bg-[#16a34a]' },
  maaf: { icon: MaafIcon, defaultColor: 'bg-[#009688]' },
  maaficon: { icon: MaafIcon, defaultColor: 'bg-[#009688]' },
  gmf: { icon: GmfIcon, defaultColor: 'bg-[#0055a5]' },
  gmficon: { icon: GmfIcon, defaultColor: 'bg-[#0055a5]' },

  // Opérateurs Internet & Télécoms
  orange: { icon: OrangeIcon, defaultColor: 'bg-[#ff7900]' },
  orangeicon: { icon: OrangeIcon, defaultColor: 'bg-[#ff7900]' },
  sosh: { icon: SoshIcon, defaultColor: 'bg-[#00b4e5]' },
  soshicon: { icon: SoshIcon, defaultColor: 'bg-[#00b4e5]' },
  free: { icon: FreeIcon, defaultColor: 'bg-[#cc0000]' },
  freeicon: { icon: FreeIcon, defaultColor: 'bg-[#cc0000]' },
  bouygues: { icon: BouyguesIcon, defaultColor: 'bg-[#009fe3]' },
  bouyguesicon: { icon: BouyguesIcon, defaultColor: 'bg-[#009fe3]' },
};

export function resolveAssuranceChoiceVisual(choice: AssuranceIconChoice): CategoryVisual {
  switch (choice) {
    case 'classic':
      return { icon: ShieldOutlineIcon, color: 'bg-[#10b981]', textColor: 'text-[#059669] dark:text-emerald-400', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60', borderColor: 'border-emerald-200 dark:border-emerald-800/40' };
    case 'macif':
      return { icon: MacifIcon, color: 'bg-[#003a70]', textColor: 'text-[#003a70] dark:text-sky-400', badgeBg: 'bg-sky-50 dark:bg-sky-950/60', borderColor: 'border-sky-200 dark:border-sky-800/40' };
    case 'directassurance':
      return { icon: DirectAssuranceIcon, color: 'bg-[#e30613]', textColor: 'text-[#e30613] dark:text-red-400', badgeBg: 'bg-red-50 dark:bg-red-950/60', borderColor: 'border-red-200 dark:border-red-800/40' };
    case 'axa':
      return { icon: AxaIcon, color: 'bg-[#00008f]', textColor: 'text-[#00008f] dark:text-blue-400', badgeBg: 'bg-blue-50 dark:bg-blue-950/60', borderColor: 'border-blue-200 dark:border-blue-800/40' };
    case 'maif':
      return { icon: MaifIcon, color: 'bg-[#e30613]', textColor: 'text-[#e30613] dark:text-red-400', badgeBg: 'bg-red-50 dark:bg-red-950/60', borderColor: 'border-red-200 dark:border-red-800/40' };
    case 'matmut':
      return { icon: MatmutIcon, color: 'bg-[#0066b3]', textColor: 'text-[#0066b3] dark:text-sky-400', badgeBg: 'bg-sky-50 dark:bg-sky-950/60', borderColor: 'border-sky-200 dark:border-sky-800/40' };
    case 'allianz':
      return { icon: AllianzIcon, color: 'bg-[#003781]', textColor: 'text-[#003781] dark:text-blue-400', badgeBg: 'bg-blue-50 dark:bg-blue-950/60', borderColor: 'border-blue-200 dark:border-blue-800/40' };
    case 'groupama':
      return { icon: GroupamaIcon, color: 'bg-[#16a34a]', textColor: 'text-[#16a34a] dark:text-emerald-400', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60', borderColor: 'border-emerald-200 dark:border-emerald-800/40' };
    case 'maaf':
      return { icon: MaafIcon, color: 'bg-[#009688]', textColor: 'text-[#009688] dark:text-teal-400', badgeBg: 'bg-teal-50 dark:bg-teal-950/60', borderColor: 'border-teal-200 dark:border-teal-800/40' };
    case 'gmf':
      return { icon: GmfIcon, color: 'bg-[#0055a5]', textColor: 'text-[#0055a5] dark:text-blue-400', badgeBg: 'bg-blue-50 dark:bg-blue-950/60', borderColor: 'border-blue-200 dark:border-blue-800/40' };
    case 'logo':
    default:
      return { icon: AssuranceBadgeIcon, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60', borderColor: 'border-emerald-200 dark:border-emerald-800/40' };
  }
}

export function resolveInternetChoiceVisual(choice: InternetIconChoice): CategoryVisual {
  switch (choice) {
    case 'classic':
      return { icon: WifiOutlineIcon, color: 'bg-[#6366f1]', textColor: 'text-[#4f46e5] dark:text-indigo-400', badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60', borderColor: 'border-indigo-200 dark:border-indigo-800/40' };
    case 'orange':
      return { icon: OrangeIcon, color: 'bg-[#ff7900]', textColor: 'text-[#ff7900] dark:text-orange-400', badgeBg: 'bg-orange-50 dark:bg-orange-950/60', borderColor: 'border-orange-200 dark:border-orange-800/40' };
    case 'sosh':
      return { icon: SoshIcon, color: 'bg-[#00b4e5]', textColor: 'text-[#0090c5] dark:text-sky-400', badgeBg: 'bg-sky-50 dark:bg-sky-950/60', borderColor: 'border-sky-200 dark:border-sky-800/40' };
    case 'free':
      return { icon: FreeIcon, color: 'bg-[#cc0000]', textColor: 'text-[#cc0000] dark:text-red-400', badgeBg: 'bg-red-50 dark:bg-red-950/60', borderColor: 'border-red-200 dark:border-red-800/40' };
    case 'bouygues':
      return { icon: BouyguesIcon, color: 'bg-[#009fe3]', textColor: 'text-[#009fe3] dark:text-sky-400', badgeBg: 'bg-sky-50 dark:bg-sky-950/60', borderColor: 'border-sky-200 dark:border-sky-800/40' };
    case 'sfr':
      return { icon: SfrIcon, color: 'bg-red-600', textColor: 'text-red-600 dark:text-red-400', badgeBg: 'bg-red-50 dark:bg-red-500/10', borderColor: 'border-red-200 dark:border-red-800/40' };
    case 'logo':
    default:
      return { icon: WifiIcon, color: 'bg-indigo-500', textColor: 'text-indigo-600 dark:text-indigo-400', badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60', borderColor: 'border-indigo-200 dark:border-indigo-800/40' };
  }
}

export function resolveIconAndColor(iconId: string, colorClass: string, customIcons: CustomCategoryIcon[]): CategoryVisual {
  let targetIconId = iconId;
  if (iconId?.startsWith('mapping_')) {
    const mapping = customIcons.find(ci => ci.id === iconId);
    if (mapping) {
      targetIconId = mapping.name;
    }
  }
  const normIconId = targetIconId.toLowerCase().replace(/icon$/, '');
  
  // Try to find in customIcons first
  const matchedCustom = customIcons.find(ci => 
    ci.name.toLowerCase() === targetIconId.toLowerCase() ||
    ci.name.toLowerCase().replace(/icon$/, '') === normIconId ||
    (ci.id && ci.id.toLowerCase() === targetIconId.toLowerCase())
  );

  const colorDef = getColorDef(colorClass || 'bg-[#3b82f6]');

  if (matchedCustom) {
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
        svgContent: matchedCustom.svgContent,
        customStyle: colorDef.customStyle
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
        imageUrl: matchedCustom.imageUrl,
        customStyle: colorDef.customStyle
      };
    }
  }

  // Find in preset lookup
  const presetIconDef = PRESET_LOOKUP[normIconId] || PRESET_LOOKUP[iconId.toLowerCase()];
  if (presetIconDef) {
    return {
      icon: presetIconDef.icon,
      color: colorDef.bgClass,
      textColor: colorDef.textColorClass,
      badgeBg: colorDef.badgeBgClass,
      borderColor: 'border-slate-200 dark:border-slate-700',
      customStyle: colorDef.customStyle
    };
  }

  return {
    icon: MiscIcon,
    color: colorDef.bgClass,
    textColor: colorDef.textColorClass,
    badgeBg: colorDef.badgeBgClass,
    borderColor: 'border-slate-200 dark:border-slate-700',
    customStyle: colorDef.customStyle
  };
}

export function resolveCategoryVisual(
  categoryName: string, 
  customIcons: CustomCategoryIcon[] = [], 
  description?: string,
  keywordRules: KeywordRule[] = [],
  iconPreferences: SpecialIconPreferences = DEFAULT_ICON_PREFERENCES
): CategoryVisual {
  const result = resolveCategoryVisualInner(categoryName, customIcons, description, keywordRules, iconPreferences);
  result.isFullBadge = FULL_BADGE_ICONS.has(result.icon) || result.isCustomImage || result.isCustomSvg;
  if (!result.pieColor) {
    const colorDef = getColorDef(result.color);
    result.pieColor = colorDef.hex;
  }
  return result;
}

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ') // compress spaces
    .trim();
}

const INTERNET_RULE_KEYWORDS = new Set(['internet', 'wifi', 'box', 'fibre']);
const INTERNET_SELECTOR_ICON_IDS = new Set([
  'wifi',
  'wifioutline',
  'orange',
  'sosh',
  'free',
  'bouygues',
  'sfr',
]);
const ASSURANCE_RULE_KEYWORDS = new Set(['assurance', 'assurances']);
const ASSURANCE_SELECTOR_ICON_IDS = new Set([
  'assurancebadge',
  'shieldoutline',
  'shield',
  'macif',
  'directassurance',
  'axa',
  'maif',
  'matmut',
  'allianz',
  'groupama',
  'maaf',
  'gmf',
]);

function normalizeSelectorIconId(iconId?: string): string {
  return (iconId || '').toLowerCase().replace(/icon$/, '');
}

function resolveCategoryVisualInner(
  categoryName: string, 
  customIcons: CustomCategoryIcon[] = [], 
  description?: string,
  keywordRules: KeywordRule[] = [],
  iconPreferences: SpecialIconPreferences = DEFAULT_ICON_PREFERENCES
): CategoryVisual {
  if (!categoryName) return PRESET_CATEGORY_VISUALS["Divers"];

  // 1. Check custom user-configured keyword rules first!
  if (keywordRules && keywordRules.length > 0) {
    const textToSearchNorm = normalizeText(`${categoryName} ${description || ''}`);
    const matchedRule = keywordRules.find(rule => {
      if (!rule.keyword) return false;
      const normKeyword = normalizeText(rule.keyword);
      return normKeyword && textToSearchNorm.includes(normKeyword);
    });
    if (matchedRule) {
      const normKeyword = normalizeText(matchedRule.keyword);
      const normRuleIcon = normalizeSelectorIconId(matchedRule.iconId);
      if (INTERNET_RULE_KEYWORDS.has(normKeyword) && INTERNET_SELECTOR_ICON_IDS.has(normRuleIcon)) {
        return resolveInternetChoiceVisual(iconPreferences.internet);
      }
      if (ASSURANCE_RULE_KEYWORDS.has(normKeyword) && ASSURANCE_SELECTOR_ICON_IDS.has(normRuleIcon)) {
        return resolveAssuranceChoiceVisual(iconPreferences.assurance);
      }
      return resolveIconAndColor(matchedRule.iconId, matchedRule.color, customIcons);
    }
  }

  // 2. Check specific description match in customIcons (if user created an icon for this specific store/item)
  if (description) {
    const normDesc = normalizeText(description);
    const matchedSpecificCustom = customIcons.find(ci => {
      if (!ci.category) return false;
      const normCiCat = normalizeText(ci.category);
      return normCiCat && (normCiCat === normDesc || normDesc.includes(normCiCat));
    });
    if (matchedSpecificCustom) {
      const targetIconId = matchedSpecificCustom.id?.startsWith('mapping_') ? matchedSpecificCustom.name : (matchedSpecificCustom.id || matchedSpecificCustom.name);
      const normCat = normalizeText(matchedSpecificCustom.category);
      const normTarget = normalizeSelectorIconId(targetIconId);
      if (INTERNET_RULE_KEYWORDS.has(normCat) && INTERNET_SELECTOR_ICON_IDS.has(normTarget)) {
        return resolveInternetChoiceVisual(iconPreferences.internet);
      }
      if (ASSURANCE_RULE_KEYWORDS.has(normCat) && ASSURANCE_SELECTOR_ICON_IDS.has(normTarget)) {
        return resolveAssuranceChoiceVisual(iconPreferences.assurance);
      }
      return resolveIconAndColor(targetIconId, matchedSpecificCustom.color || 'bg-[#3b82f6]', customIcons);
    }
  }

  // 3. Check built-in description brand, store, and restaurant matching
  const textNorm = normalizeText(description || (PRESET_CATEGORY_VISUALS[categoryName] ? '' : categoryName));
  if (textNorm) {
    // --- Subscriptions & Utilities ---
    // Opérateurs Internet & Télécoms (prioritaires sur l'icône internet générique)
    if (textNorm.includes('sfr') || textNorm.includes('red by sfr')) {
      return resolveInternetChoiceVisual('sfr');
    }
    if (textNorm.includes('sosh')) {
      return resolveInternetChoiceVisual('sosh');
    }
    if (
      textNorm.includes('livebox') ||
      (/\borange\b/.test(textNorm) &&
        !textNorm.includes('jus') &&
        !textNorm.includes('fruit') &&
        !textNorm.includes('fleur') &&
        !textNorm.includes('orangeade'))
    ) {
      return resolveInternetChoiceVisual('orange');
    }
    if (textNorm.includes('freebox') || textNorm.includes('free mobile') || /\bfree\b/.test(textNorm)) {
      return resolveInternetChoiceVisual('free');
    }
    if (textNorm.includes('bouygues') || textNorm.includes('bbox')) {
      return resolveInternetChoiceVisual('bouygues');
    }

    // Assurances par marque (prioritaires sur l'icône assurance générique)
    if (textNorm.includes('macif')) {
      return resolveAssuranceChoiceVisual('macif');
    }
    if (textNorm.includes('direct assurance') || textNorm.includes('directassurance')) {
      return resolveAssuranceChoiceVisual('directassurance');
    }
    if (/\baxa\b/.test(textNorm)) {
      return resolveAssuranceChoiceVisual('axa');
    }
    if (/\bmaif\b/.test(textNorm)) {
      return resolveAssuranceChoiceVisual('maif');
    }
    if (textNorm.includes('matmut')) {
      return resolveAssuranceChoiceVisual('matmut');
    }
    if (textNorm.includes('allianz')) {
      return resolveAssuranceChoiceVisual('allianz');
    }
    if (textNorm.includes('groupama')) {
      return resolveAssuranceChoiceVisual('groupama');
    }
    if (/\bmaaf\b/.test(textNorm)) {
      return resolveAssuranceChoiceVisual('maaf');
    }
    if (/\bgmf\b/.test(textNorm)) {
      return resolveAssuranceChoiceVisual('gmf');
    }

    if (textNorm.includes('netflix')) {
      return { icon: NetflixIcon, color: 'bg-black', textColor: 'text-slate-800', badgeBg: 'bg-slate-100', borderColor: 'border-slate-200' };
    }
    if (textNorm.includes('total energie') || textNorm.includes('totalenergie') || textNorm === 'total' || textNorm.startsWith('total ')) {
      return { icon: TotalEnergiesIcon, color: 'bg-red-600', textColor: 'text-red-600', badgeBg: 'bg-red-50 dark:bg-red-950/40', borderColor: 'border-red-200 dark:border-red-800/40' };
    }
    if (textNorm.includes('deezer')) {
      return { icon: DeezerIcon, color: 'bg-[#a238ff]', textColor: 'text-[#a238ff] dark:text-purple-400', badgeBg: 'bg-purple-50 dark:bg-purple-950/40', borderColor: 'border-purple-200 dark:border-purple-800/40' };
    }
    if (textNorm.includes('spotify') || textNorm.includes('musique')) {
      return { icon: MusicNoteIcon, color: 'bg-purple-500', textColor: 'text-purple-600', badgeBg: 'bg-purple-50', borderColor: 'border-purple-200' };
    }
    if (textNorm.includes('poubelle') || textNorm.includes('dechet')) {
      return { icon: TrashBinIcon, color: 'bg-rose-500', textColor: 'text-rose-600', badgeBg: 'bg-rose-50', borderColor: 'border-rose-200' };
    }
    if (textNorm.includes('wifi') || textNorm.includes('internet') || textNorm.includes('fibre') || textNorm.includes('box')) {
      return resolveInternetChoiceVisual(iconPreferences.internet);
    }
    if (textNorm.includes('telephone') || textNorm.includes('mobile')) {
      return { icon: PhoneOutlineIcon, color: 'bg-[#0ea5e9]', textColor: 'text-[#0284c7]', badgeBg: 'bg-[#e0f2fe]', borderColor: 'border-sky-200' };
    }
    if (textNorm.includes('eau') || textNorm.includes('ceo')) {
      return { icon: CeoIcon, color: 'bg-sky-500', textColor: 'text-sky-600', badgeBg: 'bg-sky-50', borderColor: 'border-sky-200' };
    }
    if (textNorm.includes('assurance')) {
      return resolveAssuranceChoiceVisual(iconPreferences.assurance);
    }
    if (textNorm.includes('mutuelle')) {
      return { icon: ShieldIcon, color: 'bg-emerald-500', textColor: 'text-emerald-600', badgeBg: 'bg-emerald-50', borderColor: 'border-emerald-200' };
    }

    // --- Supermarchés & Magasins alimentaires / commerces ---
    if (textNorm.includes('leclerc')) {
      return { icon: LeclercIcon, color: 'bg-[#005aa9]', textColor: 'text-[#005aa9] dark:text-blue-400', badgeBg: 'bg-blue-50 dark:bg-blue-950/40', borderColor: 'border-blue-200 dark:border-blue-800/40' };
    }
    if (textNorm.includes('carrefour')) {
      return { icon: CarrefourIcon, color: 'bg-[#003882]', textColor: 'text-[#003882] dark:text-blue-400', badgeBg: 'bg-blue-50 dark:bg-blue-950/40', borderColor: 'border-blue-200 dark:border-blue-800/40' };
    }
    if (textNorm.includes('intermarche')) {
      return { icon: IntermarcheIcon, color: 'bg-[#d9232a]', textColor: 'text-[#d9232a] dark:text-red-400', badgeBg: 'bg-red-50 dark:bg-red-950/40', borderColor: 'border-red-200 dark:border-red-800/40' };
    }
    if (textNorm.includes('lidl')) {
      return { icon: LidlIcon, color: 'bg-[#0050aa]', textColor: 'text-[#0050aa] dark:text-blue-400', badgeBg: 'bg-blue-50 dark:bg-blue-950/40', borderColor: 'border-blue-200 dark:border-blue-800/40' };
    }
    if (textNorm.includes('auchan')) {
      return { icon: AuchanIcon, color: 'bg-[#d9232a]', textColor: 'text-[#d9232a] dark:text-red-400', badgeBg: 'bg-red-50 dark:bg-red-950/40', borderColor: 'border-red-200 dark:border-red-800/40' };
    }
    if (textNorm.includes('aldi')) {
      return { icon: AldiIcon, color: 'bg-[#00205b]', textColor: 'text-[#00205b] dark:text-blue-400', badgeBg: 'bg-blue-50 dark:bg-blue-950/40', borderColor: 'border-blue-200 dark:border-blue-800/40' };
    }
    if (/\b(super u|hyper u|u express|systeme u)\b/.test(textNorm) || textNorm === 'u' || textNorm.startsWith('u ')) {
      return { icon: SuperUIcon, color: 'bg-[#0055a5]', textColor: 'text-[#0055a5] dark:text-blue-400', badgeBg: 'bg-blue-50 dark:bg-blue-950/40', borderColor: 'border-blue-200 dark:border-blue-800/40' };
    }
    if (textNorm.includes('monoprix')) {
      return { icon: MonoprixIcon, color: 'bg-[#e3001b]', textColor: 'text-[#e3001b] dark:text-red-400', badgeBg: 'bg-red-50 dark:bg-red-950/40', borderColor: 'border-red-200 dark:border-red-800/40' };
    }
    if (textNorm.includes('grand frais')) {
      return { icon: GrandFraisIcon, color: 'bg-[#15803d]', textColor: 'text-[#15803d] dark:text-emerald-400', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40', borderColor: 'border-emerald-200 dark:border-emerald-800/40' };
    }
    if (textNorm.includes('picard')) {
      return { icon: PicardIcon, color: 'bg-[#009fe3]', textColor: 'text-[#009fe3] dark:text-sky-400', badgeBg: 'bg-sky-50 dark:bg-sky-950/40', borderColor: 'border-sky-200 dark:border-sky-800/40' };
    }
    if (textNorm.includes('biocoop') || textNorm.includes('naturalia') || textNorm.includes('bio c bon') || textNorm.includes('la vie claire')) {
      return { icon: BiocoopIcon, color: 'bg-[#166534]', textColor: 'text-[#166534] dark:text-green-400', badgeBg: 'bg-green-50 dark:bg-green-950/40', borderColor: 'border-green-200 dark:border-green-800/40' };
    }
    if (/\baction\b/.test(textNorm)) {
      return { icon: ActionStoreIcon, color: 'bg-[#00186b]', textColor: 'text-[#009fe3] dark:text-sky-400', badgeBg: 'bg-sky-50 dark:bg-sky-950/40', borderColor: 'border-sky-200 dark:border-sky-800/40' };
    }
    if (textNorm.includes('amazon') || /\bamzn\b/.test(textNorm)) {
      return { icon: AmazonIcon, color: 'bg-[#f59e0b]', textColor: 'text-[#ff9900] dark:text-amber-400', badgeBg: 'bg-amber-50 dark:bg-amber-950/40', borderColor: 'border-amber-200 dark:border-amber-800/40' };
    }
    if (textNorm.includes('boulanger') || textNorm.includes('patisserie') || textNorm.includes('viennoiserie') || textNorm.includes('croissant') || textNorm.includes('baguette') || textNorm.includes('banette') || textNorm.includes('feuillette') || textNorm.includes('mie caline') || textNorm.includes('paul') || textNorm.includes('marie blachere') || textNorm.includes('brioche doree') || textNorm.includes('fournil') || /\bpain\b/.test(textNorm)) {
      return { icon: BoulangerieBadgeIcon, color: 'bg-[#d97706]', textColor: 'text-[#d97706] dark:text-amber-400', badgeBg: 'bg-amber-50 dark:bg-amber-950/40', borderColor: 'border-amber-200 dark:border-amber-800/40' };
    }
    if (textNorm.includes('boucherie') || textNorm.includes('boucher') || textNorm.includes('charcuterie') || textNorm.includes('poissonnerie')) {
      return { icon: BoucherieBadgeIcon, color: 'bg-[#991b1b]', textColor: 'text-[#991b1b] dark:text-rose-400', badgeBg: 'bg-rose-50 dark:bg-rose-950/40', borderColor: 'border-rose-200 dark:border-rose-800/40' };
    }
    if (textNorm.includes('primeur') || textNorm.includes('maraicher')) {
      return { icon: GrandFraisIcon, color: 'bg-[#16a34a]', textColor: 'text-[#16a34a] dark:text-emerald-400', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40', borderColor: 'border-emerald-200 dark:border-emerald-800/40' };
    }
    if (textNorm.includes('pharmacie') || textNorm.includes('parapharmacie')) {
      return { icon: FirstAidIcon, color: 'bg-[#10b981]', textColor: 'text-[#059669] dark:text-emerald-400', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40', borderColor: 'border-emerald-200 dark:border-emerald-800/40' };
    }

    // --- Fast-Food, Enseignes & Types de restaurants ---
    if (textNorm.includes('mcdo') || textNorm.includes('mcdonald') || textNorm.includes('macdo')) {
      return { icon: McDonaldsIcon, color: 'bg-[#264f36]', textColor: 'text-[#264f36] dark:text-emerald-400', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40', borderColor: 'border-emerald-200 dark:border-emerald-800/40' };
    }
    if (textNorm.includes('burger king') || /\bbk\b/.test(textNorm)) {
      return { icon: BurgerKingIcon, color: 'bg-[#d62300]', textColor: 'text-[#d62300] dark:text-red-400', badgeBg: 'bg-red-50 dark:bg-red-950/40', borderColor: 'border-red-200 dark:border-red-800/40' };
    }
    if (textNorm.includes('kfc') || textNorm.includes('kentucky')) {
      return { icon: KfcIcon, color: 'bg-[#a3080c]', textColor: 'text-[#a3080c] dark:text-red-400', badgeBg: 'bg-red-50 dark:bg-red-950/40', borderColor: 'border-red-200 dark:border-red-800/40' };
    }
    if (textNorm.includes('subway')) {
      return { icon: SubwayIcon, color: 'bg-[#008938]', textColor: 'text-[#008938] dark:text-green-400', badgeBg: 'bg-green-50 dark:bg-green-950/40', borderColor: 'border-green-200 dark:border-green-800/40' };
    }
    if (/\bquick\b/.test(textNorm)) {
      return { icon: FastFoodIcon, color: 'bg-[#e3001b]', textColor: 'text-[#e3001b] dark:text-red-400', badgeBg: 'bg-red-50 dark:bg-red-950/40', borderColor: 'border-red-200 dark:border-red-800/40' };
    }
    if (textNorm.includes('domino')) {
      return { icon: DominosPizzaIcon, color: 'bg-[#006491]', textColor: 'text-[#006491] dark:text-sky-400', badgeBg: 'bg-sky-50 dark:bg-sky-950/40', borderColor: 'border-sky-200 dark:border-sky-800/40' };
    }
    if (textNorm.includes('pizza') || textNorm.includes('pizzeria') || textNorm.includes('del arte')) {
      return { icon: PizzaBadgeIcon, color: 'bg-[#ea580c]', textColor: 'text-[#ea580c] dark:text-orange-400', badgeBg: 'bg-orange-50 dark:bg-orange-950/40', borderColor: 'border-orange-200 dark:border-orange-800/40' };
    }
    if (textNorm.includes('sushi') || textNorm.includes('japonais') || textNorm.includes('ramen') || textNorm.includes('matsuri') || textNorm.includes('chinois') || textNorm.includes('asian') || textNorm.includes('wok') || textNorm.includes('bo bun') || /\bnems?\b/.test(textNorm)) {
      return { icon: SushiRollIcon, color: 'bg-[#0f172a]', textColor: 'text-slate-800 dark:text-slate-200', badgeBg: 'bg-slate-100 dark:bg-slate-800', borderColor: 'border-slate-300 dark:border-slate-700' };
    }
    if (textNorm.includes('kebab') || textNorm.includes('tacos') || textNorm.includes('otacos') || textNorm.includes('shawarma') || textNorm.includes('chawarma') || textNorm.includes('doner')) {
      return { icon: KebabWrapIcon, color: 'bg-[#c2410c]', textColor: 'text-[#c2410c] dark:text-orange-400', badgeBg: 'bg-orange-50 dark:bg-orange-950/40', borderColor: 'border-orange-200 dark:border-orange-800/40' };
    }
    if (textNorm.includes('creperie') || textNorm.includes('crepe') || textNorm.includes('galette')) {
      return { icon: CreperieBadgeIcon, color: 'bg-[#ca8a04]', textColor: 'text-[#ca8a04] dark:text-amber-400', badgeBg: 'bg-amber-50 dark:bg-amber-950/40', borderColor: 'border-amber-200 dark:border-amber-800/40' };
    }
    if (textNorm.includes('starbucks')) {
      return { icon: StarbucksIcon, color: 'bg-[#006241]', textColor: 'text-[#006241] dark:text-green-400', badgeBg: 'bg-green-50 dark:bg-green-950/40', borderColor: 'border-green-200 dark:border-green-800/40' };
    }
    if (textNorm.includes('cafe') || textNorm.includes('coffee') || textNorm.includes('salon de the') || textNorm.includes('nespresso')) {
      return { icon: CoffeeShopIcon, color: 'bg-[#78350f]', textColor: 'text-[#78350f] dark:text-amber-400', badgeBg: 'bg-amber-50 dark:bg-amber-950/40', borderColor: 'border-amber-200 dark:border-amber-800/40' };
    }
    if (/\b(bar|pub|biere|tapas|apero)\b/.test(textNorm) || textNorm.includes('cave a vin')) {
      return { icon: BarPubIcon, color: 'bg-[#b45309]', textColor: 'text-[#b45309] dark:text-amber-400', badgeBg: 'bg-amber-50 dark:bg-amber-950/40', borderColor: 'border-amber-200 dark:border-amber-800/40' };
    }
    if (textNorm.includes('glacier') || textNorm.includes('glace') || textNorm.includes('amorino') || textNorm.includes('haagen')) {
      return { icon: IceCreamIcon, color: 'bg-[#ec4899]', textColor: 'text-[#ec4899] dark:text-pink-400', badgeBg: 'bg-pink-50 dark:bg-pink-950/40', borderColor: 'border-pink-200 dark:border-pink-800/40' };
    }
    if (textNorm.includes('brasserie') || textNorm.includes('bistrot') || textNorm.includes('bistro') || textNorm.includes('auberge') || textNorm.includes('bouchon') || textNorm.includes('courtepaille') || textNorm.includes('buffalo grill') || textNorm.includes('hippopotamus') || textNorm.includes('flunch') || textNorm.includes('traiteur')) {
      return { icon: BrasserieIcon, color: 'bg-[#6b21a8]', textColor: 'text-[#6b21a8] dark:text-purple-400', badgeBg: 'bg-purple-50 dark:bg-purple-950/40', borderColor: 'border-purple-200 dark:border-purple-800/40' };
    }
    if (textNorm.includes('cinema') || /\bcine\b/.test(textNorm) || textNorm.includes('ugc') || textNorm.includes('pathe') || textNorm.includes('gaumont') || /\bcgr\b/.test(textNorm) || textNorm.includes('kinepolis') || /\bmk2\b/.test(textNorm) || textNorm.includes('megarama')) {
      return { icon: CinemaBadgeIcon, color: 'bg-[#dc2626]', textColor: 'text-[#dc2626] dark:text-red-400', badgeBg: 'bg-red-50 dark:bg-red-950/40', borderColor: 'border-red-200 dark:border-red-800/40' };
    }
  }

  // 4. Check custom icons for the category (matching associated category name or custom icon name)
  const normCategoryName = normalizeCategoryName(categoryName);
  const matchedCustom = customIcons.find(ci => {
    if (!ci.category) return false;
    return normalizeCategoryName(ci.category) === normCategoryName;
  }) || customIcons.find(ci => 
    ci.name.toLowerCase() === categoryName.toLowerCase() ||
    ci.name.toLowerCase().replace(/icon$/, '') === categoryName.toLowerCase()
  );

  if (matchedCustom) {
    const targetIconId = matchedCustom.id?.startsWith('mapping_') ? matchedCustom.name : (matchedCustom.id || matchedCustom.name);
    const normCat = normalizeText(categoryName);
    const normTarget = normalizeSelectorIconId(targetIconId);
    if (INTERNET_RULE_KEYWORDS.has(normCat) && INTERNET_SELECTOR_ICON_IDS.has(normTarget)) {
      return resolveInternetChoiceVisual(iconPreferences.internet);
    }
    if (ASSURANCE_RULE_KEYWORDS.has(normCat) && ASSURANCE_SELECTOR_ICON_IDS.has(normTarget)) {
      return resolveAssuranceChoiceVisual(iconPreferences.assurance);
    }
    return resolveIconAndColor(targetIconId, matchedCustom.color || 'bg-[#3b82f6]', customIcons);
  }

  // 5. Check direct preset match
  if (PRESET_CATEGORY_VISUALS[categoryName]) {
    return PRESET_CATEGORY_VISUALS[categoryName];
  }

  // 5. Fallback name heuristics for fuzzy matches
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

  // Built-in fallback named brand/service matchings
  if (norm.includes('sfr')) {
    return resolveInternetChoiceVisual('sfr');
  }
  if (norm.includes('sosh')) {
    return resolveInternetChoiceVisual('sosh');
  }
  if (norm.includes('livebox') || /\borange\b/.test(norm)) {
    return resolveInternetChoiceVisual('orange');
  }
  if (norm.includes('freebox') || /\bfree\b/.test(norm)) {
    return resolveInternetChoiceVisual('free');
  }
  if (norm.includes('bouygues') || norm.includes('bbox')) {
    return resolveInternetChoiceVisual('bouygues');
  }
  if (norm.includes('macif')) return resolveAssuranceChoiceVisual('macif');
  if (norm.includes('direct assurance') || norm.includes('directassurance')) return resolveAssuranceChoiceVisual('directassurance');
  if (/\baxa\b/.test(norm)) return resolveAssuranceChoiceVisual('axa');
  if (/\bmaif\b/.test(norm)) return resolveAssuranceChoiceVisual('maif');
  if (norm.includes('matmut')) return resolveAssuranceChoiceVisual('matmut');
  if (norm.includes('allianz')) return resolveAssuranceChoiceVisual('allianz');
  if (norm.includes('groupama')) return resolveAssuranceChoiceVisual('groupama');
  if (/\bmaaf\b/.test(norm)) return resolveAssuranceChoiceVisual('maaf');
  if (/\bgmf\b/.test(norm)) return resolveAssuranceChoiceVisual('gmf');
  if (norm.includes('netflix')) {
    return { icon: NetflixIcon, color: 'bg-black', textColor: 'text-slate-800', badgeBg: 'bg-slate-100', borderColor: 'border-slate-200' };
  }
  if (norm.includes('total')) {
    return { icon: TotalEnergiesIcon, color: 'bg-yellow-400', textColor: 'text-yellow-600', badgeBg: 'bg-yellow-50', borderColor: 'border-yellow-200' };
  }
  if (norm.includes('deezer')) {
    return { icon: DeezerIcon, color: 'bg-[#a238ff]', textColor: 'text-[#a238ff] dark:text-purple-400', badgeBg: 'bg-purple-50 dark:bg-purple-950/40', borderColor: 'border-purple-200 dark:border-purple-800/40' };
  }
  if (norm.includes('musique') || norm.includes('spotify')) {
    return { icon: MusicNoteIcon, color: 'bg-purple-500', textColor: 'text-purple-600', badgeBg: 'bg-purple-50', borderColor: 'border-purple-200' };
  }
  if (norm.includes('poubelle') || norm.includes('dechet') || norm.includes('déchet')) {
    return { icon: TrashBinIcon, color: 'bg-rose-500', textColor: 'text-rose-600', badgeBg: 'bg-rose-50', borderColor: 'border-rose-200' };
  }
  if (norm.includes('wifi') || norm.includes('internet') || norm.includes('fibre') || norm.includes('box')) {
    return resolveInternetChoiceVisual(iconPreferences.internet);
  }
  if (norm.includes('téléphone') || norm.includes('telephone') || norm.includes('mobile')) {
    return { icon: PhoneOutlineIcon, color: 'bg-[#0ea5e9]', textColor: 'text-[#0284c7]', badgeBg: 'bg-[#e0f2fe]', borderColor: 'border-sky-200' };
  }
  if (norm.includes('eau') || norm.includes('energie') || norm.includes('énergie') || norm.includes('ceo')) {
    return { icon: CeoIcon, color: 'bg-sky-500', textColor: 'text-sky-600', badgeBg: 'bg-sky-50', borderColor: 'border-sky-200' };
  }
  if (norm.includes('assurance')) {
    return resolveAssuranceChoiceVisual(iconPreferences.assurance);
  }
  if (norm.includes('mutuelle')) {
    return { icon: ShieldIcon, color: 'bg-emerald-500', textColor: 'text-emerald-600', badgeBg: 'bg-emerald-50', borderColor: 'border-emerald-200' };
  }

  // Default Divers
  return PRESET_CATEGORY_VISUALS["Divers"];
}

interface CategoryVisualsContextType {
  getVisual: (categoryName: string, description?: string) => CategoryVisual;
  customIcons: CustomCategoryIcon[];
  rules: KeywordRule[];
  iconPreferences: SpecialIconPreferences;
  setAssuranceIconStyle: (style: AssuranceIconChoice) => void;
  setInternetIconStyle: (style: InternetIconChoice) => void;
  addRule: (keyword: string, iconId: string, color: string) => boolean;
  deleteRule: (id: string) => void;
  updateRule: (id: string, keyword: string, iconId: string, color: string) => boolean;
  addCustomIcon: (iconData: Omit<CustomCategoryIcon, 'id' | 'createdAt'>) => CustomCategoryIcon;
  deleteCustomIcon: (iconId: string) => void;
  saveCategoryIconMapping: (categoryName: string, iconId: string, color?: string, oldCategoryName?: string) => void;
}

const CategoryVisualsContext = createContext<CategoryVisualsContextType | null>(null);

function mapAssuranceChoiceToRuleIcon(choice: AssuranceIconChoice): { iconId: string; color: string } {
  if (choice === 'classic') return { iconId: 'shieldoutline', color: 'bg-[#10b981]' };
  if (choice === 'logo') return { iconId: 'assurancebadge', color: 'bg-[#10b981]' };
  return { iconId: choice, color: PRESET_LOOKUP[choice]?.defaultColor || 'bg-[#10b981]' };
}

function mapInternetChoiceToRuleIcon(choice: InternetIconChoice): { iconId: string; color: string } {
  if (choice === 'classic') return { iconId: 'wifioutline', color: 'bg-[#6366f1]' };
  if (choice === 'logo') return { iconId: 'wifi', color: 'bg-[#6366f1]' };
  return { iconId: choice, color: PRESET_LOOKUP[choice]?.defaultColor || 'bg-[#6366f1]' };
}

function mapRuleIconToInternetChoice(iconId: string): InternetIconChoice | null {
  const norm = normalizeSelectorIconId(iconId);
  if (norm === 'wifioutline') return 'classic';
  if (norm === 'wifi') return 'logo';
  if (VALID_INTERNET_CHOICES.has(norm as InternetIconChoice)) return norm as InternetIconChoice;
  return null;
}

function mapRuleIconToAssuranceChoice(iconId: string): AssuranceIconChoice | null {
  const norm = normalizeSelectorIconId(iconId);
  if (norm === 'shieldoutline') return 'classic';
  if (norm === 'assurancebadge' || norm === 'shield') return 'logo';
  if (VALID_ASSURANCE_CHOICES.has(norm as AssuranceIconChoice)) return norm as AssuranceIconChoice;
  return null;
}

export const CategoryVisualsProvider: React.FC<{ children: React.ReactNode; foyerId?: string }> = ({ children, foyerId }) => {
  const { customIcons, addCustomIcon, deleteCustomIcon, saveCategoryIconMapping } = useCustomCategoryIcons(foyerId);
  const { rules, addRule: rawAddRule, deleteRule, updateRule: rawUpdateRule } = useKeywordRules(foyerId);
  const [iconPreferences, setIconPreferences] = useSyncedSettings<SpecialIconPreferences>(
    `icon_styles_${foyerId || 'default'}`,
    DEFAULT_ICON_PREFERENCES
  );

  const safePreferences: SpecialIconPreferences = useMemo(() => ({
    assurance: VALID_ASSURANCE_CHOICES.has(iconPreferences?.assurance as AssuranceIconChoice)
      ? (iconPreferences.assurance as AssuranceIconChoice)
      : 'logo',
    internet: VALID_INTERNET_CHOICES.has(iconPreferences?.internet as InternetIconChoice)
      ? (iconPreferences.internet as InternetIconChoice)
      : 'logo',
  }), [iconPreferences]);

  const setAssuranceIconStyle = React.useCallback((style: AssuranceIconChoice) => {
    setIconPreferences(prev => ({
      assurance: style,
      internet: VALID_INTERNET_CHOICES.has(prev?.internet as InternetIconChoice)
        ? (prev.internet as InternetIconChoice)
        : 'logo',
    }));

    const matchingRule = rules.find(r =>
      ASSURANCE_RULE_KEYWORDS.has(normalizeText(r.keyword)) &&
      ASSURANCE_SELECTOR_ICON_IDS.has(normalizeSelectorIconId(r.iconId))
    );
    if (matchingRule) {
      const mapped = mapAssuranceChoiceToRuleIcon(style);
      rawUpdateRule(matchingRule.id, matchingRule.keyword, mapped.iconId, mapped.color);
    }
  }, [setIconPreferences, rules, rawUpdateRule]);

  const setInternetIconStyle = React.useCallback((style: InternetIconChoice) => {
    setIconPreferences(prev => ({
      assurance: VALID_ASSURANCE_CHOICES.has(prev?.assurance as AssuranceIconChoice)
        ? (prev.assurance as AssuranceIconChoice)
        : 'logo',
      internet: style,
    }));

    const matchingRule = rules.find(r =>
      INTERNET_RULE_KEYWORDS.has(normalizeText(r.keyword)) &&
      INTERNET_SELECTOR_ICON_IDS.has(normalizeSelectorIconId(r.iconId))
    );
    if (matchingRule) {
      const mapped = mapInternetChoiceToRuleIcon(style);
      rawUpdateRule(matchingRule.id, matchingRule.keyword, mapped.iconId, mapped.color);
    }
  }, [setIconPreferences, rules, rawUpdateRule]);

  const syncSpecialPreferenceFromRule = React.useCallback((keyword: string, iconId: string) => {
    const normKw = normalizeText(keyword);
    if (INTERNET_RULE_KEYWORDS.has(normKw)) {
      const choice = mapRuleIconToInternetChoice(iconId);
      if (choice) {
        setIconPreferences(prev => ({
          assurance: VALID_ASSURANCE_CHOICES.has(prev?.assurance as AssuranceIconChoice)
            ? (prev.assurance as AssuranceIconChoice)
            : 'logo',
          internet: choice,
        }));
      }
    } else if (ASSURANCE_RULE_KEYWORDS.has(normKw)) {
      const choice = mapRuleIconToAssuranceChoice(iconId);
      if (choice) {
        setIconPreferences(prev => ({
          assurance: choice,
          internet: VALID_INTERNET_CHOICES.has(prev?.internet as InternetIconChoice)
            ? (prev.internet as InternetIconChoice)
            : 'logo',
        }));
      }
    }
  }, [setIconPreferences]);

  const addRule = React.useCallback((keyword: string, iconId: string, color: string) => {
    const ok = rawAddRule(keyword, iconId, color);
    if (ok) syncSpecialPreferenceFromRule(keyword, iconId);
    return ok;
  }, [rawAddRule, syncSpecialPreferenceFromRule]);

  const updateRule = React.useCallback((id: string, keyword: string, iconId: string, color: string) => {
    const ok = rawUpdateRule(id, keyword, iconId, color);
    if (ok) syncSpecialPreferenceFromRule(keyword, iconId);
    return ok;
  }, [rawUpdateRule, syncSpecialPreferenceFromRule]);

  const getVisual = React.useCallback((categoryName: string, description?: string): CategoryVisual => {
    return resolveCategoryVisual(categoryName, customIcons, description, rules, safePreferences);
  }, [customIcons, rules, safePreferences]);

  const value = useMemo(() => ({
    getVisual,
    customIcons,
    rules,
    iconPreferences: safePreferences,
    setAssuranceIconStyle,
    setInternetIconStyle,
    addRule,
    deleteRule,
    updateRule,
    addCustomIcon,
    deleteCustomIcon,
    saveCategoryIconMapping
  }), [
    getVisual,
    customIcons,
    rules,
    safePreferences,
    setAssuranceIconStyle,
    setInternetIconStyle,
    addRule,
    deleteRule,
    updateRule,
    addCustomIcon,
    deleteCustomIcon,
    saveCategoryIconMapping
  ]);

  return React.createElement(CategoryVisualsContext.Provider, { value }, children);
};

export function useCategoryVisuals(): CategoryVisualsContextType {
  const context = useContext(CategoryVisualsContext);
  if (context) return context;

  // Safe static fallback without conditional hooks
  return {
    getVisual: (categoryName: string, description?: string): CategoryVisual => {
      return resolveCategoryVisual(categoryName, [], description, [], DEFAULT_ICON_PREFERENCES);
    },
    customIcons: [],
    rules: [],
    iconPreferences: DEFAULT_ICON_PREFERENCES,
    setAssuranceIconStyle: () => {},
    setInternetIconStyle: () => {},
    addRule: () => false,
    deleteRule: () => {},
    updateRule: () => false,
    addCustomIcon: () => ({ id: '', name: '', category: '', type: 'svg', createdAt: new Date().toISOString() }),
    deleteCustomIcon: () => {},
    saveCategoryIconMapping: () => {}
  };
}
