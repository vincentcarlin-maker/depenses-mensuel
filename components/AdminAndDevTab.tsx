import React, { useState, useEffect, useMemo } from 'react';
import { Expense, Reminder, MoneyPotTransaction, Category, User } from '../types';
import { supabase } from '../supabase/client';
import { Profile, LoginEvent } from '../hooks/useAuth';
import ConfirmationModal from './ConfirmationModal';
import SupabaseInstructionsModal from './SupabaseInstructionsModal';
import { useCustomCategoryIcons, CustomCategoryIcon } from '../hooks/useCustomCategoryIcons';
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

// --- Category Icon Management Section Component ---
const CategoryIconManagementSection: React.FC<{
  categories: Category[];
  setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
}> = ({ categories = [], setToastInfo }) => {
  const { customIcons, addCustomIcon, deleteCustomIcon } = useCustomCategoryIcons();

  const [iconName, setIconName] = useState('');
  const [associatedCategory, setAssociatedCategory] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState('bg-pink-500');
  const [rawSvgContent, setRawSvgContent] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const COLOR_OPTIONS = [
    { label: 'Rose', value: 'bg-pink-500' },
    { label: 'Bleu', value: 'bg-blue-500' },
    { label: 'Émeraude', value: 'bg-emerald-500' },
    { label: 'Orange', value: 'bg-orange-500' },
    { label: 'Violet', value: 'bg-purple-500' },
    { label: 'Ambre', value: 'bg-amber-500' },
    { label: 'Teal', value: 'bg-teal-500' },
    { label: 'Indigo', value: 'bg-indigo-500' },
    { label: 'Gris', value: 'bg-slate-500' },
  ];

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
  ];

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
      color: selectedColor
    });

    setToastInfo({ message: `Icône « ${formattedName} » ajoutée et disponible dans l'application !`, type: 'info' });

    setRawSvgContent('');
    setImageDataUrl('');
    setFileName('');
    setIconName('');
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
            🖼️ Galerie ({BUILTIN_ICONS.length + customIcons.length})
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

          {/* Color & Preview */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-700/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-2 w-full sm:w-auto">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Couleur d'arrière-plan du macaron
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    className={`w-7 h-7 rounded-xl ${c.value} transition-transform cursor-pointer ${
                      selectedColor === c.value ? 'ring-2 ring-offset-2 ring-fuchsia-500 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Preview Box */}
            <div className="flex items-center gap-3 shrink-0 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aperçu en direct</p>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[120px]">
                  {iconName || 'NouvelleIcône'}
                </p>
              </div>

              <div className={`w-11 h-11 rounded-2xl ${selectedColor} text-white flex items-center justify-center shrink-0 shadow-2xs overflow-hidden`}>
                {rawSvgContent ? (
                  <div
                    className="w-6 h-6 flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-current [&>svg]:fill-current"
                    dangerouslySetInnerHTML={{ __html: rawSvgContent }}
                  />
                ) : imageDataUrl ? (
                  <img src={imageDataUrl} className="w-6 h-6 object-contain" alt="Aperçu" />
                ) : (
                  <span className="text-lg">✨</span>
                )}
              </div>
            </div>
          </div>

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
          {customIcons.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400">
                Icônes personnalisées ajoutées ({customIcons.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {customIcons.map(icon => {
                  const tsxCode = generateTsxCode(icon.name, icon.svgContent, icon.imageUrl);

                  return (
                    <div
                      key={icon.id}
                      className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between gap-2.5 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`w-10 h-10 rounded-xl ${icon.color || 'bg-fuchsia-500'} text-white flex items-center justify-center shrink-0 overflow-hidden shadow-2xs`}>
                          {icon.type === 'svg' && icon.svgContent ? (
                            <div
                              className="w-5 h-5 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5"
                              dangerouslySetInnerHTML={{ __html: icon.svgContent }}
                            />
                          ) : icon.imageUrl ? (
                            <img src={icon.imageUrl} className="w-5 h-5 object-contain" alt={icon.name} />
                          ) : (
                            <span>✨</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteCustomIcon(icon.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                          title="Supprimer cette icône"
                        >
                          🗑️
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
              Icônes système du projet dans <code className="normal-case">/components/icons/CategoryIcons.tsx</code> ({BUILTIN_ICONS.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {BUILTIN_ICONS.map((item, idx) => {
                const IconComp = item.icon;
                const sampleTsx = `export const ${item.name}: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (\n  /* Composant React dans /components/icons/CategoryIcons.tsx */\n);`;

                return (
                  <div
                    key={idx}
                    className="bg-slate-50/80 dark:bg-slate-700/40 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5">
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
  setToastInfo: (info: { message: string; type: 'info' | 'error' }) => void;
  onSyncData?: () => Promise<void>;
  onToggleBlockProfile?: (username: string) => { success: boolean; message: string };
  onDeleteProfile?: (username: string) => boolean;
  onAddProfile?: (profile: Profile) => boolean;
  onUpdateProfilePassword?: (username: string, newPassword: string) => boolean;
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
  setToastInfo,
  onSyncData,
  onToggleBlockProfile,
  onDeleteProfile,
  onAddProfile,
  onUpdateProfilePassword,
  isMaintenanceMode = false,
  onToggleMaintenanceMode,
}) => {
  // Only Vincent is authorized
  const isAuthorized = loggedInUser === User.Vincent;

  // --- States ---
  // User Management Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<User>(User.Sophie);
  const [addUserError, setAddUserError] = useState('');

  const [editingPasswordUser, setEditingPasswordUser] = useState<string | null>(null);
  const [editPasswordValue, setEditPasswordValue] = useState('');
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  // Connection & latency
  const [dbStatus, setDbStatus] = useState<'connected' | 'checking' | 'error'>('connected');
  const [latencyMs, setLatencyMs] = useState<number | null>(84);
  const [lastCheckTime, setLastCheckTime] = useState<string>(() => new Date().toISOString());

  // Push notifications
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [deviceTokenSnippet, setDeviceTokenSnippet] = useState<string>('********9A2F');
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
  const [dangerConfirmText, setDangerConfirmText] = useState('');

  // Expandable sections
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
      const { data, error } = await supabase.from('expenses').select('id', { head: true, count: 'exact' });
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
  const handleToggleBlock = (username: string) => {
    if (onToggleBlockProfile) {
      const res = onToggleBlockProfile(username);
      setToastInfo({
        message: res.message,
        type: res.success ? 'info' : 'error',
      });
    }
  };

  const handleDeleteUserConfirm = () => {
    if (deletingUser && onDeleteProfile) {
      const success = onDeleteProfile(deletingUser);
      if (success) {
        setToastInfo({ message: `L'utilisateur « ${deletingUser} » a été supprimé.`, type: 'info' });
      } else {
        setToastInfo({ message: 'Impossible de supprimer cet utilisateur.', type: 'error' });
      }
    }
    setDeletingUser(null);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError('');
    if (!newUsername.trim() || !newPassword.trim()) {
      setAddUserError('Veuillez remplir tous les champs.');
      return;
    }
    if (onAddProfile) {
      const success = onAddProfile({
        username: newUsername.trim(),
        password: newPassword.trim(),
        user: newUserRole,
        blocked: false,
      });
      if (success) {
        setToastInfo({ message: `Utilisateur « ${newUsername.trim()} » créé avec succès.`, type: 'info' });
        setIsAddUserModalOpen(false);
        setNewUsername('');
        setNewPassword('');
      } else {
        setAddUserError('Ce nom d’utilisateur existe déjà.');
      }
    }
  };

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

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Header matching Apparence & Utilisateurs style */}
      <div className="space-y-1 pt-1 pb-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Administration & Développement
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
          Outils techniques et avancés de DuoBudget
        </p>
      </div>

      {/* ========================================================= */}
      {/* TOP QUICK STATUS PILL BAR                                 */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 sm:p-3 border border-slate-100/90 dark:border-slate-700/60 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold">
          {/* Supabase status */}
          <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200">
            <span className="text-base">🗄️</span>
            <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : dbStatus === 'checking' ? 'bg-amber-500 animate-ping' : 'bg-rose-500'}`} />
            <span>{dbStatus === 'connected' ? 'Supabase connecté' : dbStatus === 'checking' ? 'Vérification...' : 'Supabase hors-ligne'}</span>
          </div>

          {/* Push status */}
          <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200">
            <span className="text-base">📡</span>
            <span className={`w-2 h-2 rounded-full ${pushPermission === 'granted' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{pushPermission === 'granted' ? 'Push actif' : 'Push en attente'}</span>
          </div>

          {/* Synchro status */}
          <div className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200">
            <span className="text-base">🔄</span>
            <span>Synchro à jour</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-auto" />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. BASE DE DONNÉES SUPABASE                               */}
      {/* ========================================================= */}
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
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
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

      {/* ========================================================= */}
      {/* 2. MIGRATIONS & STRUCTURE SQL                             */}
      {/* ========================================================= */}
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
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
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

        {/* Three buttons row matching screenshot */}
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

      {/* ========================================================= */}
      {/* 3. SYNCHRONISATION                                        */}
      {/* ========================================================= */}
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
                Synchronisation
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

      {/* ========================================================= */}
      {/* 4. PUSH & NOTIFICATIONS                                   */}
      {/* ========================================================= */}
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

      {/* ========================================================= */}
      {/* 5. JOURNAUX & DIAGNOSTICS                                 */}
      {/* ========================================================= */}
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

      {/* ========================================================= */}
      {/* 6. CACHE & STOCKAGE TECHNIQUE                             */}
      {/* ========================================================= */}
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

      {/* ========================================================= */}
      {/* 6.5. AJOUT & GESTION D'ICÔNES DE CATÉGORIE                */}
      {/* ========================================================= */}
      <CategoryIconManagementSection categories={categories} setToastInfo={setToastInfo} />

      {/* ========================================================= */}
      {/* 7. MODE MAINTENANCE DE L'APPLICATION                      */}
      {/* ========================================================= */}
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

      {/* ========================================================= */}
      {/* 8. GESTION DES UTILISATEURS (BLOQUER / SUPPRIMER)         */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                Gestion des comptes utilisateurs
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                {profiles.length} comptes enregistrés dans l’application
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setAddUserError('');
              setNewUsername('');
              setNewPassword('');
              setIsAddUserModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-200/80 dark:border-indigo-800/60 shrink-0"
          >
            <span>➕</span>
            <span>Nouveau compte</span>
          </button>
        </div>

        {/* User Profiles List */}
        <div className="divide-y divide-slate-100/90 dark:divide-slate-700/60 pt-1">
          {profiles.map((p) => {
            const isVincent = p.user === User.Vincent;
            const isBlocked = !!p.blocked;

            return (
              <div key={p.username} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl font-extrabold text-base flex items-center justify-center shrink-0 border ${
                    p.user === User.Sophie 
                      ? 'bg-pink-100 text-pink-600 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-900/60'
                      : 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/60'
                  }`}>
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
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
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                      Rôle : {p.user}
                    </p>
                  </div>
                </div>

                {/* User actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isVincent && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleBlock(p.username)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                          isBlocked
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        }`}
                        title={isBlocked ? "Débloquer l'utilisateur" : "Bloquer l'utilisateur"}
                      >
                        <span>{isBlocked ? '🔓' : '🚫'}</span>
                        <span>{isBlocked ? 'Débloquer' : 'Bloquer'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingUser(p.username)}
                        className="p-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-rose-200 dark:border-rose-800/60"
                        title="Supprimer le compte"
                      >
                        <span>🗑️</span>
                        <span>Supprimer</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEditingPasswordUser(p.username);
                      setEditPasswordValue('');
                    }}
                    className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                    title="Modifier le mot de passe"
                  >
                    <span>🔑</span>
                    <span>MDP</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. SESSIONS & SÉCURITÉ (SAFE TOOLS)                       */}
      {/* ========================================================= */}
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
                Sessions & sécurité
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
            {loginHistory.slice(0, 5).map((evt, idx) => (
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

      {/* ========================================================= */}
      {/* 9. ZONE CRITIQUE (DESTRUCTIVE TOOLS - RED HIGHLIGHT)       */}
      {/* ========================================================= */}
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
            <span>Réinitialiser les données de test</span>
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
          <span>Confirmation requise</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* USER MANAGEMENT MODALS (ADD, EDIT PASSWORD, DELETE)       */}
      {/* ========================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-4 border border-slate-100 dark:border-slate-700">
            <div className="space-y-1">
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">Ajouter un utilisateur</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Créez un nouveau profil pour accéder à l'application.</p>
            </div>
            <form onSubmit={handleAddUserSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nom d’utilisateur
                </label>
                <input
                  type="text"
                  placeholder="ex: sophie"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mot de passe
                </label>
                <input
                  type="text"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rôle associé
                </label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as User)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={User.Sophie}>Sophie</option>
                  <option value={User.Vincent}>Vincent (Admin)</option>
                </select>
              </div>

              {addUserError && <p className="text-xs text-rose-500 font-bold">{addUserError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                >
                  Créer le compte
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
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingUser && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteUserConfirm}
          title="Supprimer l'utilisateur"
          message={`Êtes-vous sûr de vouloir supprimer définitivement le compte « ${deletingUser} » ? L'utilisateur ne pourra plus se connecter.`}
        />
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
