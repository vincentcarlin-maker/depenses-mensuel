import React, { useState, useMemo, useRef, useEffect } from 'react';
import { type Expense, Category, User } from '../types';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'date' | 'created_at'>) => void;
  expenses: Expense[];
  initialData?: Omit<Expense, 'id' | 'date' | 'created_at'> | null;
  loggedInUser: User;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, expenses, initialData, loggedInUser }) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData ? String(Math.abs(initialData.amount)) : '');
  const [category, setCategory] = useState<Category>(initialData?.category || Category.Groceries);
  const [user, setUser] = useState<User>(initialData?.user || loggedInUser);
  const [transactionType, setTransactionType] = useState<'expense' | 'refund'>(initialData && initialData.amount < 0 ? 'refund' : 'expense');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const uniqueDescriptions = useMemo(() => {
    const tagRegex = /(#\w+)/g;
    const allDescriptions = expenses.map(e => e.description.replace(tagRegex, '').trim());
    // FIX: Explicitly typed the Set to `Set<string>` to resolve an issue where
    // TypeScript could not infer the type of the array elements after spreading
    // the Set, which caused a compile error.
    return [...new Set<string>(allDescriptions)].filter(d => d.length > 0);
  }, [expenses]);

  useEffect(() => {
    if (initialData) {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }
  }, []); // Run only on mount, since we are keying the component

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDescription(value);

    if (value.trim().length > 1) {
      const lowerValue = value.toLowerCase();
      const filteredSuggestions = uniqueDescriptions
        .filter(d => 
            d.toLowerCase().includes(lowerValue) && 
            d.toLowerCase() !== lowerValue
        )
        .slice(0, 5);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setDescription(suggestion);
    setSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) {
      setError('La description et le montant sont requis.');
      return;
    }
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Veuillez entrer un montant positif.');
      return;
    }

    const finalAmount = transactionType === 'expense' ? parsedAmount : -parsedAmount;
    
    const finalDescription = description.trim();

    onAddExpense({
      description: finalDescription,
      amount: finalAmount,
      category,
      user,
    });
    
    // Clear form only on normal submission, not on pre-filled submission
    // because the parent remounts the component anyway via the key prop.
    if (!initialData) {
        setDescription('');
        setAmount('');
        setCategory(Category.Groceries);
        setTransactionType('expense');
        setError('');
        setSuggestions([]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Ajouter une Transaction</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Qui a payé ?</label>
          <div className="relative flex w-full bg-slate-100 dark:bg-slate-700 rounded-full p-1">
            <span
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-slate-800 shadow-md transition-transform duration-300 ease-in-out
                ${user === User.Vincent ? 'translate-x-full' : 'translate-x-0'}
              `}
              aria-hidden="true"
            />
            <button type="button" onClick={() => setUser(User.Sophie)} className={`relative z-10 w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${user === User.Sophie ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
              Sophie
            </button>
            <button type="button" onClick={() => setUser(User.Vincent)} className={`relative z-10 w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${user === User.Vincent ? 'text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'}`}>
              Vincent
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
            Catégorie
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="block w-full pl-3 pr-10 py-2.5 text-base bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent sm:text-sm rounded-lg"
          >
            {Object.values(Category).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
            Description
          </label>
          <div className="relative">
            <input
              type="text"
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              onFocus={(e) => handleDescriptionChange(e)}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
              placeholder="Ex: McDo, Courses Leclerc..."
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm"
                    onMouseDown={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Type</label>
              <div className="relative flex w-full bg-slate-100 dark:bg-slate-700 rounded-full p-1">
                <span
                  className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-slate-800 shadow-md transition-transform duration-300 ease-in-out
                    ${transactionType === 'refund' ? 'translate-x-full' : 'translate-x-0'}
                  `}
                  aria-hidden="true"
                />
                <button type="button" onClick={() => setTransactionType('expense')} className={`relative z-10 w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${transactionType === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                  Dépense
                </button>
                <button type="button" onClick={() => setTransactionType('refund')} className={`relative z-10 w-1/2 p-2 rounded-full text-sm font-semibold transition-colors ${transactionType === 'refund' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                  Remb.
                </button>
              </div>
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              Montant (€)
            </label>
            <input
              ref={amountInputRef}
              type="text"
              inputMode="decimal"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>
        </div>
        {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-800 transition-all duration-200 ease-in-out transform hover:shadow-lg hover:-translate-y-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span>Ajouter</span>
        </button>
      </form>
    </div>
  );
};

export default ExpenseForm;