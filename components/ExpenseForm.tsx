import React, { useState, useMemo } from 'react';
import { type Expense, Category, User } from '../types';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'date' | 'created_at'>) => void;
  expenses: Expense[];
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, expenses }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(Category.Groceries);
  const [user, setUser] = useState<User>(User.Sophie);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const uniqueDescriptions = useMemo(() => {
    const allDescriptions = expenses.map(e => e.description.trim());
    return [...new Set(allDescriptions)];
  }, [expenses]);

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
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Veuillez entrer un montant valide.');
      return;
    }

    onAddExpense({
      description,
      amount: parsedAmount,
      category,
      user,
    });

    setDescription('');
    setAmount('');
    setCategory(Category.Groceries);
    setError('');
    setSuggestions([]);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Ajouter une Dépense</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Qui a payé ?</label>
          <div className="flex w-full bg-slate-100 rounded-lg p-1">
            <button type="button" onClick={() => setUser(User.Sophie)} className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${user === User.Sophie ? 'bg-pink-500 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
              Sophie
            </button>
            <button type="button" onClick={() => setUser(User.Vincent)} className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${user === User.Vincent ? 'bg-blue-500 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
              Vincent
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-600">
            Catégorie
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
          >
            {Object.values(Category).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-600">
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
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
              placeholder="Ex: McDo, Courses Leclerc..."
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 cursor-pointer hover:bg-slate-100 text-slate-700 text-sm"
                    onMouseDown={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-600">
            Montant (€)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            placeholder="0.00"
            step="0.01"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
        >
          Ajouter
        </button>
      </form>
    </div>
  );
};

export default ExpenseForm;