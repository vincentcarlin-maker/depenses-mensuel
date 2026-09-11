import React, { useState } from 'react';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import { USER_COLORS } from '../../utils/userColors';
import { SocialAuthButtons, AuthDivider } from './SocialAuthButtons';
import { Foyer } from '../../types';

interface CreateFoyerFormProps {
  onRegisterNewFoyer?: (params: {
    name: string;
    username: string;
    password: string;
    foyerName: string;
    color?: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string; foyer?: Foyer }>;
  onSelectOAuth: (provider: 'google') => void;
  oauthLoadingProvider: 'google' | null;
  onSwitchToLogin: () => void;
  onSwitchToJoin: () => void;
}

export const CreateFoyerForm: React.FC<CreateFoyerFormProps> = ({
  onRegisterNewFoyer,
  onSelectOAuth,
  oauthLoadingProvider,
  onSwitchToLogin,
  onSwitchToJoin,
}) => {
  const [foyerName, setFoyerName] = useState('');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState('#0ea5e9');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = regName.trim();
    const cleanUsername = regUsername.trim().toLowerCase();
    const cleanPassword = regPassword.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanName || !cleanUsername || !cleanPassword) {
      setError('Veuillez remplir votre prénom, identifiant et mot de passe.');
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Veuillez renseigner une adresse email valide.');
      return;
    }

    if (!onRegisterNewFoyer) {
      setError('Service de création indisponible.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onRegisterNewFoyer({
        name: cleanName,
        username: cleanUsername,
        password: cleanPassword,
        foyerName: foyerName.trim() || `Foyer de ${cleanName}`,
        color: selectedColor,
        email: cleanEmail || undefined,
      });

      if (!res.success) {
        setError(res.error || 'Erreur lors de la création du foyer.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la création du foyer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1-Click Fast Register */}
      <div className="space-y-2">
        <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100/80 dark:border-sky-900/40 text-xs text-sky-800 dark:text-sky-200">
          <p className="font-semibold">✨ Inscription rapide en 1 clic :</p>
        </div>
        <SocialAuthButtons
          onSelect={onSelectOAuth}
          loadingProvider={oauthLoadingProvider}
          actionLabel="inscrire"
        />
        <AuthDivider label="ou personnalisez votre foyer" />
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Nom du foyer */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Nom du foyer <span className="text-slate-400 font-normal">(ex: Foyer Duo, Notre Foyer...)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <input
              type="text"
              value={foyerName}
              onChange={(e) => setFoyerName(e.target.value)}
              placeholder="Nom du foyer"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 font-medium transition-all"
            />
          </div>
        </div>

        {/* Prénom & Identifiant */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Votre prénom <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              required
              placeholder="Votre prénom"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 font-medium transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Identifiant (connexion) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              required
              placeholder="identifiant"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 font-medium transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Adresse email <span className="text-slate-400 font-normal">(optionnelle / secours)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <input
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 font-medium transition-all"
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Mot de passe <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 font-medium transition-all"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              {isPasswordVisible ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Couleur de l'avatar */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Couleur de votre profil
          </label>
          <div className="flex flex-wrap gap-2">
            {USER_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                className={`w-7 h-7 rounded-full ${c.bgClass} flex items-center justify-center transition-all ${
                  selectedColor === c.value
                    ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110 shadow-sm'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                title={c.label}
              >
                {selectedColor === c.value && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          id="create-foyer-submit"
          disabled={isLoading}
          className="group relative w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-600 hover:from-sky-600 hover:via-sky-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md hover:shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 overflow-hidden mt-3"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Création de votre foyer...</span>
            </div>
          ) : (
            <>
              <span>Créer mon foyer & commencer</span>
              <ChevronRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {/* Switcher links */}
      <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium cursor-pointer"
        >
          Déjà un compte ? <span className="font-semibold underline underline-offset-2 text-slate-700 dark:text-slate-300">Se connecter</span>
        </button>
        <button
          type="button"
          onClick={onSwitchToJoin}
          className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-medium cursor-pointer"
        >
          Vous avez un code ? <span className="font-semibold underline underline-offset-2 text-slate-700 dark:text-slate-300">Rejoindre</span>
        </button>
      </div>
    </div>
  );
};
