import React from 'react';
import {
  useCategoryVisuals,
  AssuranceIconChoice,
  InternetIconChoice,
} from '../hooks/useCategoryVisuals';
import {
  AssuranceBadgeIcon,
  ShieldOutlineIcon,
  WifiIcon,
  WifiOutlineIcon,
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
  BouyguesIcon,
  SfrIcon,
} from './icons/CategoryIcons';

interface SpecialIconStyleSelectorProps {
  setToastInfo?: (info: { message: string; type: 'info' | 'error' }) => void;
}

interface AssuranceOption {
  id: AssuranceIconChoice;
  label: string;
  sublabel: string;
  renderIcon: () => React.ReactNode;
}

interface InternetOption {
  id: InternetIconChoice;
  label: string;
  sublabel: string;
  renderIcon: () => React.ReactNode;
}

const ASSURANCE_OPTIONS: AssuranceOption[] = [
  {
    id: 'classic',
    label: 'Icône classique',
    sublabel: 'Bouclier simple',
    renderIcon: () => (
      <div className="w-9 h-9 rounded-full bg-[#10b981] text-white flex items-center justify-center shrink-0 shadow-2xs">
        <ShieldOutlineIcon className="w-5 h-5" />
      </div>
    ),
  },
  {
    id: 'logo',
    label: 'Générique',
    sublabel: 'Badge assurance',
    renderIcon: () => (
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-2xs">
        <AssuranceBadgeIcon className="w-9 h-9" />
      </div>
    ),
  },
  {
    id: 'macif',
    label: 'Macif',
    sublabel: 'Logo marque',
    renderIcon: () => <MacifIcon className="w-9 h-9 shrink-0" />,
  },
  {
    id: 'directassurance',
    label: 'Direct Assur.',
    sublabel: 'Logo marque',
    renderIcon: () => <DirectAssuranceIcon className="w-9 h-9 shrink-0" />,
  },
  {
    id: 'axa',
    label: 'AXA',
    sublabel: 'Logo marque',
    renderIcon: () => <AxaIcon className="w-9 h-9 shrink-0" />,
  },
  {
    id: 'maif',
    label: 'MAIF',
    sublabel: 'Logo marque',
    renderIcon: () => <MaifIcon className="w-9 h-9 shrink-0" />,
  },
  {
    id: 'matmut',
    label: 'Matmut',
    sublabel: 'Logo marque',
    renderIcon: () => <MatmutIcon className="w-9 h-9 shrink-0" />,
  },
  {
    id: 'allianz',
    label: 'Allianz',
    sublabel: 'Logo marque',
    renderIcon: () => <AllianzIcon className="w-9 h-9 shrink-0" />,
  },
  {
    id: 'groupama',
    label: 'Groupama',
    sublabel: 'Logo marque',
    renderIcon: () => <GroupamaIcon className="w-9 h-9 shrink-0" />,
  },
  {
    id: 'maaf',
    label: 'MAAF',
    sublabel: 'Logo marque',
    renderIcon: () => <MaafIcon className="w-9 h-9 shrink-0" />,
  },
  {
    id: 'gmf',
    label: 'GMF',
    sublabel: 'Logo marque',
    renderIcon: () => <GmfIcon className="w-9 h-9 shrink-0" />,
  },
];

const INTERNET_OPTIONS: InternetOption[] = [
  {
    id: 'classic',
    label: 'Icône classique',
    sublabel: 'Wi-Fi simple',
    renderIcon: () => (
      <div className="w-9 h-9 rounded-full bg-[#6366f1] text-white flex items-center justify-center shrink-0 shadow-2xs">
        <WifiOutlineIcon className="w-5 h-5" />
      </div>
    ),
  },
  {
    id: 'logo',
    label: 'Wi-Fi',
    sublabel: 'Badge couleur',
    renderIcon: () => (
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-2xs">
        <WifiIcon className="w-9 h-9" />
      </div>
    ),
  },
  {
    id: 'orange',
    label: 'Orange',
    sublabel: 'Opérateur',
    renderIcon: () => <OrangeIcon className="w-9 h-9 shrink-0" />,
  },
  {
    id: 'sosh',
    label: 'Sosh',
    sublabel: 'Opérateur',
    renderIcon: () => <SoshIcon className="w-9 h-9 shrink-0" />,
  },
  {
    id: 'free',
    label: 'Free',
    sublabel: 'Opérateur',
    renderIcon: () => <FreeIcon className="w-9 h-9 shrink-0" />,
  },
  {
    id: 'bouygues',
    label: 'Bouygues',
    sublabel: 'Opérateur',
    renderIcon: () => <BouyguesIcon className="w-9 h-9 shrink-0" />,
  },
  {
    id: 'sfr',
    label: 'SFR',
    sublabel: 'Opérateur',
    renderIcon: () => <SfrIcon className="w-9 h-9 shrink-0" />,
  },
];

export const SpecialIconStyleSelector: React.FC<SpecialIconStyleSelectorProps> = ({ setToastInfo }) => {
  const { iconPreferences, setAssuranceIconStyle, setInternetIconStyle } = useCategoryVisuals();

  const activeAssuranceOption =
    ASSURANCE_OPTIONS.find((opt) => opt.id === iconPreferences.assurance) || ASSURANCE_OPTIONS[1];
  const activeInternetOption =
    INTERNET_OPTIONS.find((opt) => opt.id === iconPreferences.internet) || INTERNET_OPTIONS[1];

  const handleAssuranceChange = (option: AssuranceOption) => {
    setAssuranceIconStyle(option.id);
    if (setToastInfo) {
      setToastInfo({
        message:
          option.id === 'classic'
            ? "Icône classique sélectionnée pour l'assurance."
            : `Logo ${option.label} sélectionné pour l'assurance.`,
        type: 'info',
      });
    }
  };

  const handleInternetChange = (option: InternetOption) => {
    setInternetIconStyle(option.id);
    if (setToastInfo) {
      setToastInfo({
        message:
          option.id === 'classic'
            ? 'Icône classique sélectionnée pour Internet.'
            : `Logo ${option.label} sélectionné pour Internet.`,
        type: 'info',
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[26px] p-4 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
          <ShieldOutlineIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
            Logos Assurance &amp; Internet
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            Choisissez le logo de votre assureur ou opérateur, ou gardez l&apos;icône classique.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Assurance */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assurance
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              {activeAssuranceOption.label} actif
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ASSURANCE_OPTIONS.map((option) => {
              const isSelected = iconPreferences.assurance === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleAssuranceChange(option)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200/80 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {option.renderIcon()}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {option.label}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {option.sublabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Internet / Opérateurs */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Internet / Opérateur
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              {activeInternetOption.label} actif
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INTERNET_OPTIONS.map((option) => {
              const isSelected = iconPreferences.internet === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleInternetChange(option)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200/80 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {option.renderIcon()}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {option.label}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {option.sublabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

