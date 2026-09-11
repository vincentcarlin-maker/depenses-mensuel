import React, { useState, useMemo, useRef } from 'react';
import { type MoneyPotTransaction } from '../types';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import piggyBankImg from '../src/assets/piggy-bank.png';
import { useSyncedSettings } from '../hooks/useSyncedSettings';


export interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  category: string;
  created_at: string;
}

const DEFAULT_GOALS: SavingsGoal[] = [
  {
    id: 'goal-vacances',
    title: "Vacances d'été",
    target_amount: 1500,
    category: 'Vacances',
    created_at: new Date().toISOString(),
  },
  {
    id: 'goal-achat-commun',
    title: 'Achat commun',
    target_amount: 800,
    category: 'Achat commun',
    created_at: new Date().toISOString(),
  },
];

interface MoneyPotTabProps {
  transactions: MoneyPotTransaction[];
  onAddTransaction: (transaction: Omit<MoneyPotTransaction, 'id' | 'created_at'>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  currentFoyerId?: string;
  setToastInfo?: (info: { message: string; type: 'success' | 'error' | 'warning' } | null) => void;
}

export const MoneyPotTab: React.FC<MoneyPotTabProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  currentFoyerId,
  setToastInfo,
}) => {
  const foyerKey = currentFoyerId || 'default';

  // Objectifs d'épargne partagés
  const [isSavingsGoalsEnabled, setIsSavingsGoalsEnabled] = useSyncedSettings<boolean>(
    `savings_goals_enabled_${foyerKey}`,
    true
  );

  const [goals, setGoals] = useSyncedSettings<SavingsGoal[]>(
    `savings_goals_${foyerKey}`,
    DEFAULT_GOALS
  );

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  // Modal creation d'objectif
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Vacances');

  // Modal edition d'objectif
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  const balance = useMemo(() => {
    return transactions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setIsSubmitting(true);
    
    // Si c'est un retrait, montant négatif dans le solde global de la cagnotte
    const finalAmount = type === 'deposit' ? parsedAmount : -parsedAmount;

    if (type === 'deposit') {
      setIsBouncing(true);
      setTimeout(() => {
        setIsBouncing(false);
      }, 300);
    }

    const goalLabel = selectedGoalId ? ` (${goals.find(g => g.id === selectedGoalId)?.title || ''})` : '';

    await onAddTransaction({
      amount: finalAmount,
      description: `${description.trim()}${goalLabel}`,
      user_name: 'Commun',
      date: new Date().toISOString(),
    });

    setAmount('');
    setDescription('');
    setSelectedGoalId('');
    setIsSubmitting(false);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !newGoalTarget) return;

    const targetNum = parseFloat(newGoalTarget.replace(',', '.'));
    if (isNaN(targetNum) || targetNum <= 0) return;

    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle.trim(),
      target_amount: targetNum,
      category: newGoalCategory,
      created_at: new Date().toISOString(),
    };

    setGoals([...goals, newGoal]);
    setNewGoalTitle('');
    setNewGoalTarget('');
    setIsGoalModalOpen(false);

    if (setToastInfo) {
      setToastInfo({ message: `Objectif "${newGoal.title}" créé !`, type: 'success' });
    }
  };

  const handleSaveEditGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editingGoal.title.trim()) return;

    setGoals(goals.map(g => (g.id === editingGoal.id ? editingGoal : g)));
    setEditingGoal(null);

    if (setToastInfo) {
      setToastInfo({ message: 'Objectif d\'épargne mis à jour !', type: 'success' });
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
    if (setToastInfo) {
      setToastInfo({ message: 'Objectif d\'épargne supprimé.', type: 'success' });
    }
  };

  const handleContributeToGoal = (goal: SavingsGoal) => {
    setSelectedGoalId(goal.id);
    setType('deposit');
    setDescription(`Objectif : ${goal.title}`);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Calculate saved amount per goal based on transactions referring to that goal
  const goalSavedAmounts = useMemo(() => {
    const map = new Map<string, number>();
    goals.forEach(g => {
      const totalForGoal = transactions.reduce((sum, t) => {
        if (t.description.toLowerCase().includes(g.title.toLowerCase())) {
          return sum + t.amount;
        }
        return sum;
      }, 0);
      map.set(g.id, Math.max(0, totalForGoal));
    });
    return map;
  }, [goals, transactions]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Cagnotte & Épargne
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base flex items-center gap-1.5">
          Notre épargne commune et nos objectifs de projets <span>💚</span>
        </p>
      </div>

      {/* Top Card: Solde de la cagnotte */}
      <div className="relative pt-2 sm:pt-4">
        <div className="relative rounded-[26px] bg-gradient-to-r from-[#059669] via-[#10b981] to-[#34d399] p-5 sm:p-7 text-white shadow-lg shadow-emerald-600/15 min-h-[145px] sm:min-h-[160px] flex items-center">
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

          <div className="absolute right-8 sm:right-14 md:right-20 lg:right-24 -bottom-3 sm:-bottom-5 -top-3 sm:-top-5 w-[42%] sm:w-[38%] md:w-[210px] lg:w-[230px] max-w-[240px] pointer-events-none select-none flex items-center justify-center z-20">
            <img
              src={piggyBankImg || "piggy-bank.png"}
              alt="Tirelire cagnotte"
              className={`w-full h-full object-contain drop-shadow-[0_12px_25px_rgba(0,0,0,0.32)] transition-transform ${
                isBouncing ? 'animate-piggy-bounce' : ''
              }`}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('piggy-bank.png')) {
                  target.src = 'piggy-bank.png';
                }
              }}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* SECTION: Objectifs d'épargne partagés */}
      {isSavingsGoalsEnabled && (
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-[26px] shadow-xs border border-slate-100 dark:border-slate-700/60 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Objectifs d'épargne partagés
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Projets communs : vacances, achat commun, équipement...
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsGoalModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Créer un objectif</span>
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/80">
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium">
                Aucun objectif d'épargne pour l'instant.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {goals.map((goal) => {
                const saved = goalSavedAmounts.get(goal.id) || 0;
                const percent = Math.min(100, Math.round((saved / goal.target_amount) * 100));
                const isVacances = goal.category === 'Vacances' || goal.title.toLowerCase().includes('vacances');

                return (
                  <div
                    key={goal.id}
                    className="bg-slate-50/80 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between space-y-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          isVacances
                            ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300'
                        }`}>
                          {isVacances ? <span className="text-lg">🌴</span> : <span className="text-lg">🛋️</span>}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {goal.title}
                          </h4>
                          <span className="inline-block text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            {goal.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingGoal(goal)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          title="Modifier l'objectif"
                        >
                          <svg className="w-4 h-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Supprimer l'objectif"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-300">
                          {saved.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} € / {goal.target_amount.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} €
                        </span>
                        <span className={percent >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                          {percent} %
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            percent >= 100
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleContributeToGoal(goal)}
                      className="w-full py-1.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-200 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-700/80 transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>+ Alimenter cet objectif</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Form Card: Nouvelle opération */}
      <div ref={formRef} className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-[26px] shadow-sm border border-slate-100 dark:border-slate-700/60">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Nouvelle opération
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 mb-6">
          Ajoutez ou retirez de l'argent de votre cagnotte commune.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Operation type selector */}
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
                    type === 'deposit' ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-600 text-white'
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
                    type === 'withdrawal' ? 'bg-rose-500 text-white' : 'bg-slate-300 dark:bg-slate-600 text-white'
                  }`}
                >
                  −
                </span>
                <span>Retirer (-)</span>
              </button>
            </div>
          </div>

          {/* Target goal association */}
          {isSavingsGoalsEnabled && goals.length > 0 && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Associer à un objectif d'épargne (optionnel)
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => {
                  setSelectedGoalId(e.target.value);
                  const selectedGoal = goals.find(g => g.id === e.target.value);
                  if (selectedGoal) {
                    setDescription(`Objectif : ${selectedGoal.title}`);
                  }
                }}
                className="block w-full px-4 py-3 bg-[#f0f4f8] dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm"
              >
                <option value="">Aucun objectif spécifique (Cagnotte générale)</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.category})
                  </option>
                ))}
              </select>
            </div>
          )}

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
              placeholder={
                type === 'deposit'
                  ? 'Ex: Versement Vacances, Vente Vinted...'
                  : 'Ex: Resto, Achat canapé...'
              }
              className="block w-full px-4 py-3.5 bg-[#f0f4f8] dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-medium text-base transition-all"
            />
          </div>

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
            {sortedTransactions.map((t) => {
              const isDeposit = t.amount > 0;

              return (
                <div
                  key={t.id}
                  className="bg-[#f0f4f8]/60 dark:bg-slate-900/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/40 dark:border-slate-700/40 flex justify-between items-center group hover:border-emerald-300/60 dark:hover:border-emerald-700/60 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        isDeposit
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300'
                      }`}
                    >
                      {isDeposit ? '+' : '−'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                        {t.description}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {new Date(t.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-extrabold text-sm sm:text-base ${
                        isDeposit
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isDeposit ? '+' : ''}
                      {t.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Créer un objectif d'épargne */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Nouvel objectif d'épargne
              </h3>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Intitulé du projet
                </label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="Ex: Vacances au Japon, Achat canapé..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Objectif cible (€)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  placeholder="Ex: 1500"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catégorie
                </label>
                <select
                  value={newGoalCategory}
                  onChange={(e) => setNewGoalCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Vacances">Vacances 🌴</option>
                  <option value="Achat commun">Achat commun 🛋️</option>
                  <option value="Voiture">Voiture 🚗</option>
                  <option value="Équipement">Équipement 💻</option>
                  <option value="Divers">Divers ✨</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-white shadow-sm"
                >
                  Créer l'objectif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Éditer un objectif d'épargne */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Modifier l'objectif
              </h3>
              <button
                type="button"
                onClick={() => setEditingGoal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Intitulé du projet
                </label>
                <input
                  type="text"
                  required
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Objectif cible (€)
                </label>
                <input
                  type="number"
                  required
                  value={editingGoal.target_amount}
                  onChange={(e) => setEditingGoal({ ...editingGoal, target_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catégorie
                </label>
                <select
                  value={editingGoal.category}
                  onChange={(e) => setEditingGoal({ ...editingGoal, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Vacances">Vacances 🌴</option>
                  <option value="Achat commun">Achat commun 🛋️</option>
                  <option value="Voiture">Voiture 🚗</option>
                  <option value="Équipement">Équipement 💻</option>
                  <option value="Divers">Divers ✨</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-white shadow-sm"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyPotTab;
