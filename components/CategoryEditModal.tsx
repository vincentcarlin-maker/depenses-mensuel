import React, { useState, useEffect, useRef } from 'react';
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
  MoreDotsOutlineIcon,
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
  RetirementIcon
} from './icons/CategoryIcons';
import { CustomCategoryIcon } from '../hooks/useCustomCategoryIcons';
import { useCategoryVisuals } from '../hooks/useCategoryVisuals';
import { CategoryIconCatalog } from './CategoryIconCatalog';
import { ColorPalettePicker } from './ColorPalettePicker';

export interface CategoryThemeDef {
  id: string;
  label: string;
  emoji: string;
  description?: string;
}

export const CATEGORY_THEMES: CategoryThemeDef[] = [
  { id: 'all', label: 'Tous', emoji: '🌟', description: 'Toutes les icônes' },
  { id: 'food', label: 'Alimentation', emoji: '🛒', description: 'Courses, restos, cafés, boulangerie' },
  { id: 'home', label: 'Maison & Énergie', emoji: '🏠', description: 'Logement, eau, élec, gaz, bricolage' },
  { id: 'transport', label: 'Transports', emoji: '🚗', description: 'Voiture, carburant, train, vélo, péage' },
  { id: 'health', label: 'Santé & Famille', emoji: '💊', description: 'Médecin, pharmacie, bébé, animaux' },
  { id: 'leisure', label: 'Loisirs & Sorties', emoji: '🌴', description: 'Vacances, ciné, concerts, sport, jeux' },
  { id: 'tech', label: 'Tech & Abonnements', emoji: '📱', description: 'Internet, mobile, streaming, musique' },
  { id: 'finance', label: 'Finances & Shopping', emoji: '💳', description: 'Banque, impôts, épargne, shopping' },
  { id: 'custom', label: 'Mes icônes', emoji: '🎨', description: 'Icônes personnalisées' },
];

export interface CategoryIconDef {
  id: string;
  name: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  theme: string;
  keywords?: string[];
}

export const PRESET_CATEGORY_ICONS: CategoryIconDef[] = [
  // 1. ALIMENTATION & BOISSONS (food)
  { id: 'groceries', name: 'GroceriesIcon', label: 'Courses', icon: GroceriesIcon, theme: 'food', keywords: ['supermarché', 'alimentation', 'nourriture', 'chariot', 'magasin'] },
  { id: 'cartoutline', name: 'CartOutlineIcon', label: 'Panier Courses', icon: CartOutlineIcon, theme: 'food', keywords: ['caddie', 'supermarché', 'chariot', 'courses', 'achats'] },
  { id: 'bakery', name: 'BakeryIcon', label: 'Boulangerie & Pain', icon: BakeryIcon, theme: 'food', keywords: ['croissant', 'baguette', 'viennoiserie', 'pâtisserie', 'boulangerie'] },
  { id: 'restaurant', name: 'RestaurantIcon', label: 'Restaurant', icon: RestaurantIcon, theme: 'food', keywords: ['repas', 'dîner', 'déjeuner', 'bistrot', 'manger'] },
  { id: 'utensils', name: 'UtensilsOutlineIcon', label: 'Couverts & Table', icon: UtensilsOutlineIcon, theme: 'food', keywords: ['fourchette', 'couteau', 'gastronomie', 'manger', 'repas'] },
  { id: 'fastfood', name: 'FastFoodIcon', label: 'Fast food & Burger', icon: FastFoodIcon, theme: 'food', keywords: ['burger', 'sandwich', 'kebab', 'tacos', 'snack'] },
  { id: 'pizza', name: 'PizzaSliceIcon', label: 'Pizza & Traiteur', icon: PizzaSliceIcon, theme: 'food', keywords: ['pizza', 'pizzeria', 'italien', 'slice'] },
  { id: 'meatfish', name: 'MeatFishIcon', label: 'Boucherie & Poisson', icon: MeatFishIcon, theme: 'food', keywords: ['viande', 'steak', 'boucher', 'poissonnerie', 'saumon'] },
  { id: 'groceryfruit', name: 'GroceryFruitIcon', label: 'Primeur & Fruits', icon: GroceryFruitIcon, theme: 'food', keywords: ['pomme', 'fruits', 'légumes', 'marché', 'bio'] },
  { id: 'icecream', name: 'IceCreamIcon', label: 'Glaces & Desserts', icon: IceCreamIcon, theme: 'food', keywords: ['glace', 'dessert', 'gourmandise', 'chocolat', 'sucré'] },
  { id: 'coffee', name: 'CoffeeIcon', label: 'Café & Pause', icon: CoffeeIcon, theme: 'food', keywords: ['expresso', 'thé', 'pause', 'boisson', 'goûter', 'cafétéria'] },
  { id: 'drinkjuice', name: 'DrinkJuiceIcon', label: 'Boissons & Jus', icon: DrinkJuiceIcon, theme: 'food', keywords: ['soda', 'jus de fruits', 'eau gazeuse', 'canette', 'boisson'] },
  { id: 'bardrinks', name: 'BarDrinksIcon', label: 'Bar & Soirées', icon: BarDrinksIcon, theme: 'food', keywords: ['verre', 'bière', 'cocktail', 'apéro', 'soirée'] },
  { id: 'winebottle', name: 'WineBottleIcon', label: 'Vins & Cave', icon: WineBottleIcon, theme: 'food', keywords: ['bouteille', 'vin rouge', 'champagne', 'caviste', 'alcool'] },

  // 2. MAISON & ÉNERGIE (home)
  { id: 'home', name: 'HomeIcon', label: 'Maison', icon: HomeOutlineIcon, theme: 'home', keywords: ['logement', 'loyer', 'appartement', 'toit', 'foyer', 'habitat'] },
  { id: 'furniture', name: 'FurnitureIcon', label: 'Meubles & Déco', icon: FurnitureIcon, theme: 'home', keywords: ['ameublement', 'ikea', 'canapé', 'décoration', 'lit', 'table'] },
  { id: 'diytools', name: 'DiyToolsIcon', label: 'Bricolage & Outils', icon: DiyToolsIcon, theme: 'home', keywords: ['marteau', 'tournevis', 'outillage', 'travaux', 'quincaillerie', 'leroy merlin'] },
  { id: 'gardenplant', name: 'GardenPlantIcon', label: 'Jardin & Plantes', icon: GardenPlantIcon, theme: 'home', keywords: ['jardinage', 'fleurs', 'terrasse', 'plante', 'jardinerie'] },
  { id: 'heating', name: 'HeatingIcon', label: 'Chauffage', icon: HeatingIcon, theme: 'home', keywords: ['radiateur', 'chaleur', 'fioul', 'poêle', 'pellet', 'granulés'] },
  { id: 'airconditioning', name: 'AirConditioningIcon', label: 'Climatisation', icon: AirConditioningIcon, theme: 'home', keywords: ['clim', 'air conditionné', 'ventilation', 'frais'] },
  { id: 'flame', name: 'FlameOutlineIcon', label: 'Flamme & Feu', icon: FlameOutlineIcon, theme: 'home', keywords: ['gaz', 'cheminée', 'poêle', 'chaleur', 'bois'] },
  { id: 'electricity', name: 'ElectricityIcon', label: 'Électricité', icon: ElectricityIcon, theme: 'home', keywords: ['edf', 'compteur', 'lumière', 'courant', 'ampoule', 'linky'] },
  { id: 'water', name: 'CeoIcon', label: 'Eau (Badge)', icon: CeoIcon, theme: 'home', keywords: ['facture eau', 'compagnie', 'veolia', 'suez'] },
  { id: 'waterdrop', name: 'WaterDropIcon', label: 'Eau courante', icon: WaterDropIcon, theme: 'home', keywords: ['eau', 'goutte', 'robinet', 'plomberie', 'sanitaire'] },
  { id: 'energy', name: 'TotalEnergiesIcon', label: 'Énergie (Badge)', icon: TotalEnergiesIcon, theme: 'home', keywords: ['total', 'station', 'électricité', 'totalenergies'] },
  { id: 'gascylinder', name: 'GasCylinderIcon', label: 'Gaz & Bouteille', icon: GasCylinderIcon, theme: 'home', keywords: ['bouteille de gaz', 'butane', 'propane', 'antargaz'] },
  { id: 'housekey', name: 'HouseKeyIcon', label: 'Serrurier & Clés', icon: HouseKeyIcon, theme: 'home', keywords: ['clé', 'serrure', 'verrou', 'reproduction clé', 'sécurité'] },
  { id: 'securityalarm', name: 'SecurityAlarmIcon', label: 'Alarme & Protection', icon: SecurityAlarmIcon, theme: 'home', keywords: ['télésurveillance', 'caméra', 'verisure', 'gardiennage'] },
  { id: 'cleaningspray', name: 'CleaningSprayIcon', label: 'Entretien & Ménage', icon: CleaningSprayIcon, theme: 'home', keywords: ['produits ménagers', 'nettoyage', 'entretien', 'balai'] },
  { id: 'laundry', name: 'LaundryIcon', label: 'Lessive & Linge', icon: LaundryIcon, theme: 'home', keywords: ['machine', 'linge', 'ménage', 'pressing', 'blanchisserie'] },
  { id: 'trash', name: 'TrashBinIcon', label: 'Poubelles & Tri', icon: TrashBinIcon, theme: 'home', keywords: ['ordures', 'déchets', 'recyclage', 'tri', 'taxe ordures'] },

  // 3. TRANSPORTS & VÉHICULES (transport)
  { id: 'fuel', name: 'FuelIcon', label: 'Carburant', icon: FuelIcon, theme: 'transport', keywords: ['essence', 'diesel', 'station', 'gaspillage', 'gazole', 'sp95'] },
  { id: 'gaspump', name: 'GasPumpOutlineIcon', label: 'Pompe Carburant', icon: GasPumpOutlineIcon, theme: 'transport', keywords: ['station', 'sp95', 'sp98', 'essence', 'carburant'] },
  { id: 'evstation', name: 'EvStationIcon', label: 'Borne Recharge EV', icon: EvStationIcon, theme: 'transport', keywords: ['électrique', 'borne', 'recharge', 'tesla', 'voiture électrique'] },
  { id: 'car', name: 'CarOutlineIcon', label: 'Véhicule / Auto', icon: CarOutlineIcon, theme: 'transport', keywords: ['voiture', 'automobile', 'trajet', 'véhicule'] },
  { id: 'carrepairs', name: 'CarRepairsIcon', label: 'Entretien & Garage', icon: CarRepairsIcon, theme: 'transport', keywords: ['garage', 'mécanique', 'entretien', 'réparation', 'vidange', 'pneus'] },
  { id: 'vehicleinspection', name: 'VehicleInspectionIcon', label: 'Contrôle Technique', icon: VehicleInspectionIcon, theme: 'transport', keywords: ['ct', 'contrôle', 'visite auto', 'bilan'] },
  { id: 'carwash', name: 'CarWashIcon', label: 'Lavage Auto', icon: CarWashIcon, theme: 'transport', keywords: ['karcher', 'nettoyage voiture', 'rouleaux', 'station lavage'] },
  { id: 'parkingtoll', name: 'ParkingTollIcon', label: 'Parking & Péage', icon: ParkingTollIcon, theme: 'transport', keywords: ['stationnement', 'autoroute', 'ticket', 'péage', 'vinci'] },
  { id: 'motorcycle', name: 'MotorcycleIcon', label: 'Moto & Scooter', icon: MotorcycleIcon, theme: 'transport', keywords: ['motard', 'scooter', 'deux roues', 'casque'] },
  { id: 'scooterelectric', name: 'ScooterElectricIcon', label: 'Trottinette Élec.', icon: ScooterElectricIcon, theme: 'transport', keywords: ['trottinette', 'lime', 'dott', 'mobilité douce'] },
  { id: 'bicycle', name: 'BicycleIcon', label: 'Vélo & Cyclisme', icon: BicycleIcon, theme: 'transport', keywords: ['cyclisme', 'bicyclette', 'vélib', 'mobilité', 'vtt'] },
  { id: 'taxicab', name: 'TaxiCabIcon', label: 'Taxi & VTC', icon: TaxiCabIcon, theme: 'transport', keywords: ['uber', 'bolt', 'course taxi', 'chauffeur'] },
  { id: 'traintransit', name: 'TrainTransitIcon', label: 'Train & Métro', icon: TrainTransitIcon, theme: 'transport', keywords: ['sncf', 'métro', 'bus', 'tramway', 'gare', 'ratp', 'navigo'] },
  { id: 'boatferry', name: 'BoatFerryIcon', label: 'Bateau & Ferry', icon: BoatFerryIcon, theme: 'transport', keywords: ['croisière', 'mer', 'navette maritime', 'port'] },
  { id: 'plane', name: 'PlaneIcon', label: 'Voyage / Avion', icon: PlaneOutlineIcon, theme: 'transport', keywords: ['vol', 'aérien', 'aéroport', 'billet avion', 'voyage'] },

  // 4. SANTÉ & FAMILLE (health)
  { id: 'heart', name: 'HeartIcon', label: 'Santé & Cœur', icon: HeartOutlineIcon, theme: 'health', keywords: ['médical', 'soins', 'bien-être', 'cœur'] },
  { id: 'doctor', name: 'DoctorIcon', label: 'Médecin & Soins', icon: DoctorIcon, theme: 'health', keywords: ['docteur', 'généraliste', 'consultation', 'doctolib'] },
  { id: 'stethoscope', name: 'StethoscopeIcon', label: 'Consultation & Bilan', icon: StethoscopeIcon, theme: 'health', keywords: ['spécialiste', 'clinique', 'examen', 'auscultation'] },
  { id: 'firstaid', name: 'FirstAidIcon', label: 'Urgences & Secours', icon: FirstAidIcon, theme: 'health', keywords: ['premiers secours', 'pansements', 'blessure', 'urgence'] },
  { id: 'dentist', name: 'DentistIcon', label: 'Dentiste & Dents', icon: DentistIcon, theme: 'health', keywords: ['dentaire', 'orthodontie', 'dents', 'détartrage'] },
  { id: 'glasses', name: 'GlassesIcon', label: 'Optique & Lunettes', icon: GlassesIcon, theme: 'health', keywords: ['lunettes', 'lentilles', 'ophtalmo', 'yeux', 'opticien'] },
  { id: 'pill', name: 'PillIcon', label: 'Pharmacie & Médocs', icon: PillIcon, theme: 'health', keywords: ['médicaments', 'ordonnance', 'paracétamol', 'pharmacie'] },
  { id: 'pillcapsule', name: 'PillCapsuleOutlineIcon', label: 'Gélule / Complément', icon: PillCapsuleOutlineIcon, theme: 'health', keywords: ['vitamines', 'traitement', 'santé', 'compléments'] },
  { id: 'beautysalon', name: 'BeautySalonIcon', label: 'Coiffure & Esthétique', icon: BeautySalonIcon, theme: 'health', keywords: ['coiffeur', 'barbier', 'beauté', 'spa', 'massage', 'onglerie'] },
  { id: 'spamassage', name: 'SpaMassageIcon', label: 'Spa & Massages', icon: SpaMassageIcon, theme: 'health', keywords: ['détente', 'sauna', 'hammam', 'thalasso', 'soins corps'] },
  { id: 'baby', name: 'BabyIcon', label: 'Bébé & Enfants', icon: BabyIcon, theme: 'health', keywords: ['crèche', 'maternité', 'nounou', 'poussette', 'couches', 'enfants'] },
  { id: 'stroller', name: 'StrollerIcon', label: 'Poussette & Puériculture', icon: StrollerIcon, theme: 'health', keywords: ['nourrisson', 'bébé', 'maternité', 'garderie'] },
  { id: 'toy', name: 'ToyIcon', label: 'Jouets & Jeux', icon: ToyIcon, theme: 'health', keywords: ['jouet', 'lego', 'peluche', 'enfant', 'cadeau enfant'] },
  { id: 'paw', name: 'PawIcon', label: 'Animaux & Vétérinaire', icon: PawOutlineIcon, theme: 'health', keywords: ['chien', 'chat', 'croquettes', 'vétérinaire', 'animalerie'] },
  { id: 'dog', name: 'DogIcon', label: 'Chien & Canin', icon: DogIcon, theme: 'health', keywords: ['chiot', 'toilettage', 'pension', 'promenade'] },
  { id: 'cat', name: 'CatIcon', label: 'Chat & Félin', icon: CatIcon, theme: 'health', keywords: ['litière', 'chaton', 'vétérinaire chat'] },

  // 5. LOISIRS & SORTIES (leisure)
  { id: 'vacation', name: 'PalmTreeIcon', label: 'Vacances & Plage', icon: PalmTreeIcon, theme: 'leisure', keywords: ['plage', 'mer', 'été', 'séjour', 'soleil'] },
  { id: 'palm', name: 'PalmOutlineIcon', label: 'Palmier & Évasion', icon: PalmOutlineIcon, theme: 'leisure', keywords: ['vacances', 'soleil', 'détente', 'palmier'] },
  { id: 'hotel', name: 'HotelIcon', label: 'Hôtel & Séjour', icon: HotelIcon, theme: 'leisure', keywords: ['hébergement', 'chambre', 'airbnb', 'nuitée', 'resort'] },
  { id: 'cinema', name: 'CinemaIcon', label: 'Cinéma & Spectacles', icon: CinemaIcon, theme: 'leisure', keywords: ['film', 'salle', 'popcorn', 'théâtre', 'spectacle'] },
  { id: 'concertfestival', name: 'ConcertFestivalIcon', label: 'Concert & Billets', icon: ConcertFestivalIcon, theme: 'leisure', keywords: ['musique live', 'festival', 'spectacle', 'billetterie'] },
  { id: 'guitar', name: 'GuitarMusicIcon', label: 'Musique & Instrument', icon: GuitarMusicIcon, theme: 'leisure', keywords: ['guitare', 'piano', 'cours musique', 'partition', 'groupe'] },
  { id: 'paintpalette', name: 'PaintPaletteIcon', label: 'Art & Création', icon: PaintPaletteIcon, theme: 'leisure', keywords: ['peinture', 'dessin', 'musée', 'expo', 'arts plastiques'] },
  { id: 'cameraphoto', name: 'CameraPhotoIcon', label: 'Photo & Vidéo', icon: CameraPhotoIcon, theme: 'leisure', keywords: ['appareil photo', 'shooting', 'tirage photo', 'vidéo'] },
  { id: 'gaming', name: 'GamingIcon', label: 'Jeux vidéo & Gaming', icon: GamingIcon, theme: 'leisure', keywords: ['manette', 'console', 'playstation', 'jeux', 'switch', 'steam'] },
  { id: 'dumbbell', name: 'DumbbellIcon', label: 'Sport & Fitness', icon: DumbbellOutlineIcon, theme: 'leisure', keywords: ['musculation', 'salle', 'gym', 'entraînement', 'fitness'] },
  { id: 'soccerball', name: 'SoccerBallIcon', label: 'Football & Équipe', icon: SoccerBallIcon, theme: 'leisure', keywords: ['foot', 'match', 'stade', 'club', 'sport co'] },
  { id: 'runningshoe', name: 'RunningShoeIcon', label: 'Running & Jogging', icon: RunningShoeIcon, theme: 'leisure', keywords: ['course à pied', 'marathon', 'baskets', 'trail'] },
  { id: 'swimmingpool', name: 'SwimmingPoolIcon', label: 'Piscine & Natation', icon: SwimmingPoolIcon, theme: 'leisure', keywords: ['bassin', 'baignade', 'aquagym', 'maillot'] },
  { id: 'tentcamping', name: 'TentCampingIcon', label: 'Camping & Bivouac', icon: TentCampingIcon, theme: 'leisure', keywords: ['tente', 'plein air', 'randonnée', 'nature'] },
  { id: 'fishing', name: 'FishingIcon', label: 'Pêche & Chasse', icon: FishingIcon, theme: 'leisure', keywords: ['poisson', 'canne à pêche', 'étang', 'rivière'] },
  { id: 'skimountain', name: 'SkiMountainIcon', label: 'Ski & Montagne', icon: SkiMountainIcon, theme: 'leisure', keywords: ['sports d hiver', 'forfait ski', 'chalet', 'neige'] },
  { id: 'books', name: 'BooksIcon', label: 'Livres & Culture', icon: BooksIcon, theme: 'leisure', keywords: ['lecture', 'librairie', 'roman', 'bd', 'manga', 'culture'] },
  { id: 'leaf', name: 'LeafIcon', label: 'Nature & Plein air', icon: LeafOutlineIcon, theme: 'leisure', keywords: ['rando', 'parc', 'balade', 'forêt', 'nature'] },

  // 6. TECH & ABONNEMENTS (tech)
  { id: 'mandatory', name: 'MandatoryIcon', label: 'Dép. Récurrentes', icon: MandatoryIcon, theme: 'tech', keywords: ['abonnement', 'mensuel', 'charge', 'fixe', 'prélèvement'] },
  { id: 'streaming', name: 'NetflixIcon', label: 'Streaming (Netflix)', icon: NetflixIcon, theme: 'tech', keywords: ['séries', 'films', 'vidéo', 'plateforme', 'netflix', 'disney'] },
  { id: 'tvsubscription', name: 'TvSubscriptionIcon', label: 'Télé & Chaînes', icon: TvSubscriptionIcon, theme: 'tech', keywords: ['télévision', 'box tv', 'bouquet', 'canal', 'iptv'] },
  { id: 'music', name: 'MusicNoteIcon', label: 'Musique & Streaming', icon: MusicNoteIcon, theme: 'tech', keywords: ['spotify', 'deezer', 'musique', 'audio', 'apple music'] },
  { id: 'wifi', name: 'WifiIcon', label: 'Internet & Box', icon: WifiIcon, theme: 'tech', keywords: ['box', 'fibre', 'adsl', 'connexion', 'routeur', 'opérateur'] },
  { id: 'phone', name: 'DevicePhoneMobileIcon', label: 'Téléphone / Mobile', icon: DevicePhoneMobileIcon, theme: 'tech', keywords: ['smartphone', 'forfait', 'gsm', 'mobile', 'iphone'] },
  { id: 'phoneoutline', name: 'PhoneOutlineIcon', label: 'Appels & Ligne', icon: PhoneOutlineIcon, theme: 'tech', keywords: ['télécoms', 'opérateur', 'téléphone', 'fixe'] },
  { id: 'computerlaptop', name: 'ComputerLaptopIcon', label: 'Ordinateur & PC', icon: ComputerLaptopIcon, theme: 'tech', keywords: ['pc', 'macbook', 'informatique', 'laptop', 'écran'] },
  { id: 'headphonesaudio', name: 'HeadphonesAudioIcon', label: 'Casque & Écouteurs', icon: HeadphonesAudioIcon, theme: 'tech', keywords: ['airpods', 'écouteurs', 'audio', 'son'] },
  { id: 'cloudserver', name: 'CloudServerIcon', label: 'Cloud & Stockage', icon: CloudServerIcon, theme: 'tech', keywords: ['icloud', 'google drive', 'backup', 'serveur', 'hébergement'] },
  { id: 'smartwatch', name: 'SmartwatchIcon', label: 'Montre Connectée', icon: SmartwatchIcon, theme: 'tech', keywords: ['apple watch', 'garmin', 'bracelet', 'gadget'] },
  { id: 'sfr', name: 'SfrIcon', label: 'SFR (Badge)', icon: SfrIcon, theme: 'tech', keywords: ['sfr', 'opérateur', 'box sfr', 'forfait sfr'] },

  // 7. FINANCES & SHOPPING (finance)
  { id: 'bankfinance', name: 'BankFinanceIcon', label: 'Banque & Frais', icon: BankFinanceIcon, theme: 'finance', keywords: ['carte', 'frais bancaires', 'crédit', 'compte', 'banque'] },
  { id: 'salarypayroll', name: 'SalaryPayrollIcon', label: 'Salaire & Revenus', icon: SalaryPayrollIcon, theme: 'finance', keywords: ['paie', 'virement', 'salaire', 'bulletin', 'revenus'] },
  { id: 'taxfinance', name: 'TaxFinanceIcon', label: 'Impôts & Taxes', icon: TaxFinanceIcon, theme: 'finance', keywords: ['trésor public', 'taxe', 'fiscalité', 'impôts'] },
  { id: 'invoicebill', name: 'InvoiceBillIcon', label: 'Factures & Courrier', icon: InvoiceBillIcon, theme: 'finance', keywords: ['facture', 'quittance', 'reçu', 'courrier'] },
  { id: 'savingspiggy', name: 'SavingsPiggyIcon', label: 'Tirelire & Épargne', icon: SavingsPiggyIcon, theme: 'finance', keywords: ['économie', 'livret', 'argent de côté', 'épargne'] },
  { id: 'stockinvestment', name: 'StockInvestmentIcon', label: 'Bourse & Titres', icon: StockInvestmentIcon, theme: 'finance', keywords: ['actions', 'pea', 'cto', 'dividendes', 'bourse'] },
  { id: 'cryptocurrency', name: 'CryptoCurrencyIcon', label: 'Crypto & Bitcoin', icon: CryptoCurrencyIcon, theme: 'finance', keywords: ['bitcoin', 'crypto', 'ethereum', 'trading'] },
  { id: 'legallawyer', name: 'LegalLawyerIcon', label: 'Notaire & Justice', icon: LegalLawyerIcon, theme: 'finance', keywords: ['avocat', 'notaire', 'juridique', 'justice', 'frais notaire'] },
  { id: 'fineticket', name: 'FineTicketIcon', label: 'Amende & PV', icon: FineTicketIcon, theme: 'finance', keywords: ['contravention', 'pv', 'stationnement gênant', 'radar'] },
  { id: 'retirement', name: 'RetirementIcon', label: 'Retraite & Rente', icon: RetirementIcon, theme: 'finance', keywords: ['retraite', 'pension', 'senior', 'per'] },
  { id: 'clothing', name: 'ClothingIcon', label: 'Vêtements & Mode', icon: ClothingIcon, theme: 'finance', keywords: ['habits', 'shopping', 'fringues', 'chaussures', 'mode'] },
  { id: 'shoppingbag', name: 'ShoppingBagOutlineIcon', label: 'Sac Shopping', icon: ShoppingBagOutlineIcon, theme: 'finance', keywords: ['boutique', 'magasin', 'achats', 'centre commercial'] },
  { id: 'gift', name: 'GiftIcon', label: 'Cadeau', icon: GiftIcon, theme: 'finance', keywords: ['noël', 'présent', 'fête', 'offrir', 'anniversaire'] },
  { id: 'giftoutline', name: 'GiftOutlineIcon', label: 'Paquet Cadeau', icon: GiftOutlineIcon, theme: 'finance', keywords: ['surprise', 'fêtes', 'cadeau', 'noël'] },
  { id: 'birthday', name: 'BirthdayIcon', label: 'Anniversaire', icon: BirthdayIcon, theme: 'finance', keywords: ['gâteau', 'bougies', 'fête', 'âge', 'anniv'] },
  { id: 'schoolsupplies', name: 'SchoolSuppliesIcon', label: 'École & Fournitures', icon: SchoolSuppliesIcon, theme: 'finance', keywords: ['scolaire', 'cahier', 'stylos', 'rentrée', 'papeterie'] },
  { id: 'graduation', name: 'GraduationIcon', label: 'Études & Diplôme', icon: GraduationOutlineIcon, theme: 'finance', keywords: ['université', 'école', 'formation', 'cours', 'études'] },
  { id: 'donationcharity', name: 'DonationCharityIcon', label: 'Dons & Entraide', icon: DonationCharityIcon, theme: 'finance', keywords: ['association', 'caritatif', 'solidarité', 'don', 'aide'] },
  { id: 'shield', name: 'ShieldIcon', label: 'Assurance & Sécurité', icon: ShieldIcon, theme: 'finance', keywords: ['mutuelle', 'protection', 'sécurité', 'assurance', 'sinistre'] },
  { id: 'misc', name: 'MiscIcon', label: 'Divers', icon: MiscIcon, theme: 'finance', keywords: ['autre', 'imprévu', 'général', 'extra'] },
  { id: 'moredots', name: 'MoreDotsOutlineIcon', label: 'Autres / Plus', icon: MoreDotsOutlineIcon, theme: 'finance', keywords: ['extra', 'options', 'complémentaire', 'points'] },
];

export interface ColorSwatch {
  id: string;
  label: string;
  bgClass: string;
  badgeBgClass: string;
  textColorClass: string;
  hex: string;
  family?: 'blue' | 'green' | 'warm' | 'red' | 'purple' | 'teal' | 'neutral' | 'pastel';
  customStyle?: React.CSSProperties;
}

export const CATEGORY_COLORS: ColorSwatch[] = [
  // BLEUS & AZUR (blue)
  { id: 'blue-roi', label: 'Bleu Roi', bgClass: 'bg-[#2563eb]', badgeBgClass: 'bg-[#dbeafe] dark:bg-blue-950/70', textColorClass: 'text-[#1d4ed8] dark:text-blue-300', hex: '#2563eb', family: 'blue' },
  { id: 'blue', label: 'Bleu Électrique', bgClass: 'bg-[#3b82f6]', badgeBgClass: 'bg-[#dbeafe] dark:bg-blue-950/70', textColorClass: 'text-[#2563eb] dark:text-blue-400', hex: '#3b82f6', family: 'blue' },
  { id: 'sky', label: 'Bleu Ciel', bgClass: 'bg-[#0ea5e9]', badgeBgClass: 'bg-[#e0f2fe] dark:bg-sky-950/70', textColorClass: 'text-[#0284c7] dark:text-sky-400', hex: '#0ea5e9', family: 'blue' },
  { id: 'sky-ocean', label: 'Bleu Océan', bgClass: 'bg-[#0284c7]', badgeBgClass: 'bg-[#e0f2fe] dark:bg-sky-950/70', textColorClass: 'text-[#0369a1] dark:text-sky-300', hex: '#0284c7', family: 'blue' },
  { id: 'indigo', label: 'Indigo', bgClass: 'bg-[#6366f1]', badgeBgClass: 'bg-[#e0e7ff] dark:bg-indigo-950/70', textColorClass: 'text-[#4f46e5] dark:text-indigo-400', hex: '#6366f1', family: 'blue' },
  { id: 'indigo-dark', label: 'Indigo Profond', bgClass: 'bg-[#4f46e5]', badgeBgClass: 'bg-[#e0e7ff] dark:bg-indigo-950/70', textColorClass: 'text-[#4338ca] dark:text-indigo-300', hex: '#4f46e5', family: 'blue' },
  { id: 'blue-night', label: 'Bleu Nuit', bgClass: 'bg-[#1e40af]', badgeBgClass: 'bg-[#dbeafe] dark:bg-blue-950/80', textColorClass: 'text-[#1e3a8a] dark:text-blue-200', hex: '#1e40af', family: 'blue' },
  { id: 'cyan-deep', label: 'Cyan Lagon', bgClass: 'bg-[#0891b2]', badgeBgClass: 'bg-[#cffafe] dark:bg-cyan-950/70', textColorClass: 'text-[#0e7490] dark:text-cyan-300', hex: '#0891b2', family: 'blue' },

  // VERTS & NATURE (green)
  { id: 'emerald', label: 'Émeraude', bgClass: 'bg-[#10b981]', badgeBgClass: 'bg-[#d1fae5] dark:bg-emerald-950/70', textColorClass: 'text-[#059669] dark:text-emerald-400', hex: '#10b981', family: 'green' },
  { id: 'forest', label: 'Vert Forêt', bgClass: 'bg-[#059669]', badgeBgClass: 'bg-[#d1fae5] dark:bg-emerald-950/70', textColorClass: 'text-[#047857] dark:text-emerald-300', hex: '#059669', family: 'green' },
  { id: 'green-prairie', label: 'Vert Prairie', bgClass: 'bg-[#16a34a]', badgeBgClass: 'bg-[#dcfce7] dark:bg-emerald-950/70', textColorClass: 'text-[#15803d] dark:text-green-300', hex: '#16a34a', family: 'green' },
  { id: 'green-apple', label: 'Vert Pomme', bgClass: 'bg-[#22c55e]', badgeBgClass: 'bg-[#dcfce7] dark:bg-emerald-950/70', textColorClass: 'text-[#16a34a] dark:text-green-400', hex: '#22c55e', family: 'green' },
  { id: 'lime', label: 'Citron Vert', bgClass: 'bg-[#84cc16]', badgeBgClass: 'bg-[#ecfccb] dark:bg-lime-950/70', textColorClass: 'text-[#65a30d] dark:text-lime-400', hex: '#84cc16', family: 'green' },
  { id: 'olive', label: 'Olive & Sauge', bgClass: 'bg-[#65a30d]', badgeBgClass: 'bg-[#ecfccb] dark:bg-lime-950/70', textColorClass: 'text-[#4d7c0f] dark:text-lime-300', hex: '#65a30d', family: 'green' },
  { id: 'jade-dark', label: 'Jade Sombre', bgClass: 'bg-[#065f46]', badgeBgClass: 'bg-[#d1fae5] dark:bg-emerald-950/80', textColorClass: 'text-[#064e3b] dark:text-emerald-200', hex: '#065f46', family: 'green' },

  // CHAUDS : ORANGES & JAUNES (warm)
  { id: 'orange', label: 'Orange Vif', bgClass: 'bg-[#f97316]', badgeBgClass: 'bg-[#ffedd5] dark:bg-orange-950/70', textColorClass: 'text-[#ea580c] dark:text-orange-400', hex: '#f97316', family: 'warm' },
  { id: 'mandarin', label: 'Mandarine', bgClass: 'bg-[#ea580c]', badgeBgClass: 'bg-[#ffedd5] dark:bg-orange-950/70', textColorClass: 'text-[#c2410c] dark:text-orange-300', hex: '#ea580c', family: 'warm' },
  { id: 'coral', label: 'Corail', bgClass: 'bg-[#fb923c]', badgeBgClass: 'bg-[#ffedd5] dark:bg-orange-950/70', textColorClass: 'text-[#ea580c] dark:text-orange-400', hex: '#fb923c', family: 'warm' },
  { id: 'amber', label: 'Ambre', bgClass: 'bg-[#f59e0b]', badgeBgClass: 'bg-[#fef3c7] dark:bg-amber-950/70', textColorClass: 'text-[#d97706] dark:text-amber-400', hex: '#f59e0b', family: 'warm' },
  { id: 'caramel', label: 'Caramel', bgClass: 'bg-[#d97706]', badgeBgClass: 'bg-[#fef3c7] dark:bg-amber-950/70', textColorClass: 'text-[#b45309] dark:text-amber-300', hex: '#d97706', family: 'warm' },
  { id: 'yellow-gold', label: 'Jaune Or', bgClass: 'bg-[#eab308]', badgeBgClass: 'bg-[#fef9c3] dark:bg-yellow-950/70', textColorClass: 'text-[#ca8a04] dark:text-yellow-400', hex: '#eab308', family: 'warm' },
  { id: 'sunflower', label: 'Tournesol', bgClass: 'bg-[#ca8a04]', badgeBgClass: 'bg-[#fef9c3] dark:bg-yellow-950/70', textColorClass: 'text-[#a16207] dark:text-yellow-300', hex: '#ca8a04', family: 'warm' },

  // ROUGES & RUBIS (red)
  { id: 'red', label: 'Rouge Carmin', bgClass: 'bg-[#ef4444]', badgeBgClass: 'bg-[#fee2e2] dark:bg-rose-950/70', textColorClass: 'text-[#dc2626] dark:text-rose-400', hex: '#ef4444', family: 'red' },
  { id: 'red-passion', label: 'Rouge Passion', bgClass: 'bg-[#dc2626]', badgeBgClass: 'bg-[#fee2e2] dark:bg-rose-950/70', textColorClass: 'text-[#b91c1c] dark:text-rose-300', hex: '#dc2626', family: 'red' },
  { id: 'bordeaux', label: 'Bordeaux', bgClass: 'bg-[#b91c1c]', badgeBgClass: 'bg-[#fee2e2] dark:bg-rose-950/70', textColorClass: 'text-[#991b1b] dark:text-rose-200', hex: '#b91c1c', family: 'red' },
  { id: 'raspberry', label: 'Framboise', bgClass: 'bg-[#e11d48]', badgeBgClass: 'bg-[#ffe4e6] dark:bg-rose-950/70', textColorClass: 'text-[#be123c] dark:text-rose-300', hex: '#e11d48', family: 'red' },
  { id: 'vermilion', label: 'Vermillon', bgClass: 'bg-[#f43f5e]', badgeBgClass: 'bg-[#ffe4e6] dark:bg-rose-950/70', textColorClass: 'text-[#e11d48] dark:text-rose-400', hex: '#f43f5e', family: 'red' },
  { id: 'garnet', label: 'Grenat Profond', bgClass: 'bg-[#7f1d1d]', badgeBgClass: 'bg-[#fee2e2] dark:bg-rose-950/80', textColorClass: 'text-[#450a0a] dark:text-rose-100', hex: '#7f1d1d', family: 'red' },

  // ROSES & VIOLETS (purple)
  { id: 'pink', label: 'Rose Bonbon', bgClass: 'bg-[#ec4899]', badgeBgClass: 'bg-[#fce7f3] dark:bg-pink-950/70', textColorClass: 'text-[#db2777] dark:text-pink-400', hex: '#ec4899', family: 'purple' },
  { id: 'pink-vivid', label: 'Rose Vif', bgClass: 'bg-[#db2777]', badgeBgClass: 'bg-[#fce7f3] dark:bg-pink-950/70', textColorClass: 'text-[#be185d] dark:text-pink-300', hex: '#db2777', family: 'purple' },
  { id: 'fuchsia', label: 'Fuchsia', bgClass: 'bg-[#d946ef]', badgeBgClass: 'bg-[#fae8ff] dark:bg-fuchsia-950/70', textColorClass: 'text-[#c026d3] dark:text-fuchsia-400', hex: '#d946ef', family: 'purple' },
  { id: 'purple', label: 'Violet Royal', bgClass: 'bg-[#a855f7]', badgeBgClass: 'bg-[#f3e8ff] dark:bg-purple-950/70', textColorClass: 'text-[#9333ea] dark:text-purple-400', hex: '#a855f7', family: 'purple' },
  { id: 'amethyst', label: 'Améthyste', bgClass: 'bg-[#9333ea]', badgeBgClass: 'bg-[#f3e8ff] dark:bg-purple-950/70', textColorClass: 'text-[#7e22ce] dark:text-purple-300', hex: '#9333ea', family: 'purple' },
  { id: 'plum', label: 'Prune Sombre', bgClass: 'bg-[#6b21a8]', badgeBgClass: 'bg-[#f3e8ff] dark:bg-purple-950/80', textColorClass: 'text-[#581c87] dark:text-purple-200', hex: '#6b21a8', family: 'purple' },

  // TURQUOISE & AQUATIQUES (teal)
  { id: 'teal', label: 'Turquoise', bgClass: 'bg-[#14b8a6]', badgeBgClass: 'bg-[#ccfbf1] dark:bg-teal-950/70', textColorClass: 'text-[#0d9488] dark:text-teal-400', hex: '#14b8a6', family: 'teal' },
  { id: 'lagoon', label: 'Lagon', bgClass: 'bg-[#0d9488]', badgeBgClass: 'bg-[#ccfbf1] dark:bg-teal-950/70', textColorClass: 'text-[#0f766e] dark:text-teal-300', hex: '#0d9488', family: 'teal' },
  { id: 'petrol', label: 'Pétrole', bgClass: 'bg-[#0f766e]', badgeBgClass: 'bg-[#ccfbf1] dark:bg-teal-950/70', textColorClass: 'text-[#115e59] dark:text-teal-200', hex: '#0f766e', family: 'teal' },
  { id: 'caribbean', label: 'Bleu Caraïbes', bgClass: 'bg-[#06b6d4]', badgeBgClass: 'bg-[#cffafe] dark:bg-cyan-950/70', textColorClass: 'text-[#0891b2] dark:text-cyan-400', hex: '#06b6d4', family: 'teal' },
  { id: 'teal-deep', label: 'Canard Profond', bgClass: 'bg-[#115e59]', badgeBgClass: 'bg-[#ccfbf1] dark:bg-teal-950/80', textColorClass: 'text-[#134e4a] dark:text-teal-200', hex: '#115e59', family: 'teal' },

  // NEUTRES & MINÉRAUX (neutral)
  { id: 'slate', label: 'Ardoise', bgClass: 'bg-[#64748b]', badgeBgClass: 'bg-[#f1f5f9] dark:bg-slate-800', textColorClass: 'text-[#475569] dark:text-slate-300', hex: '#64748b', family: 'neutral' },
  { id: 'steel', label: 'Gris Acier', bgClass: 'bg-[#475569]', badgeBgClass: 'bg-[#f1f5f9] dark:bg-slate-800', textColorClass: 'text-[#334155] dark:text-slate-200', hex: '#475569', family: 'neutral' },
  { id: 'anthracite', label: 'Anthracite', bgClass: 'bg-[#334155]', badgeBgClass: 'bg-[#e2e8f0] dark:bg-slate-800', textColorClass: 'text-[#1e293b] dark:text-slate-200', hex: '#334155', family: 'neutral' },
  { id: 'charcoal', label: 'Charbon & Nuit', bgClass: 'bg-[#0f172a]', badgeBgClass: 'bg-[#e2e8f0] dark:bg-slate-800', textColorClass: 'text-[#020617] dark:text-slate-100', hex: '#0f172a', family: 'neutral' },
  { id: 'bronze', label: 'Bronze Chaud', bgClass: 'bg-[#92400e]', badgeBgClass: 'bg-[#fef3c7] dark:bg-amber-950/70', textColorClass: 'text-[#78350f] dark:text-amber-200', hex: '#92400e', family: 'neutral' },
  { id: 'taupe', label: 'Taupe Minéral', bgClass: 'bg-[#57534e]', badgeBgClass: 'bg-[#f5f5f4] dark:bg-stone-800', textColorClass: 'text-[#44403c] dark:text-stone-300', hex: '#57534e', family: 'neutral' },

  // PASTELS DOUX (pastel)
  { id: 'blue-pastel', label: 'Bleu Pastel', bgClass: 'bg-[#93c5fd]', badgeBgClass: 'bg-[#eff6ff] dark:bg-blue-950/60', textColorClass: 'text-[#2563eb] dark:text-blue-300', hex: '#93c5fd', family: 'pastel' },
  { id: 'mint', label: 'Menthe Pastel', bgClass: 'bg-[#86efac]', badgeBgClass: 'bg-[#f0fdf4] dark:bg-emerald-950/60', textColorClass: 'text-[#16a34a] dark:text-emerald-300', hex: '#86efac', family: 'pastel' },
  { id: 'pink-pastel', label: 'Rose Pastel', bgClass: 'bg-[#f472b6]', badgeBgClass: 'bg-[#fdf2f8] dark:bg-pink-950/60', textColorClass: 'text-[#db2777] dark:text-pink-300', hex: '#f472b6', family: 'pastel' },
  { id: 'lavender-pastel', label: 'Lavande Pastel', bgClass: 'bg-[#d8b4fe]', badgeBgClass: 'bg-[#faf5ff] dark:bg-purple-950/60', textColorClass: 'text-[#9333ea] dark:text-purple-300', hex: '#d8b4fe', family: 'pastel' },
  { id: 'peach-pastel', label: 'Pêche Pastel', bgClass: 'bg-[#fcd34d]', badgeBgClass: 'bg-[#fffbeb] dark:bg-amber-950/60', textColorClass: 'text-[#d97706] dark:text-amber-300', hex: '#fcd34d', family: 'pastel' },
  { id: 'teal-pastel', label: 'Lagon Pastel', bgClass: 'bg-[#5eead4]', badgeBgClass: 'bg-[#f0fdfa] dark:bg-teal-950/60', textColorClass: 'text-[#0d9488] dark:text-teal-300', hex: '#5eead4', family: 'pastel' },
];

export function getColorDef(colorValue?: string): ColorSwatch {
  if (!colorValue) return CATEGORY_COLORS[0];
  const found = CATEGORY_COLORS.find(
    c => c.id === colorValue || c.bgClass === colorValue || c.hex.toLowerCase() === colorValue.toLowerCase()
  );
  if (found) return found;

  // Handle custom hex color like 'bg-[#3b82f6]' or '#3b82f6'
  const hexMatch = colorValue.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
  if (hexMatch) {
    const hex = `#${hexMatch[1]}`;
    return {
      id: hex,
      label: 'Personnalisée',
      bgClass: `bg-[${hex}]`,
      badgeBgClass: '',
      textColorClass: '',
      hex: hex,
      customStyle: {
        backgroundColor: `${hex}22`,
        color: hex,
      }
    };
  }

  // Generic fallback based on color name inside string
  if (colorValue.includes('emerald') || colorValue.includes('green') || colorValue.includes('lime')) return CATEGORY_COLORS[8];
  if (colorValue.includes('orange') || colorValue.includes('amber') || colorValue.includes('yellow')) return CATEGORY_COLORS[15];
  if (colorValue.includes('pink') || colorValue.includes('fuchsia')) return CATEGORY_COLORS[28];
  if (colorValue.includes('purple') || colorValue.includes('violet')) return CATEGORY_COLORS[31];
  if (colorValue.includes('red') || colorValue.includes('rose')) return CATEGORY_COLORS[22];
  if (colorValue.includes('teal') || colorValue.includes('cyan')) return CATEGORY_COLORS[34];
  if (colorValue.includes('slate') || colorValue.includes('gray') || colorValue.includes('stone')) return CATEGORY_COLORS[39];
  if (colorValue.includes('mint')) return CATEGORY_COLORS[46];

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
  const customIcons = rawCustomIcons.filter(ci => !ci.id?.startsWith('mapping_') && ci.category !== 'deleted_system_icon');
  const deletedSystemIcons = rawCustomIcons
    .filter(ci => ci.category === 'deleted_system_icon')
    .map(ci => ci.name);
  const filteredPresets = PRESET_CATEGORY_ICONS.filter(preset => !deletedSystemIcons.includes(preset.name));

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

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(categoryName);
      setSelectedIconId(initialIconId || 'misc');
      setSelectedColor(initialColor || 'bg-[#3b82f6]');
      setError('');
      if (overlayRef.current) {
        overlayRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, categoryName, initialIconId, initialColor]);

  if (!isOpen) return null;

  const colorDef = getColorDef(selectedColor);

  const selectedCustom = customIcons.find(
    ci => ci.id === selectedIconId || ci.name === selectedIconId || ci.name.toLowerCase().replace(/icon$/, '') === selectedIconId.toLowerCase()
  );

  const renderIconContent = (iconId: string, custom?: CustomCategoryIcon, _isSelected = false) => {
    if (custom) {
      if (custom.type === 'svg' && custom.svgContent) {
        return (
          <div
            className="w-6 h-6 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: custom.svgContent }}
          />
        );
      }
      if (custom.imageUrl) {
        return <img src={custom.imageUrl} className="w-full h-full object-contain p-0.5 rounded-xl" alt={custom.name} />;
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
    <div 
      ref={overlayRef}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[250] flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4 border border-slate-100 dark:border-slate-700 max-h-[90vh] my-auto flex flex-col">
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
                style={colorDef.customStyle}
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

          {/* 3. CATALOGUE D'ICÔNES PAR THÈME */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Catalogue d'icônes
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Classées par thème
              </span>
            </div>

            <CategoryIconCatalog
              icons={filteredPresets}
              selectedIconId={selectedIconId}
              onSelectIcon={(iconId) => setSelectedIconId(iconId)}
              customIcons={customIcons}
              onDeleteCustomIcon={(id) => {
                deleteCustomIcon(id);
                if (selectedIconId === id) {
                  setSelectedIconId('misc');
                }
              }}
              maxHeight="max-h-52 sm:max-h-60"
            />
          </div>

          {/* 4. COULEUR DU MACARON */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60">
            <ColorPalettePicker
              selectedColor={selectedColor}
              onSelectColor={(colorClass) => setSelectedColor(colorClass)}
            />
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
