import React, { useState, useEffect, useRef } from 'react';
import { type Expense, User, Category } from '../types';
import EditIcon from './icons/EditIcon';
import ConfirmationModal from './ConfirmationModal';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
}

const CategoryEmojiMap: { [key: string]: string } = {
  "Dépenses obligatoires": '📄',
  "Gasoil": '⛽',
  "Courses": '🛒',
  "Chauffage": '🔥',
  "Divers": '🎉',
};

const KeywordIconMap: { [key: string]: string } = {
  'mcdo': '🍔',
  'mcdonald': '🍔',
  'burger king': '🍔',
  'kfc': '🍗',
  'leclerc': '🛒',
  'carrefour': '🛒',
  'auchan': '🛒',
  'lidl': '🛒',
  'intermarché': '🛒',
  'super u': '🛒',
  'amazon': '📦',
  'netflix': '🎬',
  'spotify': '🎵',
  'disney+': '🎬',
  'loyer': '🏠',
  'crédit': '🏠',
  'boulangerie': '🥖',
  'pharmacie': '⚕️',
  'sncf': '🚆',
  'ratp': '🚇',
  'essence': '⛽',
  'gasoil': '⛽',
  'total': '⛽',
  'shell': '⛽',
  'esso': '⛽',
};

const KeywordDomainMap: { [key: string]: string } = {
  'leclerc': 'e.leclerc',
  'carrefour': 'carrefour.fr',
  'auchan': 'auchan.fr',
  'lidl': 'lidl.fr',
  'intermarché': 'intermarche.com',
  'super u': 'magasins-u.com',
  'monoprix': 'monoprix.fr',
  'franprix': 'franprix.fr',
  'casino': 'supercasino.fr',
  'picard': 'picard.fr',
  'mcdo': 'mcdonalds.fr',
  'mcdonald\'s': 'mcdonalds.fr',
  'burger king': 'burgerking.fr',
  'kfc': 'kfc.fr',
  'quick': 'quick.fr',
  'domino\'s': 'dominos.fr',
  'pizza hut': 'pizzahut.fr',
  'amazon': 'amazon.fr',
  'fnac': 'fnac.com',
  'décathlon': 'decathlon.fr',
  'ikea': 'ikea.com',
  'leroy merlin': 'leroymerlin.fr',
  'castorama': 'castorama.fr',
  'sephora': 'sephora.fr',
  'netflix': 'netflix.com',
  'spotify': 'spotify.com',
  'disney+': 'disneyplus.com',
  'sncf': 'sncf-connect.com',
  'ratp': 'ratp.fr',
  'total': 'totalenergies.fr',
  'shell': 'shell.fr',
  'esso': 'esso.fr',
};

const Logo: React.FC<{ domain: string, alt: string, fallback: React.ReactNode }> = ({ domain, alt, fallback }) => {
    const [hasError, setHasError] = useState(false);
    const src = `https://logo.clearbit.com/${domain}`;

    useEffect(() => {
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

const getExpenseVisual = (description: string, category: Category): React.ReactNode => {
    const lowerDesc = description.toLowerCase();

    for (const keyword in KeywordDomainMap) {
        if (lowerDesc.includes(keyword)) {
            const domain = KeywordDomainMap[keyword];
            const fallbackEmoji = KeywordIconMap[keyword] || CategoryEmojiMap[category] || '❓';
            return <Logo domain={domain} alt={description} fallback={<span className="text-2xl">{fallbackEmoji}</span>} />;
        }
    }
    for (const keyword in KeywordIconMap) {
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
    onDeleteExpense: (id: string) => void;
    onEditExpense: (expense: Expense) => void;
    openExpenseId: string | null;
    setOpenExpenseId: (id: string | null) => void;
}> = ({ expense, onDeleteExpense, onEditExpense, openExpenseId, setOpenExpenseId }) => {
    const [dragState, setDragState] = useState<{ startX: number; currentX: number } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    const isSwiped = openExpenseId === expense.id;
    const isDragging = dragState !== null;
    const SWIPE_THRESHOLD = -60;
    const DELETE_BUTTON_WIDTH = 80;

    const getPointerX = (e: React.PointerEvent | PointerEvent) => e.clientX;

    const handlePointerDown = (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        
        if (openExpenseId && openExpenseId !== expense.id) {
            setOpenExpenseId(null);
        }
        
        setDragState({ startX: getPointerX(e), currentX: getPointerX(e) });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    
     useEffect(() => {
        if (!dragState) return;

        const handlePointerMove = (e: PointerEvent) => {
             setDragState(prev => prev ? { ...prev, currentX: getPointerX(e) } : null);
        };

        const handlePointerUp = (e: PointerEvent) => {
            const finalX = getPointerX(e);
            // Use a local copy of dragState because the state might not have updated yet
            setDragState(currentDragState => {
                if (!currentDragState) return null;
                const deltaX = finalX - currentDragState.startX;
                if (deltaX < SWIPE_THRESHOLD) {
                    setOpenExpenseId(expense.id);
                } else {
                    setOpenExpenseId(null);
                }
                return null;
            });
        };
    
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [dragState, expense.id, setOpenExpenseId]);

    let transformX = 0;
    if (isDragging) {
        const deltaX = dragState.currentX - dragState.startX;
        transformX = Math.max(-DELETE_BUTTON_WIDTH * 1.2, Math.min(0, deltaX));
    } else if (isSwiped) {
        transformX = -DELETE_BUTTON_WIDTH;
    }

    const handleDeleteClick = () => {
        setIsConfirmModalOpen(true);
    };
    
    const executeDelete = () => {
        setIsConfirmModalOpen(false);
        setIsDeleting(true);
        // The timeout allows the fade-out animation to finish before the
        // component is removed from the DOM.
        setTimeout(() => {
            onDeleteExpense(expense.id);
        }, 300); // This duration must match the CSS transition duration.
    };

    const formattedDate = new Date(expense.date).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <>
            <div className={`
                relative bg-slate-100 rounded-lg overflow-hidden transition-all duration-300 ease-out
                ${isDeleting ? 'opacity-0 max-h-0 !my-0 !py-0 !border-0' : 'max-h-40'}
            `}>
                <div className="absolute top-0 right-0 h-full flex items-center z-0">
                    <button
                        onClick={handleDeleteClick}
                        className="bg-red-600 text-white font-bold h-full flex items-center justify-center transition-colors hover:bg-red-700"
                        style={{ width: `${DELETE_BUTTON_WIDTH}px` }}
                        aria-label={`Supprimer ${expense.description}`}
                    >
                        Supprimer
                    </button>
                </div>
                <div
                    onPointerDown={handlePointerDown}
                    className="relative bg-slate-50 p-3 w-full touch-pan-y"
                    style={{ 
                        transform: `translateX(${transformX}px)`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                        cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center flex-grow min-w-0">
                            <UserIndicator user={expense.user} />
                            <div className="w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">
                                {getExpenseVisual(expense.description, expense.category)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold truncate">{expense.description}</p>
                                <p className="text-sm text-slate-500">{expense.category} · {formattedDate}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end pl-4 flex-shrink-0">
                             <p className="font-bold text-slate-700 text-right mr-2 min-w-[80px]">
                                {expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </p>
                            <button
                                onClick={() => onEditExpense(expense)}
                                className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-100 rounded-full transition-colors z-10"
                                aria-label="Modifier la dépense"
                            >
                                <EditIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setOpenExpenseId(null);
                }}
                onConfirm={executeDelete}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer la dépense "${expense.description}" ? Cette action est irréversible.`}
            />
        </>
    );
};


const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDeleteExpense, onEditExpense }) => {
  const [openExpenseId, setOpenExpenseId] = useState<string | null>(null);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-500">Aucune dépense ne correspond à votre recherche. 🧐</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {expenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((expense) => (
            <ExpenseListItem
                key={expense.id}
                expense={expense}
                onDeleteExpense={onDeleteExpense}
                onEditExpense={onEditExpense}
                openExpenseId={openExpenseId}
                setOpenExpenseId={setOpenExpenseId}
            />
        ))}
    </div>
  );
};

export default ExpenseList;