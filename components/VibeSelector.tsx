
import React from 'react';
import { useTheme, type Vibe } from '../hooks/useTheme';

const VibeOption: React.FC<{ 
    id: Vibe; 
    label: string; 
    colorClass: string; 
    isActive: boolean;
    onClick: () => void;
}> = ({ label, colorClass, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${isActive ? 'ring-2 ring-brand-500 scale-105' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
    >
        <div className={`w-12 h-12 rounded-full shadow-inner ${colorClass}`}></div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}>
            {label}
        </span>
    </button>
);

const VibeSelector: React.FC = () => {
    const { vibe, changeVibe } = useTheme();

    const options: { id: Vibe, label: string, color: string }[] = [
        { id: 'cyan', label: 'Ciel', color: 'bg-cyan-500' },
        { id: 'rose', label: 'Sunset', color: 'bg-rose-500' },
        { id: 'emerald', label: 'Forêt', color: 'bg-emerald-500' },
        { id: 'violet', label: 'Nébuleuse', color: 'bg-violet-500' },
        { id: 'amber', label: 'Sable', color: 'bg-amber-500' },
        { id: 'slate', label: 'Nuit', color: 'bg-slate-700' },
    ];

    return (
        <div className="grid grid-cols-3 gap-4 py-4">
            {options.map((opt) => (
                <VibeOption
                    key={opt.id}
                    id={opt.id}
                    label={opt.label}
                    colorClass={opt.color}
                    isActive={vibe === opt.id}
                    onClick={() => changeVibe(opt.id)}
                />
            ))}
        </div>
    );
};

export default VibeSelector;
