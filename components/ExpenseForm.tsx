
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { type Expense, type Category, User, type Deduction } from '../types';
import SegmentedControl from './SegmentedControl';
import ConfirmationModal from './ConfirmationModal';
import PiggyBankIcon from './icons/PiggyBankIcon';
import TrashIcon from './icons/TrashIcon';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'date' | 'created_at'>) => void;
  expenses: Expense[];
  initialData?: Omit<Expense, 'id' | 'date' | 'created_at'> | null;
  loggedInUser: User;
  disabled?: boolean;
  categories: Category[];
  groceryStores: string[];
  cars: string[];
  heatingTypes: string[];
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, expenses, initialData, loggedInUser, disabled = false, categories, groceryStores, cars, heatingTypes }) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData ? String(Math.abs(initialData.amount)) : '');
  const [category, setCategory] = useState<Category>(initialData?.category || categories[0] || '');
  const [user, setUser] = useState<User>(initialData?.user || loggedInUser);
  const [transactionType, setTransactionType] = useState<'expense' | 'refund'>(initialData && initialData.amount < 0 ? 'refund' : 'expense');
  
  // Courses specific
  const [store, setStore] = useState(groceryStores[0] || '');
  const [customStore, setCustomStore] = useState('');
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemOwner, setNewItemOwner] = useState<User.Sophie | User.Vincent>(User.Sophie);

  const [error, setError] = useState('');
  const amountInputRef = useRef<HTMLInputElement>(null);

  const addDeduction = () => {
    const price = parseFloat(newItemPrice.replace(',', '.'));
    if (!newItemName.trim() || isNaN(price) || price <= 0) return;
    const deduction: Deduction = { id: crypto.randomUUID(), name: newItemName.trim(), price, user: newItemOwner };
    setDeductions([...deductions, deduction]);
    setNewItemName(''); setNewItemPrice('');
  };

  const removeDeduction = (id: string) => setDeductions(deductions.filter(d => d.id !== id));

  const totalDeductions = useMemo(() => deductions.reduce((sum, d) => sum + d.price, 0), [deductions]);
  const sharedPart = useMemo(() => {
    const total = parseFloat(amount.replace(',', '.'));
    return isNaN(total) ? 0 : Math.max(0, total - totalDeductions);
  }, [amount, totalDeductions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Montant invalide'); return; }
    if (sharedPart < 0) { setError('Les déductions dépassent le total'); return; }

    const finalDesc = category === 'Courses' ? (store === 'Autres' ? customStore : store) : description;
    const metadata = category === 'Courses' && deductions.length > 0 
      ? JSON.stringify({ totalTicket: parsedAmount, deductions }) 
      : undefined;

    onAddExpense({
      description: finalDesc,
      amount: transactionType === 'expense' ? sharedPart : -sharedPart,
      category,
      user,
      metadata
    });

    setAmount(''); setDeductions([]); setDescription(''); setError('');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Nouvelle Dépense</h2>
        {category === 'Courses' && sharedPart > 0 && <span className="text-xs font-bold bg-cyan-100 text-cyan-700 px-2 py-1 rounded">Part Commune : {sharedPart.toFixed(2)}€</span>}
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <SegmentedControl options={[User.Sophie, User.Vincent, User.Commun]} value={user} onChange={setUser} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {category === 'Courses' ? (
          <div className="space-y-4">
            <select value={store} onChange={e => setStore(e.target.value)} className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
              {groceryStores.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="Autres">Autres</option>
            </select>
            {store === 'Autres' && <input type="text" placeholder="Nom du magasin" value={customStore} onChange={e => setCustomStore(e.target.value)} className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg" />}
            
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <p className="text-xs font-bold text-slate-400 uppercase mb-3">Articles personnels à déduire</p>
              <div className="flex gap-2 mb-3">
                <input type="text" placeholder="Article" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm" />
                <input type="text" placeholder="Prix" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-20 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm" />
                <select value={newItemOwner} onChange={e => setNewItemOwner(e.target.value as any)} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs">
                  <option value={User.Sophie}>S</option><option value={User.Vincent}>V</option>
                </select>
                <button type="button" onClick={addDeduction} className="p-2 bg-cyan-500 text-white rounded-lg">+</button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {deductions.map(d => (
                  <div key={d.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg text-xs">
                    <span className="flex-1"><strong>{d.name}</strong> ({d.user === User.Sophie ? 'Sophie' : 'Vincent'})</span>
                    <span className="font-bold mr-3">{d.price.toFixed(2)}€</span>
                    <button type="button" onClick={() => removeDeduction(d.id)} className="text-red-400"><TrashIcon /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg" />
        )}

        <div className="grid grid-cols-2 gap-4">
          <SegmentedControl options={['expense', 'refund']} value={transactionType} onChange={setTransactionType as any} />
          <input type="text" inputMode="decimal" placeholder="Total Ticket €" value={amount} onChange={e => setAmount(e.target.value)} className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold text-center" />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button type="submit" className="w-full py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-all">
          Ajouter {category === 'Courses' ? 'la part commune' : 'la dépense'}
        </button>
      </form>
    </div>
  );
};
export default ExpenseForm;
