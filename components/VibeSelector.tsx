
import React from 'react';
import { useTheme, type Vibe } from '../hooks/useTheme';

const VibeOption: React.FC<{ 
    id: Vibe; 
    label: string; 
    colorClass: string; 
    isActive: boolean;
    onClick: () => void;
    isDefault?: boolean;
}> = ({ label, colorClass, isActive, onClick, isDefault }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${isActive ? 'ring-2 ring-brand-500 scale-105 bg-brand-50/50 dark:bg-brand-900/10' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
    >
        <div className={`w-12 h-12 rounded-full shadow-inner ${colorClass}`}></div>
        <div className="flex flex-col items-center">
            <span className={`text-[10px] font-bold uppercase tracking-wider text-center leading-tight ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}>
                {label}
            </span>
            {isDefault && (
                <span className="text-[8px] font-bold text-brand-400 uppercase mt-0.5">Défaut</span>
            )}
        </div>
    </button>
);

const VibeSelector: React.FC = () => {
    const { vibe, changeVibe } = useTheme();

    const options: { id: Vibe, label: string, color: string, isDefault?: boolean }[] = [
        { id: 'cyan', label: 'Bleu', color: 'bg-cyan-500', isDefault: true },
        { id: 'indigo', label: 'Royal', color: 'bg-indigo-500' },
        { id: 'teal', label: 'Lagon', color: 'bg-teal-500' },
        { id: 'emerald', label: 'Forêt', color: 'bg-emerald-500' },
        { id: 'orange', label: 'Énergie', color: 'bg-orange-500' },
        { id: 'amber', label: 'Sable', color: 'bg-amber-500' },
        { id: 'rose', label: 'Sunset', color: 'bg-rose-500' },
        { id: 'fuchsia', label: 'Flash', color: 'bg-fuchsia-500' },
        { id: 'violet', label: 'Galaxie', color: 'bg-violet-500' },
        { id: 'slate', label: 'Nuit', color: 'bg-slate-700' },
    ];

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 py-4">
            {options.map((opt) => (
                <VibeOption
                    key={opt.id}
                    id={opt.id}
                    label={opt.label}
                    colorClass={opt.color}
                    isActive={vibe === opt.id}
                    onClick={() => changeVibe(opt.id)}
                    isDefault={opt.isDefault}
                />
            ))}
        </div>
    );
};

export default VibeSelector;
