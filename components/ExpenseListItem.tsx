import React from 'react';
import { type Expense, User, Category } from '../types';
import ConfirmationModal from './ConfirmationModal';

const CategoryEmojiMap: { [key: string]: string } = {
  "Dépenses obligatoires": '📄',
  "Gasoil": '⛽',
  "Courses": '🛒',
  "Chauffage": '🔥',
  "Divers": '🎉',
};

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
            className="w-6 h-6 object-contain"
            onError={() => setHasError(true)}
        />
    );
};

// Trie les mots-clés par longueur (décroissant) pour trouver les correspondances les plus spécifiques en premier.
const sortedDomainKeywords = Object.keys(KeywordDomainMap).sort((a, b) => b.length - a.length);
const sortedIconKeywords = Object.keys(KeywordIconMap).sort((a, b) => b.length - a.length);

const getExpenseVisual = (description: string, category: Category): React.ReactNode => {
    const lowerDesc = description.toLowerCase();

    for (const keyword of sortedDomainKeywords) {
        if (lowerDesc.includes(keyword)) {
            const domain = KeywordDomainMap[keyword];
            const fallbackEmoji = KeywordIconMap[keyword] || CategoryEmojiMap[category] || '❓';
            return <Logo domain={domain} alt={description} fallback={<span className="text-2xl">{fallbackEmoji}</span>} />;
        }
    }

    for (const keyword of sortedIconKeywords) {
        if (lowerDesc.includes(keyword)) {
            return <span className="text-2xl">{KeywordIconMap[keyword]}</span>;
        }
    }

    return <span className="text-2xl">{CategoryEmojiMap[category] || '❓'}</span>;
};

const UserIndicator: React.FC<{ user: User }> = ({ user }) => {
    const isSophie = user === User.Sophie;
    const initial = user.charAt(0);
    const className = `w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0
        ${isSophie ? 'bg-pink-500 text-white' : 'bg-blue-500 text-white'}`;
    
    return <div className={className}>{initial}</div>;
};

const ExpenseListItem: React.FC<{
    expense: Expense;
    onEditExpense: (expense: Expense) => void;
}> = ({ expense, onEditExpense }) => {

    const formattedDate = new Date(expense.date).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div
            onClick={() => onEditExpense(expense)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEditExpense(expense); }}
            role="button"
            tabIndex={0}
            className={`
                relative bg-slate-50 p-3 rounded-lg border border-slate-200
                transition-all duration-300 ease-out cursor-pointer hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500
            `}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center min-w-0 flex-1">
                    <UserIndicator user={expense.user} />
                    <div className="w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                        {getExpenseVisual(expense.description, expense.category)}
                    </div>
                    <p className="font-semibold truncate" title={expense.description}>{expense.description}</p>
                </div>
                <div className="pl-4 flex-shrink-0">
                    <p className="font-bold text-slate-700 text-right min-w-[80px]">
                        {expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-between mt-1">
                 <div className="flex flex-col items-start text-xs text-slate-500 pl-10 min-w-0">
                    <span className="truncate" title={expense.category}>{expense.category}</span>
                    <span>{formattedDate}</span>
                </div>
            </div>
        </div>
    );
};

export default ExpenseListItem;
