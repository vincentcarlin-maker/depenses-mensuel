import React from 'react';
import { type Expense, User, Category } from '../types';
import CategoryIcon from './CategoryIcon';

const KeywordIconMap: { [key: string]: string } = {
  // Restauration rapide
  'mcdo': '🍔',
  'mcdonald': '🍔',
  'mcdonalds': '🍔',
  'burger king': '🍔',
  'kfc': '🍗',
  // Supermarchés
  'leclerc': '🛒',
  'carrefour': '🛒',
  'auchan': '🛒',
  'lidl': '🛒',
  'intermarché': '🛒',
  'super u': '🛒',
  'cora': '🛒',
  'géant': '🛒',
  // E-commerce & Services
  'amazon': '📦',
  'netflix': '🎬',
  'spotify': '🎵',
  'deezer': '🎵',
  'disney+': '🎬',
  // Logement
  'loyer': '🏠',
  'crédit': '🏠',
  // Divers
  'boulangerie': '🥖',
  'pharmacie': '⚕️',
  'doctolib': '🧑‍⚕️',
  'médecin': '🧑‍⚕️',
  // Transport
  'sncf': '🚆',
  'ratp': '🚇',
  'train': '🚆',
  'avion': '✈️',
  'air france': '✈️',
  'uber': '🚗',
  'taxi': '🚕',
  'blablacar': '🚗',
  'essence': '⛽',
  'gasoil': '⛽',
  'total': '⛽',
  'shell': '⛽',
  'esso': '⛽',
  'péage': '🛣️',
  'autoroute': '🛣️',
  // Tech & Fournisseurs
  'boulanger': '🔌',
  'darty': '🔌',
  'orange': '📱',
  'sfr': '📱',
  'bouygues': '📱',
  'free': '📱',
  'edf': '💡',
  'engie': '💡',
  // Vêtements & Bricolage
  'vêtements': '👕',
  'kiabi': '👕',
  'zara': '👕',
  'h&m': '👕',
  'brico dépôt': '🛠️',
  'mr.bricolage': '🛠️',
};

const KeywordDomainMap: { [key: string]: string } = {
  // Supermarchés
  'leclerc': 'e.leclerc',
  'carrefour': 'carrefour.fr',
  'auchan': 'auchan.fr',
  'lidl': 'lidl.fr',
  'intermarché': 'intermarche.com',
  'super u': 'magasins-u.com',
  'monoprix': 'monoprix.fr',
  'franprix': 'franprix.fr',
  'casino': 'supercasino.fr',
  'géant': 'geantcasino.fr',
  'cora': 'cora.fr',
  'picard': 'picard.fr',
  // Restauration rapide
  'mcdo': 'mcdonalds.com',
  'mcdonald\'s': 'mcdonalds.com',
  'mcdonalds': 'mcdonalds.com',
  'burger king': 'burgerking.com',
  'kfc': 'kfc.com',
  'quick': 'quick.fr',
  'domino\'s': 'dominos.com',
  'pizza hut': 'pizzahut.com',
  // E-commerce & Magasins
  'amazon': 'amazon.com',
  'fnac': 'fnac.com',
  'décathlon': 'decathlon.fr',
  'ikea': 'ikea.com',
  'leroy merlin': 'leroymerlin.fr',
  'castorama': 'castorama.fr',
  'brico dépôt': 'bricodepot.fr',
  'mr.bricolage': 'mr-bricolage.fr',
  'sephora': 'sephora.com',
  'kiabi': 'kiabi.com',
  'zara': 'zara.com',
  'h&m': 'hm.com',
  'boulanger': 'boulanger.com',
  'darty': 'darty.com',
  // Services
  'netflix': 'netflix.com',
  'spotify': 'spotify.com',
  'deezer': 'deezer.com',
  'disney+': 'disneyplus.com',
  'sncf': 'sncf-connect.com',
  'air france': 'airfrance.com',
  'ratp': 'ratp.fr',
  'uber': 'uber.com',
  'blablacar': 'blablacar.fr',
  'doctolib': 'doctolib.fr',
  // Énergie & Fournisseurs
  'total': 'totalenergies.fr',
  'shell': 'shell.fr',
  'esso': 'esso.fr',
  'orange': 'orange.fr',
  'sfr': 'sfr.fr',
  'bouygues telecom': 'bouyguestelecom.fr',
  'bouygues': 'bouyguestelecom.fr',
  'free': 'free.fr',
  'edf': 'edf.fr',
  'engie': 'engie.fr',
};

const Logo: React.FC<{ domain: string, alt: string, fallback: React.ReactNode }> = ({ domain, alt, fallback }) => {
    const [hasError, setHasError] = React.useState(false);
    const src = `https://logo.clearbit.com/${domain}`;

    React.useEffect(() => {
        setHasError(false);
    }, [src]);

    if (hasError) {
        return <>{fallback}</>;
    }

    return (
        <img
            src={src}
            alt={alt}
            className="w-full h-full object-contain"
            onError={() => setHasError(true)}
        />
    );
};

const sortedDomainKeywords = Object.keys(KeywordDomainMap).sort((a, b) => b.length - a.length);
const sortedIconKeywords = Object.keys(KeywordIconMap).sort((a, b) => b.length - a.length);

const getExpenseVisual = (description: string, category: Category): React.ReactNode => {
    const lowerDesc = description.toLowerCase();

    for (const keyword of sortedDomainKeywords) {
        if (lowerDesc.includes(keyword)) {
            const domain = KeywordDomainMap[keyword];
            return <Logo domain={domain} alt={description} fallback={<CategoryIcon category={category} />} />;
        }
    }

    for (const keyword of sortedIconKeywords) {
        if (lowerDesc.includes(keyword)) {
             return (
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                    <span className="text-2xl">{KeywordIconMap[keyword]}</span>
                </div>
            );
        }
    }

    return <CategoryIcon category={category} />;
};


const ExpenseListItem: React.FC<{
    expense: Expense;
    onEditExpense: (expense: Expense) => void;
}> = ({ expense, onEditExpense }) => {

    const formattedDate = new Date(expense.date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).replace(' ', ' - ');

    const isSophie = expense.user === User.Sophie;
    const userColorClass = isSophie ? 'bg-rose-500' : 'bg-sky-500';

    return (
        <div
            onClick={() => onEditExpense(expense)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEditExpense(expense); }}
            role="button"
            tabIndex={0}
            className={`
                flex items-center p-3 rounded-xl border border-transparent
                transition-all duration-200 ease-out cursor-pointer 
                hover:bg-slate-100 hover:dark:bg-slate-700/50 hover:border-slate-200 hover:dark:border-slate-700
                focus:outline-none focus:ring-2 focus:ring-cyan-500
            `}
        >
            <div className={`w-1.5 h-10 rounded-full mr-3 ${userColorClass}`}></div>
            <div className="w-10 h-10 flex items-center justify-center mr-3 flex-shrink-0">
                {getExpenseVisual(expense.description, expense.category)}
            </div>
            <div className="flex-1 min-w-0">
                 <p className="font-semibold truncate text-slate-700 dark:text-slate-200" title={expense.description}>{expense.description}</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400 truncate" title={expense.category}>{expense.category}</p>
            </div>
            <div className="pl-4 flex-shrink-0 text-right">
                <p className="font-bold text-slate-800 dark:text-slate-100">
                    {expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{formattedDate}</p>
            </div>
        </div>
    );
};

export default ExpenseListItem;