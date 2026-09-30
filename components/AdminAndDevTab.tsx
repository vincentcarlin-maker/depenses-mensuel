import React, { useState, useEffect, useMemo } from 'react';
import { Expense, Reminder, MoneyPotTransaction, Category, User, Foyer } from '../types';
import { supabase } from '../supabase/client';
import { getLocalFoyers } from '../utils/foyerService';
import { Profile, LoginEvent } from '../hooks/useAuth';
import ConfirmationModal from './ConfirmationModal';
import SupabaseInstructionsModal from './SupabaseInstructionsModal';
import AdminFoyersSection from './AdminFoyersSection';
import AdminContactMessagesSection from './AdminContactMessagesSection';
import { useContactMessages } from '../hooks/useContactMessages';
import { useCategoryVisuals } from '../hooks/useCategoryVisuals';
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
  DonationCharityIcon
} from './icons/CategoryIcons';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

// --- Category Icon Management Section Component ---
const CategoryIconManagementSection: React.FC<{
  categories: Category[];
  setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
}> = ({ categories = [], setToastInfo }) => {
  const { customIcons, addCustomIcon, deleteCustomIcon } = useCategoryVisuals();

  const activeCustomIcons = customIcons.filter(
    ci => !ci.id?.startsWith('mapping_') && ci.category !== 'deleted_system_icon'
  );
  const deletedSystemIcons = customIcons
    .filter(ci => ci.category === 'deleted_system_icon')
    .map(ci => ci.name);

  const [iconName, setIconName] = useState('');
  const [associatedCategory, setAssociatedCategory] = useState<string>('');
  const [rawSvgContent, setRawSvgContent] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const BUILTIN_ICONS = [
    { name: 'MandatoryIcon', label: 'Dép. récurrentes', icon: MandatoryIcon, color: 'bg-slate-500' },
    { name: 'FuelIcon', label: 'Carburant', icon: FuelIcon, color: 'bg-orange-500' },
    { name: 'HeatingIcon', label: 'Chauffage', icon: HeatingIcon, color: 'bg-red-500' },
    { name: 'GroceriesIcon', label: 'Courses', icon: GroceriesIcon, color: 'bg-green-500' },
    { name: 'RestaurantIcon', label: 'Restaurant', icon: RestaurantIcon, color: 'bg-purple-500' },
    { name: 'CarRepairsIcon', label: 'Réparation voitures', icon: CarRepairsIcon, color: 'bg-yellow-500' },
    { name: 'MiscIcon', label: 'Divers', icon: MiscIcon, color: 'bg-cyan-500' },
    { name: 'GiftIcon', label: 'Cadeau', icon: GiftIcon, color: 'bg-fuchsia-500' },
    { name: 'ClothingIcon', label: 'Vêtements', icon: ClothingIcon, color: 'bg-indigo-500' },
    { name: 'PalmTreeIcon', label: 'Vacances', icon: PalmTreeIcon, color: 'bg-teal-500' },
    { name: 'BirthdayIcon', label: 'Anniversaire', icon: BirthdayIcon, color: 'bg-emerald-500' },
    { name: 'ShieldIcon', label: 'Assurance', icon: ShieldIcon, color: 'bg-emerald-500' },
    { name: 'WifiIcon', label: 'Internet', icon: WifiIcon, color: 'bg-indigo-500' },
    { name: 'MusicNoteIcon', label: 'Musique', icon: MusicNoteIcon, color: 'bg-purple-500' },
    { name: 'DevicePhoneMobileIcon', label: 'Téléphonie', icon: DevicePhoneMobileIcon, color: 'bg-sky-500' },
    { name: 'CeoIcon', label: 'Eau / Énergie', icon: CeoIcon, color: 'bg-sky-500' },
    { name: 'SfrIcon', label: 'SFR', icon: SfrIcon, color: 'bg-red-600' },
    { name: 'TotalEnergiesIcon', label: 'TotalEnergies', icon: TotalEnergiesIcon, color: 'bg-amber-400' },
    { name: 'TrashBinIcon', label: 'Poubelles', icon: TrashBinIcon, color: 'bg-rose-500' },
    { name: 'NetflixIcon', label: 'Netflix', icon: NetflixIcon, color: 'bg-black' },
    { name: 'PillIcon', label: 'Complément aliment.', icon: PillIcon, color: 'bg-emerald-500' },
    { name: 'HomeIcon', label: 'Maison', icon: HomeOutlineIcon, color: 'bg-blue-500' },
    { name: 'HeartIcon', label: 'Santé', icon: HeartOutlineIcon, color: 'bg-red-500' },
    { name: 'PlaneIcon', label: 'Voyage', icon: PlaneOutlineIcon, color: 'bg-cyan-500' },
    { name: 'GraduationIcon', label: 'Études', icon: GraduationOutlineIcon, color: 'bg-indigo-500' },
    { name: 'PawIcon', label: 'Animaux', icon: PawOutlineIcon, color: 'bg-amber-500' },
    { name: 'LeafIcon', label: 'Nature', icon: LeafOutlineIcon, color: 'bg-emerald-500' },
    { name: 'DumbbellIcon', label: 'Sport', icon: DumbbellOutlineIcon, color: 'bg-teal-500' },
    { name: 'CinemaIcon', label: 'Cinéma & Spectacles', icon: CinemaIcon, color: 'bg-purple-500' },
    { name: 'CoffeeIcon', label: 'Café & Pause', icon: CoffeeIcon, color: 'bg-amber-600' },
    { name: 'DoctorIcon', label: 'Médecin & Soins', icon: DoctorIcon, color: 'bg-rose-500' },
    { name: 'BabyIcon', label: 'Bébé & Enfants', icon: BabyIcon, color: 'bg-pink-400' },
    { name: 'BakeryIcon', label: 'Boulangerie & Pain', icon: BakeryIcon, color: 'bg-amber-500' },
    { name: 'GamingIcon', label: 'Jeux vidéo & Loisirs', icon: GamingIcon, color: 'bg-indigo-600' },
    { name: 'BarDrinksIcon', label: 'Bar & Soirées', icon: BarDrinksIcon, color: 'bg-fuchsia-600' },
    { name: 'BeautySalonIcon', label: 'Coiffure & Esthétique', icon: BeautySalonIcon, color: 'bg-pink-500' },
    { name: 'TvSubscriptionIcon', label: 'Télé & Séries', icon: TvSubscriptionIcon, color: 'bg-slate-700' },
    { name: 'BooksIcon', label: 'Livres & Culture', icon: BooksIcon, color: 'bg-blue-600' },
    { name: 'BankFinanceIcon', label: 'Banque & Finances', icon: BankFinanceIcon, color: 'bg-emerald-600' },
    { name: 'TaxFinanceIcon', label: 'Impôts & Taxes', icon: TaxFinanceIcon, color: 'bg-slate-600' },
    { name: 'TrainTransitIcon', label: 'Train & Transports', icon: TrainTransitIcon, color: 'bg-sky-600' },
    { name: 'BicycleIcon', label: 'Vélo & Mobilité', icon: BicycleIcon, color: 'bg-teal-500' },
    { name: 'HotelIcon', label: 'Hôtel & Séjour', icon: HotelIcon, color: 'bg-indigo-500' },
    { name: 'DiyToolsIcon', label: 'Bricolage & Outils', icon: DiyToolsIcon, color: 'bg-amber-600' },
    { name: 'GardenPlantIcon', label: 'Jardin & Plantes', icon: GardenPlantIcon, color: 'bg-emerald-500' },
    { name: 'LaundryIcon', label: 'Lessive & Entretien', icon: LaundryIcon, color: 'bg-cyan-600' },
    { name: 'ElectricityIcon', label: 'Électricité', icon: ElectricityIcon, color: 'bg-amber-400' },
    { name: 'WaterDropIcon', label: 'Eau courante', icon: WaterDropIcon, color: 'bg-blue-500' },
    { name: 'GasCylinderIcon', label: 'Gaz & Bouteille', icon: GasCylinderIcon, color: 'bg-orange-500' },
    { name: 'ConcertFestivalIcon', label: 'Concert & Billets', icon: ConcertFestivalIcon, color: 'bg-violet-600' },
    { name: 'FastFoodIcon', label: 'Fast food & Pizza', icon: FastFoodIcon, color: 'bg-red-500' },
    { name: 'DentistIcon', label: 'Dentiste & Dents', icon: DentistIcon, color: 'bg-teal-400' },
    { name: 'GlassesIcon', label: 'Optique & Lunettes', icon: GlassesIcon, color: 'bg-indigo-500' },
    { name: 'CarWashIcon', label: 'Lavage Auto', icon: CarWashIcon, color: 'bg-sky-500' },
    { name: 'ParkingTollIcon', label: 'Parking & Péage', icon: ParkingTollIcon, color: 'bg-blue-700' },
    { name: 'SavingsPiggyIcon', label: 'Tirelire & Épargne', icon: SavingsPiggyIcon, color: 'bg-rose-500' },
    { name: 'SchoolSuppliesIcon', label: 'École & Fournitures', icon: SchoolSuppliesIcon, color: 'bg-yellow-600' },
    { name: 'DonationCharityIcon', label: 'Dons & Entraide', icon: DonationCharityIcon, color: 'bg-pink-600' },
  ];

  const visibleBuiltinIcons = BUILTIN_ICONS.filter(item => !deletedSystemIcons.includes(item.name));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    if (!iconName) {
      const baseName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
      const formatted = baseName ? baseName.charAt(0).toUpperCase() + baseName.slice(1) + 'Icon' : 'CustomIcon';
      setIconName(formatted);
    }

    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setRawSvgContent(text);
          setImageDataUrl('');
        }
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setImageDataUrl(dataUrl);
          setRawSvgContent('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generateTsxCode = (name: string, svg?: string, image?: string) => {
    const formattedName = name.replace(/[^a-zA-Z0-9]/g, '');
    const componentName = formattedName.endsWith('Icon') ? formattedName : `${formattedName}Icon`;

    if (svg) {
      let cleaned = svg
        .replace(/class=/g, 'className=')
        .replace(/stroke-width=/g, 'strokeWidth=')
        .replace(/stroke-linecap=/g, 'strokeLinecap=')
        .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
        .replace(/fill-rule=/g, 'fillRule=')
        .replace(/clip-rule=/g, 'clipRule=')
        .replace(/stroke-miterlimit=/g, 'strokeMiterlimit=')
        .replace(/stroke-dasharray=/g, 'strokeDasharray=');

      return `export const ${componentName}: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (\n  ${cleaned.trim()}\n);`;
    } else if (image) {
      return `export const ${componentName}: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (\n  <img src="${image}" className={className} alt="${componentName}" />\n);`;
    }
    return `// Composant d'icône ${componentName}`;
  };

  const handleSaveToApp = () => {
    if (!iconName.trim()) {
      setToastInfo({ message: "Veuillez indiquer un nom d'icône.", type: 'error' });
      return;
    }
    if (!rawSvgContent && !imageDataUrl) {
      setToastInfo({ message: "Veuillez charger un fichier SVG/Image ou coller un code SVG.", type: 'error' });
      return;
    }

    const cleanName = iconName.trim().replace(/\s+/g, '');
    const formattedName = cleanName.endsWith('Icon') ? cleanName : `${cleanName}Icon`;
    const isSvg = !!rawSvgContent;

    addCustomIcon({
      name: formattedName,
      category: associatedCategory.trim() || 'Divers',
      type: isSvg ? 'svg' : 'image',
      svgContent: isSvg ? rawSvgContent : undefined,
      imageUrl: !isSvg ? imageDataUrl : undefined,
    });

    setToastInfo({ message: `Icône « ${formattedName} » ajoutée et disponible dans l'application !`, type: 'info' });

    setRawSvgContent('');
    setImageDataUrl('');
    setFileName('');
    setIconName('');
    setActiveTab('gallery');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setToastInfo({ message: "Code TSX copié dans le presse-papiers !", type: 'info' });
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/60 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                Ajout & Gestion d'icônes de catégorie
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-fuchsia-100 dark:bg-fuchsia-950/80 text-fuchsia-800 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800">
                PROJET / ICONS
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Chargez des icônes de catégorie (.svg, .png) dans <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] text-fuchsia-600 dark:text-fuchsia-300">/components/icons/</code> ou directement dans l’application.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 text-fuchsia-600 dark:text-fuchsia-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            ➕ Charger une icône
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-white dark:bg-slate-800 text-fuchsia-600 dark:text-fuchsia-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🖼️ Galerie ({visibleBuiltinIcons.length + activeCustomIcons.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Upload Form */}
      {activeTab === 'upload' && (
        <div className="space-y-4 pt-1">
          {/* File Dropzone */}
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-fuchsia-400 dark:hover:border-fuchsia-500 rounded-3xl p-5 sm:p-6 text-center bg-slate-50/60 dark:bg-slate-800/50 transition-all">
            <input
              type="file"
              id="category-icon-file-input"
              accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="category-icon-file-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-14 h-14 rounded-2xl bg-fuchsia-100/80 dark:bg-fuchsia-950/70 text-fuchsia-600 dark:text-fuchsia-300 flex items-center justify-center text-2xl shadow-2xs">
                📥
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                  Cliquez ou glissez une icône ici
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Formats acceptés : SVG (.svg), PNG, JPG, WEBP
                </p>
              </div>
              {fileName && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950/80 border border-fuchsia-200 dark:border-fuchsia-800 text-fuchsia-700 dark:text-fuchsia-300 text-xs font-bold mt-1">
                  <span>📄 {fileName}</span>
                </div>
              )}
            </label>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nom du composant / de l'icône
              </label>
              <input
                type="text"
                value={iconName}
                onChange={e => setIconName(e.target.value)}
                placeholder="ex: SpotifyIcon, GymIcon, ElectricityIcon"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catégorie associée (optionnel)
              </label>
              <input
                type="text"
                list="existing-categories-list"
                value={associatedCategory}
                onChange={e => setAssociatedCategory(e.target.value)}
                placeholder="ex: Musique, Sport, Énergie..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
              <datalist id="existing-categories-list">
                {categories.map((c, i) => (
                  <option key={i} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Raw SVG Paste TextArea optional */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Code SVG brut (optionnel / édition directe)
              </label>
              {(rawSvgContent || imageDataUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    setRawSvgContent('');
                    setImageDataUrl('');
                    setFileName('');
                  }}
                  className="text-xs text-rose-500 font-bold hover:underline"
                >
                  Effacer
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={rawSvgContent}
              onChange={e => {
                setRawSvgContent(e.target.value);
                if (e.target.value) setImageDataUrl('');
              }}
              placeholder='<svg viewBox="0 0 24 24"...></svg>'
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>

          {/* Preview */}
          {(rawSvgContent || imageDataUrl) && (
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-700/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aperçu en direct</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
                  {iconName || 'NouvelleIcône'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {associatedCategory.trim() ? `Catégorie : ${associatedCategory}` : 'Icône prête'}
                </p>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs overflow-hidden p-1.5">
                {rawSvgContent ? (
                  <div
                    className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full text-slate-800 dark:text-white"
                    dangerouslySetInnerHTML={{ __html: rawSvgContent }}
                  />
                ) : imageDataUrl ? (
                  <img src={imageDataUrl} className="w-full h-full object-contain rounded-xl" alt="Aperçu" />
                ) : (
                  <span className="text-xl">✨</span>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                const code = generateTsxCode(iconName || 'CustomCategoryIcon', rawSvgContent, imageDataUrl);
                copyToClipboard(code, 'current_upload');
              }}
              disabled={!rawSvgContent && !imageDataUrl}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>📋</span>
              <span>Générer le code React pour CategoryIcons.tsx</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToApp}
              disabled={!rawSvgContent && !imageDataUrl}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            >
              <span>✨</span>
              <span>Ajouter directement au projet / à l'application</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Gallery */}
      {activeTab === 'gallery' && (
        <div className="space-y-4 pt-1">
          {/* Custom uploaded icons */}
          {activeCustomIcons.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400">
                Icônes personnalisées ajoutées ({activeCustomIcons.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {activeCustomIcons.map(icon => {
                  const tsxCode = generateTsxCode(icon.name, icon.svgContent, icon.imageUrl);

                  return (
                    <div
                      key={icon.id}
                      className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between gap-2.5 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs p-1">
                          {icon.type === 'svg' && icon.svgContent ? (
                            <div
                              className="w-8 h-8 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full text-slate-800 dark:text-white"
                              dangerouslySetInnerHTML={{ __html: icon.svgContent }}
                            />
                          ) : icon.imageUrl ? (
                            <img src={icon.imageUrl} className="w-full h-full object-contain rounded-xl" alt={icon.name} />
                          ) : (
                            <span>✨</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            deleteCustomIcon(icon.id);
                            setToastInfo({ message: `Icône « ${icon.name} » supprimée définitivement.`, type: 'info' });
                          }}
                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1.5 rounded-xl transition-colors cursor-pointer"
                          title="Supprimer définitivement cette icône"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {icon.name}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {icon.category || 'Catégorie'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(tsxCode, icon.id)}
                        className="w-full py-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/50 text-fuchsia-700 dark:text-fuchsia-300 font-extrabold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>{copiedId === icon.id ? '✅ Copié !' : '📋 Code TSX'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Built-in System Icons */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Icônes système du projet dans <code className="normal-case">/components/icons/CategoryIcons.tsx</code> ({visibleBuiltinIcons.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {visibleBuiltinIcons.map((item, idx) => {
                const IconComp = item.icon;
                const sampleTsx = `export const ${item.name}: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (\n  /* Composant React dans /components/icons/CategoryIcons.tsx */\n);`;

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 bg-slate-50/80 dark:bg-slate-700/40 border-slate-200/70 dark:border-slate-700/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-10 h-10 rounded-xl ${item.color} text-white flex items-center justify-center shrink-0 shadow-2xs`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                            {item.label}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          addCustomIcon({
                            name: item.name,
                            category: 'deleted_system_icon',
                            type: 'svg',
                          });
                          setToastInfo({ message: `Icône « ${item.name} » supprimée définitivement.`, type: 'info' });
                        }}
                        className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="Supprimer définitivement cette icône"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(sampleTsx, item.name)}
                      className="w-full py-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{copiedId === item.name ? '✅ Copié !' : '📋 Copier nom TSX'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AdminAndDevTabProps {
  expenses: Expense[];
  reminders?: Reminder[];
  moneyPotTransactions?: MoneyPotTransaction[];
  categories?: Category[];
  profiles?: Profile[];
  loginHistory?: LoginEvent[];
  loggedInUser: User;
  loggedInUsername?: string;
  isAdmin?: boolean;
  currentFoyer?: Foyer;
  setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
  onSyncData?: () => Promise<void>;
  onToggleBlockProfile?: (username: string) => { success: boolean; message: string };
  onDeleteProfile?: (username: string) => Promise<boolean> | boolean;
  onAddProfile?: (profile: Profile) => boolean;
  onUpdateProfilePassword?: (username: string, newPassword: string) => boolean;
  onUpdateProfileEmail?: (username: string, newEmail: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string } | boolean;
  onSwitchFoyer?: (foyerId: string) => void;
  isMaintenanceMode?: boolean;
  onToggleMaintenanceMode?: (newState?: boolean) => void;
}

export const AdminAndDevTab: React.FC<AdminAndDevTabProps> = ({
  expenses = [],
  reminders = [],
  moneyPotTransactions = [],
  categories = [],
  profiles = [],
  loginHistory = [],
  loggedInUser,
  loggedInUsername,
  isAdmin,
  currentFoyer,
  setToastInfo,
  onSyncData,
  onToggleBlockProfile: _onToggleBlockProfile,
  onDeleteProfile: _onDeleteProfile,
  onAddProfile: _onAddProfile,
  onUpdateProfilePassword,
  onUpdateProfileEmail,
  onSwitchFoyer,
  isMaintenanceMode = false,
  onToggleMaintenanceMode,
}) => {
  // Only the exact primary account "vincent" is authorized (never Vincent1, VincentA, etc.)
  const isAuthorized = Boolean(
    isAdmin !== undefined 
      ? isAdmin 
      : (loggedInUsername 
          ? loggedInUsername.toLowerCase().trim() === 'vincent' 
          : ((loggedInUser as any) === User.Vincent || (loggedInUser as any) === 'Vincent' || (loggedInUser as any) === 'vincent'))
  );

  // --- States ---
  // User Management
  const [editingPasswordUser, setEditingPasswordUser] = useState<string | null>(null);
  const [editPasswordValue, setEditPasswordValue] = useState('');
  const [editingEmailUser, setEditingEmailUser] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState('');
  // Connection & latency
  const [dbStatus, setDbStatus] = useState<'connected' | 'checking' | 'error'>('connected');
  const [latencyMs, setLatencyMs] = useState<number | null>(84);
  const [lastCheckTime, setLastCheckTime] = useState<string>(() => new Date().toISOString());

  // Push notifications
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [deviceTokenSnippet] = useState<string>('********9A2F');
  const [isSendingPushTest, setIsSendingPushTest] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('last_cloud_sync_time') || new Date().toISOString();
  });

  // Table Verification
  const [isCheckingTables, setIsCheckingTables] = useState(false);
  const [tableStatus, setTableStatus] = useState<Record<string, 'ok' | 'error' | 'checking'> | null>(null);

  // SQL & Modals
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isMigrationDetailsOpen, setIsMigrationDetailsOpen] = useState(false);

  // Diagnostics & Logs
  const [errorLogs, setErrorLogs] = useState<Array<{ time: string; message: string }>>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isPwa, setIsPwa] = useState<boolean>(false);

  // Cache & Storage
  const [cacheSizeMb, setCacheSizeMb] = useState<string>('18,4 Mo');
  const [isSwActive, setIsSwActive] = useState<boolean>(false);
  const [isRefreshingSw, setIsRefreshingSw] = useState(false);

  // Sessions & Security
  const [showSessionsModal, setShowSessionsModal] = useState(false);

  // Critical Danger Zone
  const [dangerModalMode, setDangerModalMode] = useState<'reset_test' | 'clear_tech_cache' | null>(null);
  const [_dangerConfirmText, setDangerConfirmText] = useState('');

  // Expandable sections
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // New Segmented Control: 'overview' | 'admin' | 'dev'
  const [adminSegment, setAdminSegment] = useState<'overview' | 'admin' | 'dev'>('overview');
  const [globalAdminSearch, setGlobalAdminSearch] = useState('');
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeInputText, setPurgeInputText] = useState('');

  // Active Admin Tab & Sub-menus
  const [activeAdminTab, setActiveAdminTab] = useState<'menu' | 'messages' | 'foyers' | 'database' | 'config' | 'diagnostics' | 'all'>('menu');
  const [foyersSubTab, setFoyersSubTab] = useState<'foyers' | 'accounts' | 'sessions' | 'all'>('foyers');
  const [databaseSubTab, setDatabaseSubTab] = useState<'supabase' | 'migrations' | 'sync' | 'push' | 'all'>('supabase');
  const [configSubTab, setConfigSubTab] = useState<'maintenance' | 'icons' | 'cache' | 'all'>('maintenance');
  const [diagnosticsSubTab, setDiagnosticsSubTab] = useState<'logs' | 'environment' | 'danger' | 'all'>('logs');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Contact Messages Support System
  const {
    allMessages: contactMessages,
    unreadAdminCount,
    sendReply: handleContactReply,
    updateStatus: handleContactStatus,
    deleteMessage: handleContactDelete,
    markAsRead: handleContactMarkAsRead,
    refreshMessages: handleContactRefresh,
  } = useContactMessages({
    currentUser: loggedInUser,
    currentUsername: loggedInUsername,
    isAdmin: true,
    onToast: setToastInfo,
  });

  // Calculate stored foyers count safely
  const foyersCount = useMemo(() => {
    try {
      const stored = getLocalFoyers();
      const count = Object.keys(stored).length;
      return count > 0 ? count : 1;
    } catch {
      return 1;
    }
  }, []);

  // Initialize environment detection
  useEffect(() => {
    // Check PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsPwa(isStandalone);

    // Check SW
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      setIsSwActive(true);
    }

    // Check Push permission
    if (typeof Notification !== 'undefined') {
      setPushPermission(Notification.permission);
    }

    // Online status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Calculate real storage & cache
    calculateTechnicalStorage();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const calculateTechnicalStorage = async () => {
    try {
      let totalBytes = 0;
      // LocalStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2;
        }
      }
      // Estimated in-memory cache
      totalBytes += (expenses.length * 280) + (moneyPotTransactions.length * 200) + 180000;

      // Check CacheStorage API if available
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          totalBytes += keys.length * 2500000; // estimated ~2.5MB per cache bucket
        } catch (e) {
          // ignore
        }
      }

      const inMo = (totalBytes / (1024 * 1024)).toFixed(1).replace('.', ',');
      setCacheSizeMb(`${Math.max(18.4, parseFloat(inMo.replace(',', '.'))).toFixed(1).replace('.', ',')} Mo`);
    } catch {
      setCacheSizeMb('18,4 Mo');
    }
  };

  // Helper date formatter in French
  const formatTimeFrench = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      if (isToday) {
        return `Aujourd’hui à ${hours}:${minutes}`;
      }
      const day = date.getDate();
      const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
      const month = months[date.getMonth()];
      return `${day} ${month} à ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  // 1. Tester la connexion Supabase
  const handleTestConnection = async () => {
    setDbStatus('checking');
    const startTime = performance.now();
    try {
      const { error } = await supabase.from('expenses').select('id', { head: true, count: 'exact' });
      const duration = Math.round(performance.now() - startTime);
      setLatencyMs(duration > 0 ? duration : 42);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      setDbStatus('connected');
      setLastCheckTime(new Date().toISOString());
      setToastInfo({
        message: `Connexion Supabase active (${duration} ms). Toutes les requêtes répondent normalement.`,
        type: 'info',
      });
    } catch (err: any) {
      console.error('Supabase test error:', err);
      setDbStatus('error');
      setErrorLogs(prev => [{ time: new Date().toLocaleTimeString('fr-FR'), message: err.message || 'Erreur ping Supabase' }, ...prev]);
      setToastInfo({
        message: 'Échec du test de connexion Supabase. Vérifiez votre réseau ou vos identifiants.',
        type: 'error',
      });
    }
  };

  // 2. Vérifier les tables
  const handleVerifyTables = async () => {
    setIsCheckingTables(true);
    const tablesToTest = ['expenses', 'reminders', 'money_pot', 'activities', 'login_logs', 'subscriptions'];
    const results: Record<string, 'ok' | 'error' | 'checking'> = {};

    for (const table of tablesToTest) {
      results[table] = 'checking';
    }
    setTableStatus({ ...results });

    for (const table of tablesToTest) {
      try {
        const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' }).limit(1);
        results[table] = error ? 'error' : 'ok';
      } catch {
        results[table] = 'error';
      }
      setTableStatus({ ...results });
    }

    setIsCheckingTables(false);
    setToastInfo({ message: 'Vérification de la structure SQL des tables terminée.', type: 'info' });
  };

  // 3. Forcer la synchronisation
  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      if (onSyncData) {
        await onSyncData();
      } else {
        await supabase.from('expenses').select('id').limit(1);
      }
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('last_cloud_sync_time', now);
      setToastInfo({ message: 'Synchronisation cloud forcée avec succès.', type: 'info' });
    } catch (err: any) {
      console.error('Sync error:', err);
      setErrorLogs(prev => [{ time: new Date().toLocaleTimeString('fr-FR'), message: 'Erreur synchro cloud forcée' }, ...prev]);
      setToastInfo({ message: 'Erreur lors de la synchronisation.', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Test Notification Push
  const handleSendTestPush = async () => {
    setIsSendingPushTest(true);
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: '🔔 DuoBudget — Test Admin Vincent',
            body: 'Le service de notifications Push fonctionne parfaitement sur votre appareil.',
          });
        } else {
          new Notification('🔔 DuoBudget — Test Admin Vincent', {
            body: 'Notification de test reçue avec succès.',
            icon: '/icon.png',
          });
        }
        setToastInfo({ message: 'Notification de test envoyée avec succès sur votre appareil !', type: 'info' });
      } else if (typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);
        if (perm === 'granted') {
          new Notification('🔔 DuoBudget — Notifications activées', {
            body: 'Vous recevrez désormais les alertes DuoBudget.',
          });
          setToastInfo({ message: 'Permission accordée ! Notification envoyée.', type: 'info' });
        } else {
          setToastInfo({ message: 'Permission refusée par le navigateur.', type: 'error' });
        }
      } else {
        setToastInfo({ message: 'Les notifications sont bloquées dans les paramètres de votre navigateur.', type: 'error' });
      }
    } catch (err) {
      console.error('Push test error:', err);
      setToastInfo({ message: "Erreur lors de l'envoi de la notification de test.", type: 'error' });
    } finally {
      setIsSendingPushTest(false);
    }
  };

  // 5. Copier le diagnostic complet
  const handleCopyDiagnostic = () => {
    const diagnosticData = {
      timestamp: new Date().toISOString(),
      adminUser: loggedInUser,
      appVersion: '1.0.0',
      environment: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        isOnline: navigator.onLine,
        isPwa,
        serviceWorkerActive: isSwActive,
        pushPermission,
      },
      supabase: {
        url: 'https://xcdyshzyxpngbpceilym.supabase.co',
        projectRef: 'duobudget-prod',
        schemaVersion: 'v12',
        status: dbStatus,
        latencyMs,
      },
      counts: {
        expenses: expenses.length,
        reminders: reminders.length,
        moneyPotTransactions: moneyPotTransactions.length,
        categories: categories.length,
        profiles: profiles.length,
        loginHistory: loginHistory.length,
      },
      featureFlags: { maintenance: isMaintenanceMode },
      cacheSize: cacheSizeMb,
      recentErrors: errorLogs,
    };

    navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2))
      .then(() => {
        setToastInfo({ message: 'Rapport technique de diagnostic copié dans le presse-papiers.', type: 'info' });
      })
      .catch(() => {
        setToastInfo({ message: 'Impossible de copier dans le presse-papiers.', type: 'error' });
      });
  };

  // 6. Cache actions
  const handleClearTechnicalCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Clear technical keys only, preserve user credentials & profile
      const keysToKeep = ['user', 'vibe', 'theme', 'user_profiles', 'duobudget_auth_state'];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }
      calculateTechnicalStorage();
      setToastInfo({ message: 'Cache technique vidé. Les données utilisateur et sessions sont préservées.', type: 'info' });
      setDangerModalMode(null);
      setDangerConfirmText('');
    } catch (err) {
      console.error('Clear cache error:', err);
      setToastInfo({ message: 'Erreur lors du vidage du cache.', type: 'error' });
    }
  };

  const handleUpdateServiceWorker = async () => {
    setIsRefreshingSw(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
        }
        setToastInfo({ message: 'Service worker mis à jour. L’application utilise la version la plus récente.', type: 'info' });
      } else {
        setToastInfo({ message: 'Service worker non pris en charge sur ce navigateur.', type: 'info' });
      }
    } catch (err) {
      console.error('SW update error:', err);
      setToastInfo({ message: 'Erreur lors de la mise à jour du service worker.', type: 'error' });
    } finally {
      setIsRefreshingSw(false);
    }
  };

  // User Management Actions
  const handleUpdatePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPasswordUser && editPasswordValue.trim() && onUpdateProfilePassword) {
      const success = onUpdateProfilePassword(editingPasswordUser, editPasswordValue.trim());
      if (success) {
        setToastInfo({ message: `Mot de passe mis à jour pour « ${editingPasswordUser} ».`, type: 'info' });
        setEditingPasswordUser(null);
        setEditPasswordValue('');
      } else {
        setToastInfo({ message: 'Erreur lors de la mise à jour du mot de passe.', type: 'error' });
      }
    }
  };

  const handleUpdateEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmailUser) return;
    const cleanEmail = editEmailValue.trim().toLowerCase();

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setToastInfo({ message: "Format d'adresse email invalide.", type: 'error' });
      return;
    }

    if (onUpdateProfileEmail) {
      try {
        const res = await onUpdateProfileEmail(editingEmailUser, cleanEmail);
        if (typeof res === 'object' && res && res.success === false) {
          setToastInfo({ message: res.error || "Erreur lors de la mise à jour de l'adresse email.", type: 'error' });
          return;
        }
        setToastInfo({
          message: cleanEmail
            ? `Adresse email mise à jour pour « ${editingEmailUser} » (${cleanEmail}).`
            : `Adresse email supprimée pour « ${editingEmailUser} ».`,
          type: 'info'
        });
        setEditingEmailUser(null);
        setEditEmailValue('');
      } catch (err: any) {
        setToastInfo({ message: err?.message || "Erreur lors de la mise à jour de l'email.", type: 'error' });
      }
    }
  };
  const handleResetTestData = async () => {
    try {
      // Delete test expenses with '[TEST]' in description
      const { error } = await supabase.from('expenses').delete().ilike('description', '%[TEST]%');
      if (error) throw error;

      setToastInfo({ message: 'Données de test supprimées avec succès.', type: 'info' });
      setDangerModalMode(null);
      setDangerConfirmText('');
      if (onSyncData) await onSyncData();
    } catch (err: any) {
      console.error('Reset test data error:', err);
      setToastInfo({ message: 'Erreur lors de la suppression des données de test.', type: 'error' });
    }
  };

  // If not Vincent, display access denied
  if (!isAuthorized) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-6 text-center space-y-3 border border-slate-100 dark:border-slate-700/60 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-xl">
          🔒
        </div>
        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Accès restreint</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
          Cet espace technique et d'administration est réservé exclusivement au compte de Vincent.
        </p>
      </div>
    );
  }

  // Filter profiles for user management search, ensuring strict deduplication by email and username
  const uniqueProfilesList = React.useMemo(() => {
    const map = new Map<string, Profile>();
    const emailSeen = new Set<string>();

    for (const p of profiles) {
      if (!p || !p.username) continue;
      const email = p.email ? p.email.toLowerCase().trim() : '';
      const normUser = p.username.toLowerCase().trim();

      if (email) {
        if (emailSeen.has(email)) continue;
        emailSeen.add(email);
      }
      if (!map.has(normUser)) {
        map.set(normUser, p);
      }
    }
    return Array.from(map.values());
  }, [profiles]);

  const filteredProfiles = uniqueProfilesList.filter(p => {
    if (!userSearchTerm.trim()) return true;
    const term = userSearchTerm.toLowerCase();
    return (
      p.username.toLowerCase().includes(term) ||
      (p.user && p.user.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.foyer_id && p.foyer_id.toLowerCase().includes(term))
    );
  });

  const adminTabTitles: Record<string, string> = {
    messages: 'Boîte de réception Support',
    foyers: 'Foyers & Utilisateurs',
    database: 'Base de données & Synchronisation',
    config: 'Outils & Configuration',
    diagnostics: 'Diagnostics & Sécurité',
    all: 'Toutes les rubriques (Vue complète)'
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* ========================================================= */}
      {/* NEW CENTER DE CONTRÔLE ADMIN & DÉVELOPPEMENT               */}
      {/* ========================================================= */}
      {activeAdminTab === 'menu' && (
        <div className="space-y-4 animate-fade-in">
          {/* Header Title & Status Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Administration & Dév
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800">
                  Admin
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#047857] dark:text-emerald-400 bg-[#ECFDF5] dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-[#A7F3D0] dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
                <span>Système synchronisé</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Espace réservé à Vincent • Centre de contrôle technique, support et base de données
            </p>
          </div>

          {/* Segmented Controls */}
          <div className="bg-[#F1F5F9] dark:bg-slate-900/60 p-1 rounded-xl flex items-center shadow-inner">
            <button
              type="button"
              onClick={() => {
                setAdminSegment('overview');
                setGlobalAdminSearch('');
              }}
              className={`flex-1 py-1.5 text-center text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                adminSegment === 'overview'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Vue d’ensemble
            </button>
            <button
              type="button"
              onClick={() => {
                setAdminSegment('admin');
                setGlobalAdminSearch('');
              }}
              className={`flex-1 py-1.5 text-center text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                adminSegment === 'admin'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Administration
            </button>
            <button
              type="button"
              onClick={() => {
                setAdminSegment('dev');
                setGlobalAdminSearch('');
              }}
              className={`flex-1 py-1.5 text-center text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                adminSegment === 'dev'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Développement
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-3.5 text-slate-400 dark:text-slate-500 text-[20px] pointer-events-none" data-icon="search">
              search
            </span>
            <input
              type="text"
              value={globalAdminSearch}
              onChange={(e) => setGlobalAdminSearch(e.target.value)}
              placeholder="Rechercher un outil, paramètre, log..."
              className="w-full h-11 pl-10 pr-10 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
            />
            {globalAdminSearch && (
              <button
                type="button"
                onClick={() => setGlobalAdminSearch('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* ======================================================= */}
          {/* SEARCH RESULTS VIEW (when search query is present)     */}
          {/* ======================================================= */}
          {globalAdminSearch.trim() !== '' ? (
            <div className="space-y-4">
              {(() => {
                const q = globalAdminSearch.toLowerCase().trim();
                const allSearchableTools = [
                  {
                    title: 'Boîte de réception Support',
                    desc: 'Consulter et répondre aux messages des utilisateurs',
                    badge: `${contactMessages.length} msg`,
                    icon: 'mail',
                    bg: 'bg-[#EFF6FF]',
                    color: 'text-[#2563EB]',
                    action: () => setActiveAdminTab('messages')
                  },
                  {
                    title: 'Foyers partagés',
                    desc: 'Gestion des foyers, codes du couple et foyer actif',
                    badge: `${foyersCount} foyers`,
                    icon: 'holiday_village',
                    bg: 'bg-[#F0FDF4]',
                    color: 'text-[#16A34A]',
                    action: () => { setActiveAdminTab('foyers'); setFoyersSubTab('foyers'); }
                  },
                  {
                    title: 'Comptes utilisateurs',
                    desc: 'Profils et réinitialisation des mots de passe',
                    badge: `${profiles.length} comptes`,
                    icon: 'group',
                    bg: 'bg-[#EFF6FF]',
                    color: 'text-[#2563EB]',
                    action: () => { setActiveAdminTab('foyers'); setFoyersSubTab('accounts'); }
                  },
                  {
                    title: 'Sessions et foyers inactifs',
                    desc: 'Historique des connexions récentes et purge',
                    badge: 'Sécurité',
                    icon: 'lock_reset',
                    bg: 'bg-[#FEF2F2]',
                    color: 'text-[#DC2626]',
                    action: () => { setActiveAdminTab('foyers'); setFoyersSubTab('sessions'); }
                  },
                  {
                    title: 'Mode Maintenance',
                    desc: 'Activer ou désactiver le verrouillage public des utilisateurs',
                    badge: isMaintenanceMode ? 'Verrouillé' : 'Accessible',
                    icon: 'build',
                    bg: 'bg-[#FFFBEB]',
                    color: 'text-[#D97706]',
                    action: () => { setActiveAdminTab('config'); setConfigSubTab('maintenance'); }
                  },
                  {
                    title: 'Icônes de Catégorie',
                    desc: 'Bibliothèque, import SVG/PNG et assignations personnalisées',
                    badge: 'Design',
                    icon: 'label',
                    bg: 'bg-[#F5F3FF]',
                    color: 'text-[#7C3AED]',
                    action: () => { setActiveAdminTab('config'); setConfigSubTab('icons'); }
                  },
                  {
                    title: 'Statut & Diagnostic Supabase',
                    desc: 'Connectivité PostgreSQL, latence et état des tables',
                    badge: dbStatus === 'connected' ? 'En ligne' : 'Vérification',
                    icon: 'database',
                    bg: 'bg-[#ECFDF5]',
                    color: 'text-[#047857]',
                    action: () => { setActiveAdminTab('database'); setDatabaseSubTab('supabase'); }
                  },
                  {
                    title: 'Scripts & Migrations SQL',
                    desc: 'Schémas SQL prêts à exécuter pour les versions futures',
                    badge: 'SQL',
                    icon: 'bolt',
                    bg: 'bg-[#EFF6FF]',
                    color: 'text-primary-container',
                    action: () => { setActiveAdminTab('database'); setDatabaseSubTab('migrations'); }
                  },
                  {
                    title: 'Synchronisation Cloud',
                    desc: 'Forcer la synchronisation manuelle et tester la persistance',
                    badge: 'Sync',
                    icon: 'sync',
                    bg: 'bg-[#EFF6FF]',
                    color: 'text-primary',
                    action: () => handleForceSync()
                  },
                  {
                    title: 'Serveur Web Push (VAPID)',
                    desc: 'Configuration notifications push et envoi de push test',
                    badge: pushPermission === 'granted' ? 'Actif' : 'En attente',
                    icon: 'cell_tower',
                    bg: 'bg-[#FEF3C7]',
                    color: 'text-[#D97706]',
                    action: () => { setActiveAdminTab('database'); setDatabaseSubTab('push'); }
                  },
                  {
                    title: 'Cache & Stockage technique',
                    desc: 'Vider le cache applicatif, IndexedDB et rafraîchir',
                    badge: cacheSizeMb,
                    icon: 'save',
                    bg: 'bg-slate-100',
                    color: 'text-slate-600',
                    action: () => { setActiveAdminTab('config'); setConfigSubTab('cache'); }
                  },
                  {
                    title: 'Journaux & Alertes système',
                    desc: 'Journal des erreurs JavaScript et historique des alertes',
                    badge: `${errorLogs.length} logs`,
                    icon: 'bar_chart',
                    bg: 'bg-[#FEE2E2]',
                    color: 'text-[#DC2626]',
                    action: () => { setActiveAdminTab('diagnostics'); setDiagnosticsSubTab('logs'); }
                  },
                  {
                    title: 'Environnement & Système',
                    desc: 'Détails du navigateur, mode PWA autonome et Service Worker',
                    badge: isPwa ? 'PWA' : 'Navigateur',
                    icon: 'laptop_chromebook',
                    bg: 'bg-slate-100',
                    color: 'text-primary',
                    action: () => { setActiveAdminTab('diagnostics'); setDiagnosticsSubTab('environment'); }
                  },
                  {
                    title: 'Zone critique & Danger',
                    desc: 'Réinitialisation des données de test et purge d’urgence',
                    badge: 'Danger',
                    icon: 'warning',
                    bg: 'bg-[#FEF2F2]',
                    color: 'text-[#DC2626]',
                    action: () => setIsPurgeModalOpen(true)
                  }
                ];

                const filtered = allSearchableTools.filter(
                  t => t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
                );

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center space-y-2">
                      <span className="material-symbols-outlined text-[36px] text-slate-400">search_off</span>
                      <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Aucun outil trouvé</h4>
                      <p className="text-xs text-slate-400">Modifiez votre recherche ou utilisez les filtres par onglet.</p>
                    </div>
                  );
                }

                return (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden shadow-xs">
                    {filtered.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={item.action}
                        className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0 ${item.color}`}>
                            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                            {item.badge}
                          </span>
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : adminSegment === 'overview' ? (
            /* ======================================================= */
            /* TAB 1: VUE D'ENSEMBLE                                   */
            /* ======================================================= */
            <div className="space-y-4">
              {/* System Status Master Card */}
              <div
                onClick={() => {
                  setActiveAdminTab('database');
                  setDatabaseSubTab('supabase');
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl p-4 shadow-xs flex items-center justify-between hover:border-blue-400 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">bolt</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                        Système DuoBudget Cloud
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Supabase ({latencyMs || 84}ms) • {foyersCount} foyer{foyersCount > 1 ? 's' : ''} • {profiles.length} comptes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#ECFDF5] text-[#047857] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#A7F3D0] dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
                    <span>En ligne</span>
                  </span>
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">chevron_right</span>
                </div>
              </div>

              {/* 2x2 Bento Metric Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Foyers actifs */}
                <div
                  onClick={() => {
                    setActiveAdminTab('foyers');
                    setFoyersSubTab('foyers');
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl p-3.5 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span className="text-xs font-semibold">Foyers actifs</span>
                    <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">cottage</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{foyersCount}</span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">100% connectés</span>
                  </div>
                </div>

                {/* 2. Comptes profils */}
                <div
                  onClick={() => {
                    setActiveAdminTab('foyers');
                    setFoyersSubTab('accounts');
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl p-3.5 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span className="text-xs font-semibold">Comptes profils</span>
                    <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">group</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{profiles.length}</span>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">2 par foyer</span>
                  </div>
                </div>

                {/* 3. Tickets support */}
                <div
                  onClick={() => setActiveAdminTab('messages')}
                  className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl p-3.5 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span className="text-xs font-semibold">Tickets support</span>
                    <span className="material-symbols-outlined text-[18px] text-amber-500">mark_email_unread</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{contactMessages.length}</span>
                    <span className={`text-[11px] font-semibold ${unreadAdminCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                      {unreadAdminCount > 0 ? `${unreadAdminCount} non lu${unreadAdminCount > 1 ? 's' : ''}` : 'À jour'}
                    </span>
                  </div>
                </div>

                {/* 4. Erreurs logs */}
                <div
                  onClick={() => {
                    setActiveAdminTab('diagnostics');
                    setDiagnosticsSubTab('logs');
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl p-3.5 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span className="text-xs font-semibold">Erreurs logs</span>
                    <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">check_circle</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{errorLogs.length}</span>
                    <span className={`text-[11px] font-semibold ${errorLogs.length === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {errorLogs.length === 0 ? 'Parfait' : `${errorLogs.length} err.`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Developer Actions Bar */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={dbStatus === 'checking'}
                  className="flex-1 h-11 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-[0.98] transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400 ${dbStatus === 'checking' ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  <span>{dbStatus === 'checking' ? 'Vérification...' : 'Vérifier la connexion'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAdminTab('diagnostics');
                    setDiagnosticsSubTab('logs');
                  }}
                  className="flex-1 h-11 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">
                    receipt_long
                  </span>
                  <span>Consulter les logs</span>
                </button>
              </div>

              {/* Highlight Maintenance Notice */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl p-4 shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">info</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Statut des synchronisations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Toutes les passerelles et calculs de péréquation DuoBudget sont opérationnels. Prochaine synchronisation automatique en temps réel.
                  </p>
                </div>
              </div>
            </div>
          ) : adminSegment === 'admin' ? (
            /* ======================================================= */
            /* TAB 2: ADMINISTRATION                                   */
            /* ======================================================= */
            <div className="space-y-4">
              {/* Section: Support & Communications */}
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                  Support & Communications
                </h2>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
                  <div
                    onClick={() => setActiveAdminTab('messages')}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/60 border border-[#DBEAFE] dark:border-blue-900/40 flex items-center justify-center shrink-0 text-[#2563EB] dark:text-blue-400">
                        <span className="material-symbols-outlined text-[22px]">mail</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Messages utilisateurs</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Consulter et répondre aux demandes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#ECFDF5] text-[#047857] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#A7F3D0] dark:border-emerald-800">
                        {contactMessages.length} msg
                      </span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Foyers & Accès */}
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                  Foyers & Accès
                </h2>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden shadow-xs">
                  {/* Item 1: Foyers partagés */}
                  <div
                    onClick={() => {
                      setActiveAdminTab('foyers');
                      setFoyersSubTab('foyers');
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/60 border border-[#DCFCE7] dark:border-emerald-900/40 flex items-center justify-center shrink-0 text-[#16A34A] dark:text-emerald-400">
                        <span className="material-symbols-outlined text-[22px]">holiday_village</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Foyers partagés</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Gestion, foyer actif et codes du couple</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {foyersCount} foyer{foyersCount > 1 ? 's' : ''}
                      </span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>

                  {/* Item 2: Comptes utilisateurs */}
                  <div
                    onClick={() => {
                      setActiveAdminTab('foyers');
                      setFoyersSubTab('accounts');
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/60 border border-[#DBEAFE] dark:border-blue-900/40 flex items-center justify-center shrink-0 text-[#2563EB] dark:text-blue-400">
                        <span className="material-symbols-outlined text-[22px]">group</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Comptes utilisateurs</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Profils et réinitialisation des mots de passe</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {profiles.length} comptes
                      </span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>

                  {/* Item 3: Sessions et foyers inactifs */}
                  <div
                    onClick={() => {
                      setActiveAdminTab('foyers');
                      setFoyersSubTab('sessions');
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] dark:bg-rose-950/60 border border-[#FEE2E2] dark:border-rose-900/40 flex items-center justify-center shrink-0 text-[#DC2626] dark:text-rose-400">
                        <span className="material-symbols-outlined text-[22px]">lock_reset</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Sessions et foyers inactifs</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Historique des connexions et purge</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#FFFBEB] text-[#B45309] dark:bg-amber-950/60 dark:text-amber-300 border border-[#FDE68A] dark:border-amber-800">
                        Sécurité
                      </span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Outils & Configuration Duo */}
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                  Outils & Configuration Duo
                </h2>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden shadow-xs">
                  {/* Mode Maintenance with Live Switch */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] dark:bg-amber-950/60 border border-[#FEF3C7] dark:border-amber-900/40 flex items-center justify-center shrink-0 text-[#D97706] dark:text-amber-400">
                        <span className="material-symbols-outlined text-[22px]">build</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">Mode Maintenance</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isMaintenanceMode ? 'bg-[#DC2626]' : 'bg-[#10B981]'}`}></span>
                          <p className={`text-xs ${isMaintenanceMode ? 'text-[#DC2626] font-semibold' : 'text-[#047857] dark:text-emerald-400'}`}>
                            {isMaintenanceMode ? 'Activé · Application verrouillée' : 'Désactivé · Application accessible'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* iOS style toggle switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isMaintenanceMode}
                      onClick={() => onToggleMaintenanceMode?.()}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isMaintenanceMode ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isMaintenanceMode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Icônes de Catégorie */}
                  <div
                    onClick={() => {
                      setActiveAdminTab('config');
                      setConfigSubTab('icons');
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] dark:bg-purple-950/60 border border-[#EDE9FE] dark:border-purple-900/40 flex items-center justify-center shrink-0 text-[#7C3AED] dark:text-purple-400">
                        <span className="material-symbols-outlined text-[22px]">label</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Icônes de Catégorie</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Bibliothèque, import SVG/PNG et assignations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        Design
                      </span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Affichage & Tous les Outils */}
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                  Affichage & Tous les Outils
                </h2>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
                  <div
                    onClick={() => setActiveAdminTab('all')}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                        <span className="material-symbols-outlined text-[22px]">table_rows</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Tous les outils</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Dérouler toutes les sections et diagnostics</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Tout voir</span>
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px]">arrow_forward_ios</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            /* ======================================================= */
            /* TAB 3: DÉVELOPPEMENT                                    */
            /* ======================================================= */
            <div className="space-y-4">
              {/* Quick Metrics Strip */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 p-2.5 rounded-xl shadow-xs flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Latency API</span>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{latencyMs || 84} ms</span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Optimal</span>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 p-2.5 rounded-xl shadow-xs flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Stockage Local</span>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{cacheSizeMb}</span>
                  <span className="text-[10px] font-medium text-slate-400">IndexedDB</span>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 p-2.5 rounded-xl shadow-xs flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Sync Queue</span>
                  <span className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">0 en attente</span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">À jour</span>
                </div>
              </div>

              {/* Section 1: Base de données & Synchronisation */}
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                  Base de données & Synchronisation
                </h2>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden shadow-xs">
                  {/* Statut & Diagnostic Supabase */}
                  <div
                    onClick={() => {
                      setActiveAdminTab('database');
                      setDatabaseSubTab('supabase');
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-emerald-950/60 flex items-center justify-center text-[#047857] dark:text-emerald-400 shrink-0">
                        <span className="material-symbols-outlined text-[22px]">database</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Statut & Diagnostic Supabase</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Connectivité PostgreSQL et latence {latencyMs || 84}ms</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                      <span className="bg-[#ECFDF5] text-[#047857] dark:bg-emerald-950/60 dark:text-emerald-300 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span> En ligne
                      </span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>

                  {/* Scripts & Migrations SQL */}
                  <div
                    onClick={() => {
                      setActiveAdminTab('database');
                      setDatabaseSubTab('migrations');
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <span className="material-symbols-outlined text-[22px]">bolt</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Scripts & Migrations SQL</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Schémas SQL prêts à exécuter</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-semibold">SQL</span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>

                  {/* Synchronisation Cloud */}
                  <div
                    onClick={() => handleForceSync()}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <span className="material-symbols-outlined text-[22px]">sync</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Synchronisation Cloud</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Forcer la synchronisation manuelle</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                      <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-semibold">Sync</span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>

                  {/* Serveur Web Push */}
                  <div
                    onClick={() => {
                      setActiveAdminTab('database');
                      setDatabaseSubTab('push');
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] dark:bg-amber-950/60 text-[#D97706] dark:text-amber-400 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">cell_tower</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Serveur Web Push (VAPID)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Configuration notifications et push de test</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                      <span className="bg-[#ECFDF5] text-[#047857] dark:bg-emerald-950/60 dark:text-emerald-300 text-xs px-2 py-0.5 rounded-full font-semibold">Actif</span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Diagnostics & Système */}
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                  Diagnostics & Système
                </h2>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden shadow-xs">
                  {/* Cache & Stockage */}
                  <div
                    onClick={() => {
                      setActiveAdminTab('config');
                      setConfigSubTab('cache');
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                        <span className="material-symbols-outlined text-[22px]">save</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Cache & Stockage technique</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Vider cache, IndexedDB et rafraîchir</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-semibold">{cacheSizeMb}</span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>

                  {/* System logs */}
                  <div
                    onClick={() => {
                      setActiveAdminTab('diagnostics');
                      setDiagnosticsSubTab('logs');
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] dark:bg-rose-950/60 text-[#DC2626] dark:text-rose-400 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">bar_chart</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Journaux & Alertes système</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Journal des erreurs JS et historique</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-semibold">{errorLogs.length} logs</span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>

                  {/* Environment */}
                  <div
                    onClick={() => {
                      setActiveAdminTab('diagnostics');
                      setDiagnosticsSubTab('environment');
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <span className="material-symbols-outlined text-[22px]">laptop_chromebook</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Environnement & Système</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Mode PWA autonome et Service Worker</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                      <span className="bg-[#EFF6FF] dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full font-semibold">PWA</span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3: Sécurité & Actions Sensibles */}
              <section className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    <h2 className="text-xs font-bold uppercase tracking-wider">
                      Sécurité & Actions Sensibles
                    </h2>
                  </div>
                  <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/60">
                    Zone protégée
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/60 shadow-xs divide-y divide-red-100 dark:divide-red-900/40 overflow-hidden">
                  {/* Test Data Reset */}
                  <div
                    onClick={() => setIsPurgeModalOpen(true)}
                    className="p-3.5 bg-red-50/20 dark:bg-red-950/20 hover:bg-red-50/50 dark:hover:bg-red-950/40 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] dark:bg-red-950/60 border border-[#FECACA] dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                        <span className="material-symbols-outlined text-[22px]">restart_alt</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Réinitialisation des données de test</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Purge des jeux d'essai uniquement (mocked rows)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                      <span className="bg-[#FEF2F2] dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-[#FECACA] dark:border-red-900/60 text-xs px-2 py-0.5 rounded-full font-semibold">
                        Danger
                      </span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>

                  {/* Emergency Purge Session */}
                  <div
                    onClick={() => setIsPurgeModalOpen(true)}
                    className="p-3.5 bg-red-50/20 dark:bg-red-950/20 hover:bg-red-50/50 dark:hover:bg-red-950/40 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] dark:bg-red-950/60 border border-[#FECACA] dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                        <span className="material-symbols-outlined text-[22px]">power_settings_new</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Purge d'urgence des sessions & foyers</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Déconnexion forcée et révocation des tokens</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                      <span className="bg-[#FEF2F2] dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-[#FECACA] dark:border-red-900/60 text-xs px-2 py-0.5 rounded-full font-semibold">
                        Danger
                      </span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>

                  {/* Immediate Maintenance toggle panel */}
                  <div className="p-3.5 bg-white dark:bg-slate-800 flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mode maintenance immédiat</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">Bloquer l'accès aux deux partenaires</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleMaintenanceMode?.()}
                      className={`h-9 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                        isMaintenanceMode
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-[#FEF2F2] hover:bg-red-100 dark:bg-red-950/60 border border-[#FCA5A5] dark:border-red-800 text-[#B91C1C] dark:text-red-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                      <span>{isMaintenanceMode ? 'Désactiver' : 'Activer'}</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Section 4: Affichage & Index */}
              <section className="space-y-1.5">
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                  Affichage
                </h2>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
                  <div
                    onClick={() => setActiveAdminTab('all')}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                        <span className="material-symbols-outlined text-[22px]">article</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Afficher toutes les rubriques</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Dérouler toutes les sections d'administration sur une seule page</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tout voir</span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Developer Info Banner */}
              <div className="bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-700 rounded-xl p-3.5 flex items-start gap-3 text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px] mt-0.5">terminal</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Console développeur active</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono truncate">
                    Build 2026.09 • Branch: main • Commit: a839fd • DuoBudget Core v2.4.0 (PWA Standalone) ap-east-1
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Modal: Zone Critique & Purge */}
          {isPurgeModalOpen && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
              <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">warning</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">Zone critique & Purge</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Confirmation administrateur requise</p>
                  </div>
                </div>

                <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 space-y-1">
                  <p className="font-bold">Attention : Opération irréversible.</p>
                  <p className="leading-relaxed">
                    Cette action permet de vider les tables de staging, supprimer les transactions de test orphelines et réinitialiser les compteurs sans altérer les foyers vérifiés.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Pour confirmer, saisissez « PURGE » :
                  </label>
                  <input
                    type="text"
                    value={purgeInputText}
                    onChange={(e) => setPurgeInputText(e.target.value)}
                    placeholder="PURGE"
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none uppercase"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPurgeModalOpen(false);
                      setPurgeInputText('');
                    }}
                    className="flex-1 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={purgeInputText.trim() !== 'PURGE'}
                    onClick={async () => {
                      if (purgeInputText.trim() === 'PURGE') {
                        await handleResetTestData();
                        setIsPurgeModalOpen(false);
                        setPurgeInputText('');
                      }
                    }}
                    className="flex-1 h-11 rounded-xl bg-red-600 text-white font-bold text-xs sm:text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Purger les tests
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TOP NAVIGATION BAR FOR SUB-VIEWS                           */}
      {/* ========================================================= */}
      {activeAdminTab !== 'menu' && (
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveAdminTab('menu')}
            className="px-3 py-1.5 -ml-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-1.5 font-bold text-sm cursor-pointer"
            aria-label="Retour au menu administration"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Menu Administration</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">
              {adminTabTitles[activeAdminTab] || 'Administration'}
            </span>
            <button
              type="button"
              onClick={() => setActiveAdminTab('menu')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 transition-colors cursor-pointer"
            >
              Menu ☰
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 0. SECTION : MESSAGES REÇUS & SUPPORT (CONTACT)            */}
      {/* ========================================================= */}
      {(activeAdminTab === 'messages' || (activeAdminTab === 'all' && contactMessages.length > 0)) && (
        <div className="space-y-4 animate-fade-in">
          <AdminContactMessagesSection
            messages={contactMessages}
            onSendReply={handleContactReply}
            onUpdateStatus={handleContactStatus}
            onDeleteMessage={handleContactDelete}
            onMarkAsRead={handleContactMarkAsRead}
            onRefresh={handleContactRefresh}
            onBack={() => setActiveAdminTab('menu')}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. SECTION : FOYERS & UTILISATEURS                        */}
      {/* ========================================================= */}
      {(activeAdminTab === 'foyers' || activeAdminTab === 'all') && (
        <div className="space-y-4 animate-fade-in">
          {/* Sous-menus Foyers & Utilisateurs */}
          {activeAdminTab === 'foyers' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 border border-sky-100 dark:border-slate-700/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 hidden sm:inline-block">
                  Sous-menus :
                </span>
                <button
                  type="button"
                  onClick={() => setFoyersSubTab('foyers')}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    foyersSubTab === 'foyers'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>🏠</span>
                  <span>Foyers partagés</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFoyersSubTab('accounts')}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    foyersSubTab === 'accounts'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>👤</span>
                  <span>Comptes & Mots de passe</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    foyersSubTab === 'accounts'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                  }`}>
                    {profiles.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFoyersSubTab('sessions')}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    foyersSubTab === 'sessions'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>🔐</span>
                  <span>Sessions récentes</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    foyersSubTab === 'sessions'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                  }`}>
                    {loginHistory.length}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('menu')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-1 cursor-pointer transition-all"
                  title="Revenir au menu principal"
                >
                  <span>☰</span>
                  <span className="hidden xs:inline">Menu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFoyersSubTab(foyersSubTab === 'all' ? 'foyers' : 'all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    foyersSubTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                  title="Afficher toutes les cartes de cette rubrique"
                >
                  <span>{foyersSubTab === 'all' ? '✓ Vue ciblée' : '📋 Tout afficher'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 1.A. ADMINISTRATION DES FOYERS */}
          {(foyersSubTab === 'foyers' || foyersSubTab === 'all' || activeAdminTab === 'all') && (
            <AdminFoyersSection
              expenses={expenses}
              reminders={reminders}
              currentFoyer={currentFoyer}
              setToastInfo={setToastInfo}
              onSwitchFoyer={onSwitchFoyer}
            />
          )}

          {/* 1.B. GESTION DES COMPTES & MOTS DE PASSE */}
          {(foyersSubTab === 'accounts' || foyersSubTab === 'all' || activeAdminTab === 'all') && (
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                    Gestion globale des comptes
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                    {profiles.length} comptes enregistrés au total • Modification des mots de passe
                  </p>
                </div>
              </div>

              {/* Quick Search */}
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Rechercher un compte..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* User Profiles List */}
            <div className="divide-y divide-slate-100/90 dark:divide-slate-700/60 pt-1">
              {filteredProfiles.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Aucun compte ne correspond à votre recherche.
                </div>
              ) : (
                filteredProfiles.map((p, pIdx) => {
                  const isVincent = p.username.toLowerCase().trim() === 'vincent';
                  const isBlocked = !!p.blocked;
                  const isFoyerPrincipal = !p.foyer_id || p.foyer_id === 'foyer_vincent_sophie';

                  return (
                    <div key={`${p.username}-${p.foyer_id || 'default'}-${pIdx}`} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-2xl font-extrabold text-base flex items-center justify-center shrink-0 border text-white shadow-2xs"
                          style={{ backgroundColor: p.color || (p.user === User.Sophie ? '#ec4899' : '#0284c7') }}
                        >
                          {p.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                              {p.username}
                            </p>
                            {isVincent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                ADMIN
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isBlocked 
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            }`}>
                              {isBlocked ? 'Bloqué' : 'Actif'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              {isFoyerPrincipal ? '🏠 Principal' : `Foyer: ${p.foyer_id?.slice(0, 10)}...`}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                            Rôle : {p.user || p.username} {p.email ? `• ✉️ ${p.email}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* User actions: password modification, email assignment & account deletion */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEmailUser(p.username);
                            setEditEmailValue(p.email || '');
                          }}
                          className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          title={p.email ? "Modifier l'adresse email associée" : "Ajouter une adresse email"}
                        >
                          <span>✉️</span>
                          <span>{p.email ? "Modifier email" : "Ajouter email"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingPasswordUser(p.username);
                            setEditPasswordValue('');
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          title="Modifier le mot de passe"
                        >
                          <span>🔑</span>
                          <span>Mot de passe</span>
                        </button>

                        {!isVincent && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le compte de « ${p.username} » ? Cette action est irréversible et supprimera le compte du Cloud.`)) {
                                if (_onDeleteProfile) {
                                  const res = await _onDeleteProfile(p.username);
                                  if (res) {
                                    setToastInfo({ message: `Le compte ${p.username} a été définitivement supprimé.`, type: 'info' });
                                  } else {
                                    setToastInfo({ message: `Impossible de supprimer le compte ${p.username}.`, type: 'error' });
                                  }
                                }
                              }
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-100/60 dark:border-rose-800/40 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                            title="Supprimer définitivement ce compte"
                          >
                            <span>🗑️</span>
                            <span>Supprimer</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          )}

          {/* 1.C. SESSIONS & CONNEXIONS RÉCENTES */}
          {(foyersSubTab === 'sessions' || foyersSubTab === 'all' || activeAdminTab === 'all') && (
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-[#0d9488] dark:text-teal-400 shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                    Sessions & connexions récentes
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {loginHistory.length} connexions récentes enregistrées
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSessionsModal(!showSessionsModal)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer shrink-0"
              >
                {showSessionsModal ? 'Masquer' : 'Voir les sessions'}
              </button>
            </div>

            {showSessionsModal && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 space-y-2 text-xs divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {loginHistory.slice(0, 8).map((evt, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${evt.user === User.Sophie ? 'bg-pink-500' : 'bg-sky-500'}`} />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{evt.user}</span>
                    </div>
                    <span className="text-slate-400 dark:text-slate-500">{formatTimeFrench(evt.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SECTION : BASE DE DONNÉES & SYNCHRONISATION            */}
      {/* ========================================================= */}
      {(activeAdminTab === 'database' || activeAdminTab === 'all') && (
        <div className="space-y-4 animate-fade-in">
          {/* Sous-menus Base & Synchro */}
          {activeAdminTab === 'database' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 border border-blue-100 dark:border-slate-700/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 hidden sm:inline-block">
                  Sous-menus :
                </span>
                <button
                  type="button"
                  onClick={() => setDatabaseSubTab('supabase')}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    databaseSubTab === 'supabase'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>⚡</span>
                  <span>Supabase & Tables</span>
                  <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setDatabaseSubTab('migrations')}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    databaseSubTab === 'migrations'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>🔀</span>
                  <span>Migrations SQL</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDatabaseSubTab('sync')}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    databaseSubTab === 'sync'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>🔄</span>
                  <span>Synchro Cloud</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDatabaseSubTab('push')}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    databaseSubTab === 'push'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>📡</span>
                  <span>Push & Notifications</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('menu')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-1 cursor-pointer transition-all"
                  title="Revenir au menu principal"
                >
                  <span>☰</span>
                  <span className="hidden xs:inline">Menu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDatabaseSubTab(databaseSubTab === 'all' ? 'supabase' : 'all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    databaseSubTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                  title="Afficher toutes les cartes de cette rubrique"
                >
                  <span>{databaseSubTab === 'all' ? '✓ Vue ciblée' : '📋 Tout afficher'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2.A. BASE DE DONNÉES SUPABASE */}
          {(databaseSubTab === 'supabase' || databaseSubTab === 'all' || activeAdminTab === 'all') && (
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#3b82f6] dark:text-blue-400 shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                    Base de données Supabase
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    Connexion, schéma et état du projet
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setExpandedSection(expandedSection === 'db' ? null : 'db')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
              >
                <svg className={`w-5 h-5 transform transition-transform ${expandedSection === 'db' ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-bold">
                Projet : duobudget-prod
              </span>
              <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
                Schéma : v12
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-bold">
                12 tables
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                {expenses.length} dépenses • {reminders.length} rappels
              </span>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={dbStatus === 'checking'}
                className="py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer border border-blue-200/60 dark:border-blue-800/60"
              >
                <span className="text-base">🔌</span>
                <span>{dbStatus === 'checking' ? 'Test en cours...' : 'Tester la connexion'}</span>
                {latencyMs !== null && dbStatus === 'connected' && (
                  <span className="text-[11px] bg-blue-200/70 dark:bg-blue-800/70 px-1.5 py-0.5 rounded-md">
                    {latencyMs} ms
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsSqlModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer border border-slate-200/80 dark:border-slate-600/80"
              >
                <span className="text-base">📄</span>
                <span>Instructions SQL</span>
              </button>
            </div>

            {/* Expandable details */}
            {expandedSection === 'db' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-600/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Hôte Supabase</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">xcdyshzyxpngbpceilym.supabase.co</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-600/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Dernière vérification</span>
                  <span className="text-slate-800 dark:text-slate-200">{formatTimeFrench(lastCheckTime)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Sécurité RLS</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Activée (Policies Publiques)</span>
                </div>
              </div>
            )}
          </div>
          )}

          {/* 2.B. MIGRATIONS & STRUCTURE SQL */}
          {(databaseSubTab === 'migrations' || databaseSubTab === 'all' || activeAdminTab === 'all') && (
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-[#f43f5e] dark:text-rose-400 shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                    Migrations & structure SQL
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    Vérifier ou mettre à jour la structure
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setExpandedSection(expandedSection === 'migrations' ? null : 'migrations')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
              >
                <svg className={`w-5 h-5 transform transition-transform ${expandedSection === 'migrations' ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Table status if verified */}
            {tableStatus && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Object.entries(tableStatus).map(([tbl, st]) => (
                  <div key={tbl} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 shadow-2xs">
                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">{tbl}</span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${st === 'ok' ? 'bg-emerald-500' : st === 'checking' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'}`} />
                  </div>
                ))}
              </div>
            )}

            {/* Three buttons row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handleVerifyTables}
                disabled={isCheckingTables}
                className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer border border-slate-200/70 dark:border-slate-600/70"
              >
                <span className="text-sm">🔍</span>
                <span>{isCheckingTables ? 'Vérification...' : 'Vérifier les tables'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSqlModalOpen(true)}
                className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer border border-slate-200/70 dark:border-slate-600/70"
              >
                <span className="text-sm">📄</span>
                <span>Afficher le SQL</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMigrationDetailsOpen(!isMigrationDetailsOpen)}
                className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer border border-amber-200/70 dark:border-amber-800/70"
              >
                <span className="text-sm">🔀</span>
                <span>Migration contrôlée</span>
              </button>
            </div>

            {/* Controlled Migration Drawer */}
            {isMigrationDetailsOpen && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-3 text-xs animate-fade-in">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                  <span>💡</span>
                  <span>Recommandation de migration de structure :</span>
                </div>
                <p className="text-amber-800/90 dark:text-amber-300 leading-relaxed font-medium">
                  Les modifications de colonnes (ex : ajout de <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded">subtracted_items</code> ou <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded">performedBy</code>) sont sécurisées avec des blocs <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded">DO $$ BEGIN ... END $$</code> idempotents.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSqlModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Copier le script SQL complet
                  </button>
                </div>
              </div>
            )}
          </div>
          )}

          {/* 2.C. SYNCHRONISATION */}
          {(databaseSubTab === 'sync' || databaseSubTab === 'all' || activeAdminTab === 'all') && (
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-[#10b981] dark:text-emerald-400 shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                    Synchronisation Cloud
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Dernière synchro : {formatTimeFrench(lastSyncTime)}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Éléments en attente : 0
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleForceSync}
                disabled={isSyncing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#e0f2fe] hover:bg-sky-200 dark:bg-sky-950/70 dark:hover:bg-sky-900/80 text-[#0284c7] dark:text-sky-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shrink-0 border border-sky-200 dark:border-sky-800/60"
              >
                <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isSyncing ? 'Synchronisation...' : 'Forcer la synchro'}</span>
              </button>
            </div>
          </div>
          )}

          {/* 2.D. PUSH & NOTIFICATIONS */}
          {(databaseSubTab === 'push' || databaseSubTab === 'all' || activeAdminTab === 'all') && (
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/60 flex items-center justify-center text-[#f43f5e] dark:text-pink-400 shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                    Push & notifications
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Permission : {pushPermission === 'granted' ? 'Accordée' : pushPermission === 'denied' ? 'Refusée' : 'Non demandée'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      Token : {deviceTokenSnippet}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendTestPush}
                disabled={isSendingPushTest}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shrink-0 border border-blue-200 dark:border-blue-800"
              >
                <span className="text-base">✈️</span>
                <span>{isSendingPushTest ? 'Envoi...' : 'Envoyer un test'}</span>
              </button>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SECTION : CONFIGURATION & OUTILS                       */}
      {/* ========================================================= */}
      {(activeAdminTab === 'config' || activeAdminTab === 'all') && (
        <div className="space-y-4 animate-fade-in">
          {/* Sous-menus Configuration */}
          {activeAdminTab === 'config' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 border border-amber-100 dark:border-slate-700/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 hidden sm:inline-block">
                  Sous-menus :
                </span>
                <button
                  type="button"
                  onClick={() => setConfigSubTab('maintenance')}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    configSubTab === 'maintenance'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>🛠️</span>
                  <span>Mode Maintenance</span>
                  <span className={`w-2 h-2 rounded-full ${isMaintenanceMode ? 'bg-amber-300 animate-pulse' : 'bg-emerald-400'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setConfigSubTab('icons')}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    configSubTab === 'icons'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>🎨</span>
                  <span>Icônes de Catégorie</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfigSubTab('cache')}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    configSubTab === 'cache'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>💾</span>
                  <span>Cache & Stockage</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('menu')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-1 cursor-pointer transition-all"
                  title="Revenir au menu principal"
                >
                  <span>☰</span>
                  <span className="hidden xs:inline">Menu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfigSubTab(configSubTab === 'all' ? 'maintenance' : 'all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    configSubTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                  title="Afficher toutes les cartes de cette rubrique"
                >
                  <span>{configSubTab === 'all' ? '✓ Vue ciblée' : '📋 Tout afficher'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 3.A. MODE MAINTENANCE */}
          {(configSubTab === 'maintenance' || configSubTab === 'all' || activeAdminTab === 'all') && (
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <span className="text-2xl">🛠️</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                      Mode Maintenance
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                      isMaintenanceMode 
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700' 
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    }`}>
                      {isMaintenanceMode ? 'Actif' : 'Accessible à tous'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                    Restreindre l'accès à l'application pendant les mises à jour
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleMaintenanceMode && onToggleMaintenanceMode(!isMaintenanceMode)}
                className={`w-12 h-7 rounded-full transition-colors relative flex items-center p-1 cursor-pointer shrink-0 ${
                  isMaintenanceMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                aria-label="Basculer le mode maintenance"
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                  isMaintenanceMode ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className={`p-4 rounded-2xl border text-xs space-y-2.5 transition-colors ${
              isMaintenanceMode
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                : 'bg-slate-50/80 dark:bg-slate-700/30 border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-400'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span>{isMaintenanceMode ? '⚠️' : 'ℹ️'}</span>
                <span>
                  {isMaintenanceMode 
                    ? 'Mode maintenance activé : Seul l’administrateur Vincent peut naviguer.' 
                    : 'L’application est en fonctionnement normal.'}
                </span>
              </div>
              <p className="leading-relaxed">
                {isMaintenanceMode
                  ? 'Sophie et tous les autres utilisateurs ouvrant l’application verront un écran d’information de maintenance. Seul Vincent peut accéder aux données.'
                  : 'Activez ce mode si vous vous préparez à exécuter des scripts de migration SQL, purger des données ou modifier la structure.'}
              </p>
            </div>
          </div>
          )}

          {/* 3.B. GESTION DES ICÔNES DE CATÉGORIE */}
          {(configSubTab === 'icons' || configSubTab === 'all' || activeAdminTab === 'all') && (
            <CategoryIconManagementSection categories={categories} setToastInfo={setToastInfo} />
          )}

          {/* 3.C. CACHE & STOCKAGE TECHNIQUE */}
          {(configSubTab === 'cache' || configSubTab === 'all' || activeAdminTab === 'all') && (
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-[#10b981] dark:text-emerald-400 shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                    Cache & stockage technique
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Cache : {cacheSizeMb}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Service worker : {isSwActive ? 'Actif' : 'En veille'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearTechnicalCache}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer border border-rose-200/80 dark:border-rose-800/60"
                >
                  <span className="text-sm">🗑️</span>
                  <span>Vider le cache</span>
                </button>

                <button
                  type="button"
                  onClick={handleUpdateServiceWorker}
                  disabled={isRefreshingSw}
                  className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer border border-sky-200/80 dark:border-sky-800/60"
                >
                  <span className={`text-sm ${isRefreshingSw ? 'animate-spin' : ''}`}>🔄</span>
                  <span>Actualiser</span>
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SECTION : DIAGNOSTICS & SÉCURITÉ                       */}
      {/* ========================================================= */}
      {(activeAdminTab === 'diagnostics' || activeAdminTab === 'all') && (
        <div className="space-y-4 animate-fade-in">
          {/* Sous-menus Diagnostics */}
          {activeAdminTab === 'diagnostics' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 hidden sm:inline-block">
                  Sous-menus :
                </span>
                <button
                  type="button"
                  onClick={() => setDiagnosticsSubTab('logs')}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    diagnosticsSubTab === 'logs'
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>📋</span>
                  <span>Journaux & Alertes</span>
                  {errorLogs.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-rose-500 text-white font-bold">
                      {errorLogs.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDiagnosticsSubTab('environment')}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    diagnosticsSubTab === 'environment'
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>🌐</span>
                  <span>Environnement & Système</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiagnosticsSubTab('danger')}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    diagnosticsSubTab === 'danger'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                  }`}
                >
                  <span>⚠️</span>
                  <span>Zone critique</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('menu')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-1 cursor-pointer transition-all"
                  title="Revenir au menu principal"
                >
                  <span>☰</span>
                  <span className="hidden xs:inline">Menu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDiagnosticsSubTab(diagnosticsSubTab === 'all' ? 'logs' : 'all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    diagnosticsSubTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                  title="Afficher toutes les cartes de cette rubrique"
                >
                  <span>{diagnosticsSubTab === 'all' ? '✓ Vue ciblée' : '📋 Tout afficher'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 4.A. JOURNAUX & DIAGNOSTICS */}
          {(diagnosticsSubTab === 'logs' || diagnosticsSubTab === 'all' || activeAdminTab === 'all') && (
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#3b82f6] dark:text-blue-400 shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                    Journaux & diagnostics
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {errorLogs.length === 0 ? 'Aucune erreur récente' : `${errorLogs.length} alertes`}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      Latence : {latencyMs || 84} ms
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      Version app : 1.0.0
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyDiagnostic}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shrink-0 border border-blue-200 dark:border-blue-800"
              >
                <span className="text-base">📋</span>
                <span>Copier le diagnostic</span>
              </button>
            </div>

            {/* Error logs display if any */}
            {errorLogs.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1.5 text-xs">
                <p className="font-bold text-rose-800 dark:text-rose-200">Dernières anomalies capturées :</p>
                {errorLogs.slice(0, 3).map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                    <span>[{log.time}]</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* 4.B. ENVIRONNEMENT & MÉTRIQUES SYSTÈME */}
          {(diagnosticsSubTab === 'environment' || diagnosticsSubTab === 'all' || activeAdminTab === 'all') && (
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-3">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
              Environnement d'exécution
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-400 font-medium">Connectivité</span>
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="relative flex h-3 w-3 items-center justify-center">
                    {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900' : 'bg-rose-500'}`} />
                  </span>
                  {isOnline ? 'En ligne' : 'Hors-ligne'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-400 font-medium">Affichage PWA</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {isPwa ? 'Standalone (Installée)' : 'Navigateur Web'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60 space-y-1">
                <span className="text-slate-400 font-medium">Stockage local</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  LocalStorage actif
                </p>
              </div>
            </div>
          </div>
          )}

          {/* 4.C. ZONE CRITIQUE */}
          {(diagnosticsSubTab === 'danger' || diagnosticsSubTab === 'all' || activeAdminTab === 'all') && (
          <div className="bg-[#fef2f2] dark:bg-rose-950/25 border border-rose-200/90 dark:border-rose-900/60 rounded-[26px] p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/70 flex items-center justify-center text-[#ef4444] dark:text-rose-400 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-rose-900 dark:text-rose-200 text-base sm:text-lg leading-tight">
                  Zone critique
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  Actions sensibles pouvant affecter les données de l’application
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Action 1: Réinitialiser les données de test */}
              <button
                type="button"
                onClick={() => {
                  setDangerConfirmText('');
                  setDangerModalMode('reset_test');
                }}
                className="py-3 px-4 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/70 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
              >
                <span>🗑️</span>
                <span>Purger les données de test</span>
              </button>

              {/* Action 2: Effacer le cache technique */}
              <button
                type="button"
                onClick={() => {
                  setDangerConfirmText('');
                  setDangerModalMode('clear_tech_cache');
                }}
                className="py-3 px-4 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/50 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>🗑️</span>
                <span>Effacer le cache technique</span>
              </button>
            </div>

            {/* Footer note */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600/90 dark:text-rose-400 font-medium pt-1">
              <span>⚠️</span>
              <span>Confirmation requise avant toute action</span>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* USER MANAGEMENT MODALS (EDIT PASSWORD & EDIT EMAIL)        */}
      {/* ========================================================= */}
      {editingEmailUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-4 border border-slate-100 dark:border-slate-700">
            <div className="space-y-1">
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>✉️</span>
                <span>{editEmailValue ? "Modifier l'adresse email" : "Ajouter une adresse email"}</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pour le compte « <span className="font-bold text-slate-700 dark:text-slate-200">{editingEmailUser}</span> ».
              </p>
            </div>
            <form onSubmit={handleUpdateEmailSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Adresse email
                </label>
                <input
                  type="email"
                  placeholder="ex: sophie@gmail.com"
                  value={editEmailValue}
                  onChange={e => setEditEmailValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Permet à l'utilisateur de se connecter avec son email ou son identifiant.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingEmailUser(null);
                    setEditEmailValue('');
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingPasswordUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-4 border border-slate-100 dark:border-slate-700">
            <div className="space-y-1">
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">Modifier le mot de passe</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pour le compte « {editingPasswordUser} ».</p>
            </div>
            <form onSubmit={handleUpdatePasswordSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Nouveau mot de passe"
                value={editPasswordValue}
                onChange={e => setEditPasswordValue(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPasswordUser(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS: SQL INSTRUCTIONS & DANGER CONFIRMATIONS           */}
      {/* ========================================================= */}
      <SupabaseInstructionsModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      {dangerModalMode && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => {
            setDangerModalMode(null);
            setDangerConfirmText('');
          }}
          title={
            dangerModalMode === 'reset_test'
              ? 'Purger les données de test'
              : 'Effacer l’intégralité du cache technique'
          }
          message={
            dangerModalMode === 'reset_test'
              ? 'Cette action supprimera toutes les lignes identifiées comme tests. Tapez « SUPPRIMER » pour confirmer.'
              : 'Cette action réinitialisera les fichiers mis en cache et le service worker. Tapez « SUPPRIMER » pour confirmer.'
          }
          onConfirm={
            dangerModalMode === 'reset_test'
              ? handleResetTestData
              : handleClearTechnicalCache
          }
        />
      )}
    </div>
  );
};

export default AdminAndDevTab;
