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
  BoulangerieBadgeIcon,
  BoucherieBadgeIcon,
  McDonaldsIcon,
  BurgerKingIcon,
  KfcIcon,
  SubwayIcon,
  DominosPizzaIcon,
  PizzaBadgeIcon,
  SushiRollIcon,
  KebabWrapIcon,
  CreperieBadgeIcon,
  StarbucksIcon,
  CoffeeShopIcon,
  BarPubIcon,
  BrasserieIcon
} from '../components/icons/CategoryIcons';
import { CustomCategoryIcon, useCustomCategoryIcons } from './useCustomCategoryIcons';
import { getColorDef } from '../components/CategoryEditModal';
import { useKeywordRules, KeywordRule } from './useKeywordRules';

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
  SfrIcon,
  ShieldIcon,
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
  BoulangerieBadgeIcon,
  BoucherieBadgeIcon,
  McDonaldsIcon,
  BurgerKingIcon,
  KfcIcon,
  SubwayIcon,
  DominosPizzaIcon,
  PizzaBadgeIcon,
  SushiRollIcon,
  KebabWrapIcon,
  CreperieBadgeIcon,
  StarbucksIcon,
  CoffeeShopIcon,
  BarPubIcon,
  BrasserieIcon
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
};

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
  keywordRules: KeywordRule[] = []
): CategoryVisual {
  const result = resolveCategoryVisualInner(categoryName, customIcons, description, keywordRules);
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

function resolveCategoryVisualInner(
  categoryName: string, 
  customIcons: CustomCategoryIcon[] = [], 
  description?: string,
  keywordRules: KeywordRule[] = []
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
      return resolveIconAndColor(targetIconId, matchedSpecificCustom.color || 'bg-[#3b82f6]', customIcons);
    }
  }

  // 3. Check built-in description brand, store, and restaurant matching
  const textNorm = normalizeText(description || (PRESET_CATEGORY_VISUALS[categoryName] ? '' : categoryName));
  if (textNorm) {
    // --- Subscriptions & Utilities ---
    if (textNorm.includes('sfr')) {
      return { icon: SfrIcon, color: 'bg-red-600', textColor: 'text-red-600', badgeBg: 'bg-red-50 dark:bg-red-500/10', borderColor: 'border-red-200' };
    }
    if (textNorm.includes('netflix')) {
      return { icon: NetflixIcon, color: 'bg-black', textColor: 'text-slate-800', badgeBg: 'bg-slate-100', borderColor: 'border-slate-200' };
    }
    if (textNorm.includes('total energies') || textNorm.includes('totalenergies')) {
      return { icon: TotalEnergiesIcon, color: 'bg-yellow-400', textColor: 'text-yellow-600', badgeBg: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    }
    if (textNorm.includes('deezer') || textNorm.includes('spotify') || textNorm.includes('musique')) {
      return { icon: MusicNoteIcon, color: 'bg-purple-500', textColor: 'text-purple-600', badgeBg: 'bg-purple-50', borderColor: 'border-purple-200' };
    }
    if (textNorm.includes('poubelle') || textNorm.includes('dechet')) {
      return { icon: TrashBinIcon, color: 'bg-rose-500', textColor: 'text-rose-600', badgeBg: 'bg-rose-50', borderColor: 'border-rose-200' };
    }
    if (textNorm.includes('wifi') || textNorm.includes('internet') || textNorm.includes('fibre') || textNorm.includes('box')) {
      return { icon: WifiIcon, color: 'bg-indigo-500', textColor: 'text-indigo-600', badgeBg: 'bg-indigo-50', borderColor: 'border-indigo-200' };
    }
    if (textNorm.includes('telephone') || textNorm.includes('mobile')) {
      return { icon: PhoneOutlineIcon, color: 'bg-[#0ea5e9]', textColor: 'text-[#0284c7]', badgeBg: 'bg-[#e0f2fe]', borderColor: 'border-sky-200' };
    }
    if (textNorm.includes('eau') || textNorm.includes('ceo')) {
      return { icon: CeoIcon, color: 'bg-sky-500', textColor: 'text-sky-600', badgeBg: 'bg-sky-50', borderColor: 'border-sky-200' };
    }
    if (textNorm.includes('assurance') || textNorm.includes('mutuelle')) {
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
    if (textNorm.includes('boulangerie') || textNorm.includes('paul') || textNorm.includes('marie blachere') || textNorm.includes('brioche doree') || textNorm.includes('fournil') || /\bpain\b/.test(textNorm)) {
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
    if (textNorm.includes('sushi') || textNorm.includes('japonais') || textNorm.includes('ramen') || textNorm.includes('matsuri') || textNorm.includes('chinois') || textNorm.includes('asian') || textNorm.includes('wok') || textNorm.includes('bo bun') || textNorm.includes('nem')) {
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

interface CategoryVisualsContextType {
  getVisual: (categoryName: string, description?: string) => CategoryVisual;
  customIcons: CustomCategoryIcon[];
  rules: KeywordRule[];
  addRule: (keyword: string, iconId: string, color: string) => boolean;
  deleteRule: (id: string) => void;
  updateRule: (id: string, keyword: string, iconId: string, color: string) => boolean;
  addCustomIcon: (iconData: Omit<CustomCategoryIcon, 'id' | 'createdAt'>) => CustomCategoryIcon;
  deleteCustomIcon: (iconId: string) => void;
  saveCategoryIconMapping: (categoryName: string, iconId: string, color?: string, oldCategoryName?: string) => void;
}

const CategoryVisualsContext = createContext<CategoryVisualsContextType | null>(null);

export const CategoryVisualsProvider: React.FC<{ children: React.ReactNode; foyerId?: string }> = ({ children, foyerId }) => {
  const { customIcons, addCustomIcon, deleteCustomIcon, saveCategoryIconMapping } = useCustomCategoryIcons(foyerId);
  const { rules, addRule, deleteRule, updateRule } = useKeywordRules(foyerId);

  const getVisual = React.useCallback((categoryName: string, description?: string): CategoryVisual => {
    return resolveCategoryVisual(categoryName, customIcons, description, rules);
  }, [customIcons, rules]);

  const value = useMemo(() => ({
    getVisual,
    customIcons,
    rules,
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
      return resolveCategoryVisual(categoryName, [], description, []);
    },
    customIcons: [],
    rules: [],
    addRule: () => false,
    deleteRule: () => {},
    updateRule: () => false,
    addCustomIcon: () => ({ id: '', name: '', category: '', type: 'svg', createdAt: new Date().toISOString() }),
    deleteCustomIcon: () => {},
    saveCategoryIconMapping: () => {}
  };
}
