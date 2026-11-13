import assert from 'assert';
import { resolveCategoryVisual } from '../hooks/useCategoryVisuals';
import {
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
  GroceriesIcon,
  RestaurantIcon,
  FirstAidIcon,
  SfrIcon,
  DeezerIcon,
  NetflixIcon,
  WifiIcon
} from '../components/icons/CategoryIcons';

console.log('Testing Store and Restaurant Icon Resolution...');

// 1. Tests Courses / Supermarchés
const testCasesStores = [
  { category: 'Courses', description: 'Leclerc', expectedIcon: LeclercIcon, label: 'Leclerc' },
  { category: 'Courses', description: 'Leclerc Drive', expectedIcon: LeclercIcon, label: 'Leclerc Drive' },
  { category: 'Courses', description: 'Carrefour', expectedIcon: CarrefourIcon, label: 'Carrefour' },
  { category: 'Courses', description: 'Carrefour Market', expectedIcon: CarrefourIcon, label: 'Carrefour Market' },
  { category: 'Courses', description: 'Intermarché', expectedIcon: IntermarcheIcon, label: 'Intermarché' },
  { category: 'Courses', description: 'Intermarché Drive', expectedIcon: IntermarcheIcon, label: 'Intermarché Drive' },
  { category: 'Courses', description: 'Lidl', expectedIcon: LidlIcon, label: 'Lidl' },
  { category: 'Courses', description: 'Auchan', expectedIcon: AuchanIcon, label: 'Auchan' },
  { category: 'Courses', description: 'Aldi', expectedIcon: AldiIcon, label: 'Aldi' },
  { category: 'Courses', description: 'Super U', expectedIcon: SuperUIcon, label: 'Super U' },
  { category: 'Courses', description: 'Monoprix', expectedIcon: MonoprixIcon, label: 'Monoprix' },
  { category: 'Courses', description: 'Picard', expectedIcon: PicardIcon, label: 'Picard' },
  { category: 'Courses', description: 'Grand Frais', expectedIcon: GrandFraisIcon, label: 'Grand Frais' },
  { category: 'Courses', description: 'Biocoop', expectedIcon: BiocoopIcon, label: 'Biocoop' },
  { category: 'Courses', description: 'Action', expectedIcon: ActionStoreIcon, label: 'Action' },
  { category: 'Divers', description: 'Amazon', expectedIcon: AmazonIcon, label: 'Amazon' },
  { category: 'Vêtements', description: 'Commande Amazon Prime', expectedIcon: AmazonIcon, label: 'Amazon Prime' },
  { category: 'Courses', description: 'Boulangerie', expectedIcon: BoulangerieBadgeIcon, label: 'Boulangerie' },
  { category: 'Courses', description: 'Pâtisserie du Centre', expectedIcon: BoulangerieBadgeIcon, label: 'Pâtisserie' },
  { category: 'Courses', description: 'Paul', expectedIcon: BoulangerieBadgeIcon, label: 'Paul' },
  { category: 'Courses', description: 'Marie Blachère', expectedIcon: BoulangerieBadgeIcon, label: 'Marie Blachère' },
  { category: 'Courses', description: 'Boucherie', expectedIcon: BoucherieBadgeIcon, label: 'Boucherie' },
  { category: 'Courses', description: 'Pharmacie', expectedIcon: FirstAidIcon, label: 'Pharmacie' },
  { category: 'Courses', description: 'Courses', expectedIcon: GroceriesIcon, label: 'Courses generic fallback' },
];

for (const tc of testCasesStores) {
  const visual = resolveCategoryVisual(tc.category, [], tc.description, []);
  assert.strictEqual(visual.icon, tc.expectedIcon, `Failed for ${tc.label}: expected ${tc.expectedIcon.name}, got ${visual.icon.name}`);
  assert.strictEqual(visual.isFullBadge, tc.expectedIcon !== GroceriesIcon && tc.expectedIcon !== FirstAidIcon ? true : visual.isFullBadge, `Full badge check for ${tc.label}`);
  console.log(`✓ Store match verified: ${tc.label} -> ${tc.expectedIcon.name}`);
}

// 2. Tests Restaurants & Fast-Food
const testCasesRestaurants = [
  { category: 'Restaurant', description: "McDonald's", expectedIcon: McDonaldsIcon, label: "McDonald's" },
  { category: 'Restaurant', description: 'McDo', expectedIcon: McDonaldsIcon, label: 'McDo' },
  { category: 'Restaurant', description: 'Burger King', expectedIcon: BurgerKingIcon, label: 'Burger King' },
  { category: 'Restaurant', description: 'BK', expectedIcon: BurgerKingIcon, label: 'BK' },
  { category: 'Restaurant', description: 'KFC', expectedIcon: KfcIcon, label: 'KFC' },
  { category: 'Restaurant', description: 'Subway', expectedIcon: SubwayIcon, label: 'Subway' },
  { category: 'Restaurant', description: "Domino's Pizza", expectedIcon: DominosPizzaIcon, label: "Domino's Pizza" },
  { category: 'Restaurant', description: 'Pizzeria Bella', expectedIcon: PizzaBadgeIcon, label: 'Pizzeria Bella' },
  { category: 'Restaurant', description: 'Sushi Shop', expectedIcon: SushiRollIcon, label: 'Sushi Shop' },
  { category: 'Restaurant', description: 'Ramen Ya', expectedIcon: SushiRollIcon, label: 'Ramen Ya' },
  { category: 'Restaurant', description: 'Kebab Istanbul', expectedIcon: KebabWrapIcon, label: 'Kebab Istanbul' },
  { category: 'Restaurant', description: "O'Tacos", expectedIcon: KebabWrapIcon, label: "O'Tacos" },
  { category: 'Restaurant', description: 'Crêperie du Port', expectedIcon: CreperieBadgeIcon, label: 'Crêperie du Port' },
  { category: 'Restaurant', description: 'Starbucks', expectedIcon: StarbucksIcon, label: 'Starbucks' },
  { category: 'Restaurant', description: 'Café de la Gare', expectedIcon: CoffeeShopIcon, label: 'Café de la Gare' },
  { category: 'Restaurant', description: 'Pub irlandais', expectedIcon: BarPubIcon, label: 'Pub irlandais' },
  { category: 'Restaurant', description: 'Bar des Amis', expectedIcon: BarPubIcon, label: 'Bar des Amis' },
  { category: 'Restaurant', description: 'Bistrot Parisien', expectedIcon: BrasserieIcon, label: 'Bistrot Parisien' },
  { category: 'Restaurant', description: 'Brasserie Centrale', expectedIcon: BrasserieIcon, label: 'Brasserie Centrale' },
  { category: 'Restaurant', description: 'Buffalo Grill', expectedIcon: BrasserieIcon, label: 'Buffalo Grill' },
  { category: 'Divers', description: 'Ticket de cinéma', expectedIcon: CinemaBadgeIcon, label: 'Ticket de cinéma' },
  { category: 'Divers', description: 'UGC Ciné Cité', expectedIcon: CinemaBadgeIcon, label: 'UGC Ciné Cité' },
  { category: 'Loisirs', description: 'Pathé Gaumont', expectedIcon: CinemaBadgeIcon, label: 'Pathé Gaumont' },
  { category: 'Restaurant', description: '', expectedIcon: RestaurantIcon, label: 'Restaurant generic fallback' },
];

for (const tc of testCasesRestaurants) {
  const visual = resolveCategoryVisual(tc.category, [], tc.description, []);
  assert.strictEqual(visual.icon, tc.expectedIcon, `Failed for ${tc.label}: expected ${tc.expectedIcon.name}, got ${visual.icon.name}`);
  console.log(`✓ Restaurant match verified: ${tc.label} -> ${tc.expectedIcon.name}`);
}

// 3. Tests avec customIcons de catégorie configurées par l'utilisateur (cas réel de Vincent & Sophie)
const userFoyerCustomIcons = [
  {
    id: 'mapping_1789073755500_yp99h',
    name: 'groceries',
    type: 'svg' as const,
    color: 'bg-[#10b981]',
    category: 'Courses',
    createdAt: '2026-09-10T20:55:55.500Z'
  }
];

const carrefourWithCustom = resolveCategoryVisual('Courses', userFoyerCustomIcons, 'Carrefour', []);
assert.strictEqual(carrefourWithCustom.icon, CarrefourIcon, 'Carrefour must resolve to CarrefourIcon even when Courses has a custom icon');

const leclercWithCustom = resolveCategoryVisual('Courses', userFoyerCustomIcons, 'Leclerc', []);
assert.strictEqual(leclercWithCustom.icon, LeclercIcon, 'Leclerc must resolve to LeclercIcon even when Courses has a custom icon');

const lidlWithCustom = resolveCategoryVisual('Courses', userFoyerCustomIcons, 'Lidl', []);
assert.strictEqual(lidlWithCustom.icon, LidlIcon, 'Lidl must resolve to LidlIcon even when Courses has a custom icon');

const donatelloWithCustom = resolveCategoryVisual('Restaurant', userFoyerCustomIcons, 'Donatello pizzas', []);
assert.strictEqual(donatelloWithCustom.icon, PizzaBadgeIcon, 'Donatello pizzas must resolve to PizzaBadgeIcon');

const genericCoursesWithCustom = resolveCategoryVisual('Courses', userFoyerCustomIcons, 'Courses', []);
assert.strictEqual(genericCoursesWithCustom.icon, GroceriesIcon, 'Generic Courses must fallback to custom GroceriesIcon');
assert.strictEqual(genericCoursesWithCustom.color, 'bg-[#10b981]', 'Generic Courses must keep custom green color');

console.log('✓ Verified: Store and restaurant matching successfully takes precedence over generic category custom icons!');

// 4. Tests abonnements & services (SFR, Deezer, Netflix, Internet)
const testCasesSubscriptions = [
  { category: 'Dép. récurrentes', description: 'SFR', expectedIcon: SfrIcon, label: 'SFR' },
  { category: 'Dép. récurrentes', description: 'SFR Nathan', expectedIcon: SfrIcon, label: 'SFR Nathan' },
  { category: 'Dép. récurrentes', description: 'Deezer', expectedIcon: DeezerIcon, label: 'Deezer' },
  { category: 'Divers', description: 'Deezer Family', expectedIcon: DeezerIcon, label: 'Deezer Family' },
  { category: 'Dép. récurrentes', description: 'Netflix', expectedIcon: NetflixIcon, label: 'Netflix' },
  { category: 'Dép. récurrentes', description: 'Internet', expectedIcon: WifiIcon, label: 'Internet' },
  { category: 'Dép. récurrentes', description: 'Fibre Orange', expectedIcon: WifiIcon, label: 'Fibre' },
  { category: 'Divers', description: 'Box Wi-Fi', expectedIcon: WifiIcon, label: 'Box Wi-Fi' },
];

for (const tc of testCasesSubscriptions) {
  const visual = resolveCategoryVisual(tc.category, userFoyerCustomIcons, tc.description, []);
  assert.strictEqual(visual.icon, tc.expectedIcon, `Failed for ${tc.label}: expected ${tc.expectedIcon.name}, got ${visual.icon.name}`);
  assert.strictEqual(visual.isFullBadge, true, `Full badge check for ${tc.label}`);
  console.log(`✓ Subscription/service match verified: ${tc.label} -> ${tc.expectedIcon.name}`);
}

console.log('\nAll store, restaurant, and subscription icon resolution tests PASSED successfully!');
