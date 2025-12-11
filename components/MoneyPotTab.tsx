
import React, { useState, useMemo } from 'react';
import { type MoneyPotTransaction } from '../types';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import PiggyBankIcon from './icons/PiggyBankIcon';

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

    await onAddTransaction({
      amount: finalAmount,
      description: description.trim(),
      user_name: 'Commun', // Opération anonyme / commune
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
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-20">
             <PiggyBankIcon className="w-32 h-32" />
        </div>
        <div className="relative z-10">
            <h2 className="text-emerald-100 font-medium mb-1">Solde de la cagnotte</h2>
            <p className="text-4xl font-bold tracking-tight">
                {balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="text-emerald-100 text-sm mt-4">
                {transactions.length} opération{transactions.length > 1 ? 's' : ''} enregistrée{transactions.length > 1 ? 's' : ''}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg h-fit">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Nouvelle Opération</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                     <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Type d'opération</label>
                     <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('deposit')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${type === 'deposit' ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Ajouter (+)
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('withdrawal')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${type === 'withdrawal' ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Retirer (-)
                        </button>
                     </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Montant (€)</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Description</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={type === 'deposit' ? "Ex: Vente Vinted, Anniversaire..." : "Ex: Resto, Cadeau..."}
                        className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || !amount || !description}
                    className={`w-full py-3 px-4 rounded-lg text-white font-bold transition-transform active:scale-95 ${type === 'deposit' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isSubmitting ? 'Enregistrement...' : type === 'deposit' ? 'Ajouter à la cagnotte' : 'Retirer de la cagnotte'}
                </button>
            </form>
        </div>

        {/* History List */}
        <div className="space-y-4">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Historique</h3>
             {sortedTransactions.length === 0 ? (
                 <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                     <p className="text-slate-500">Aucune opération pour le moment.</p>
                 </div>
             ) : (
                 <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                     {sortedTransactions.map(t => (
                         <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                             <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.amount > 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                                     {t.amount > 0 ? '+' : '-'}
                                 </div>
                                 <div>
                                     <p className="font-semibold text-slate-800 dark:text-slate-100">{t.description}</p>
                                     <p className="text-xs text-slate-500 dark:text-slate-400">
                                         {new Date(t.date).toLocaleDateString('fr-FR')}
                                     </p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-3">
                                 <span className={`font-bold ${t.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                     {Math.abs(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                 </span>
                                 <button
                                    onClick={() => setDeleteId(t.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    aria-label="Supprimer"
                                 >
                                     <TrashIcon />
                                 </button>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
        </div>
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