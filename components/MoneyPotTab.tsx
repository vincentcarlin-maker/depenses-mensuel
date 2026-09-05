
import React, { useState, useMemo } from 'react';
import { type MoneyPotTransaction } from '../types';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';

interface MoneyPotTabProps {
  transactions: MoneyPotTransaction[];
  onAddTransaction: (transaction: Omit<MoneyPotTransaction, 'id' | 'created_at'>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

const MoneyPotTab: React.FC<MoneyPotTabProps> = ({ transactions, onAddTransaction, onDeleteTransaction }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isBouncing, setIsBouncing] = useState(false);

  const balance = useMemo(() => {
    return transactions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setIsSubmitting(true);
    
    // Si c'est un retrait, on met le montant en négatif
    const finalAmount = type === 'deposit' ? parsedAmount : -parsedAmount;

    if (type === 'deposit') {
      setIsBouncing(true);
      setTimeout(() => {
        setIsBouncing(false);
      }, 300);
    }

    await onAddTransaction({
      amount: finalAmount,
      description: description.trim(),
      user_name: 'Commun',
      date: new Date().toISOString(),
    });

    setAmount('');
    setDescription('');
    setIsSubmitting(false);
  };

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Title & Subtitle matching reference */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Cagnotte
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base flex items-center gap-1.5">
          Notre épargne commune, pour nos projets <span>💚</span>
        </p>
      </div>

      {/* Top Card: Solde de la cagnotte */}
      <div className="relative pt-2 sm:pt-4">
        <div className="relative rounded-[26px] bg-gradient-to-r from-[#059669] via-[#10b981] to-[#34d399] p-5 sm:p-7 text-white shadow-lg shadow-emerald-600/15 min-h-[145px] sm:min-h-[160px] flex items-center">
          {/* Text Content - Always clearly visible */}
          <div className="space-y-1 relative z-10 max-w-[50%] sm:max-w-[54%]">
            <h2 className="text-white/95 text-xs sm:text-base font-semibold tracking-wide">
              Solde de la cagnotte
            </h2>
            <p className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight py-1 truncate">
              {balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </p>
            <p className="text-white/85 text-[11px] sm:text-sm font-medium pt-0.5">
              {transactions.length} opération{transactions.length > 1 ? 's' : ''} enregistrée{transactions.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* 3D Piggy Bank Illustration - En superposition, décalé encore plus vers la gauche */}
          <div className="absolute right-8 sm:right-14 md:right-20 lg:right-24 -bottom-3 sm:-bottom-5 -top-3 sm:-top-5 w-[42%] sm:w-[38%] md:w-[210px] lg:w-[230px] max-w-[240px] pointer-events-none select-none flex items-center justify-center z-20">
            <img
              src="/piggy-bank.png"
              alt="Tirelire cagnotte"
              className={`w-full h-full object-contain drop-shadow-[0_12px_25px_rgba(0,0,0,0.32)] transition-transform ${
                isBouncing ? 'animate-piggy-bounce' : ''
              }`}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Form Card: Nouvelle opération */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-[26px] shadow-sm border border-slate-100 dark:border-slate-700/60">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Nouvelle opération
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 mb-6">
          Ajoutez ou retirez de l'argent de votre cagnotte commune.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Operation type pill selector */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Type d'opération
            </label>
            <div className="flex bg-[#f0f4f8] dark:bg-slate-900/60 p-1.5 rounded-2xl gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setType('deposit')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  type === 'deposit'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    type === 'deposit'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-300 dark:bg-slate-600 text-white'
                  }`}
                >
                  +
                </span>
                <span>Ajouter (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('withdrawal')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  type === 'withdrawal'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-600 text-rose-800 dark:text-rose-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    type === 'withdrawal'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-300 dark:bg-slate-600 text-white'
                  }`}
                >
                  −
                </span>
                <span>Retirer (-)</span>
              </button>
            </div>
          </div>

          {/* Amount field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Montant (€)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00 €"
              className="block w-full px-4 py-3.5 bg-[#f0f4f8] dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-medium text-base transition-all"
            />
          </div>

          {/* Description field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'deposit' ? 'Ex: Vente Vinted, Anniversaire...' : 'Ex: Resto, Cadeau...'}
              className="block w-full px-4 py-3.5 bg-[#f0f4f8] dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-medium text-base transition-all"
            />
          </div>

          {/* Submit button with arrow matching reference */}
          <button
            type="submit"
            disabled={isSubmitting || !amount || !description}
            className={`w-full py-3.5 px-5 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              type === 'deposit'
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
            }`}
          >
            <span>
              {isSubmitting
                ? 'Enregistrement...'
                : type === 'deposit'
                ? 'Ajouter à la cagnotte'
                : 'Retirer de la cagnotte'}
            </span>
            {!isSubmitting && (
              <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </form>
      </div>

      {/* History section */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-[26px] shadow-sm border border-slate-100 dark:border-slate-700/60 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Historique des opérations
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {sortedTransactions.length}
          </span>
        </div>

        {sortedTransactions.length === 0 ? (
          <div className="text-center py-10 bg-[#f0f4f8]/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/80">
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
              Aucune opération pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {sortedTransactions.map((t) => (
              <div
                key={t.id}
                className="bg-[#f0f4f8]/60 dark:bg-slate-900/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/40 dark:border-slate-700/40 flex justify-between items-center group hover:border-emerald-300/60 dark:hover:border-emerald-700/60 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      t.amount > 0
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                    }`}
                  >
                    {t.amount > 0 ? '+' : '−'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                      {t.description}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(t.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`font-bold text-sm sm:text-base ${
                      t.amount > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {t.amount > 0 ? '+' : ''}
                    {t.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </span>
                  <button
                    onClick={() => setDeleteId(t.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                    aria-label="Supprimer"
                    title="Supprimer"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) onDeleteTransaction(deleteId);
          setDeleteId(null);
        }}
        title="Supprimer l'opération ?"
        message="Cette action est irréversible et modifiera le solde de la cagnotte."
      />
    </div>
  );
};

export default MoneyPotTab;