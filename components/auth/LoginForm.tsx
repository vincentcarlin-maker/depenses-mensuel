import React, { useState } from 'react';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import { SocialAuthButtons, AuthDivider } from './SocialAuthButtons';

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<boolean | { success: boolean; error?: string }>;
  onSelectOAuth: (provider: 'google') => void;
  oauthLoadingProvider: 'google' | null;
  onSwitchToCreate: () => void;
  onSwitchToJoin: () => void;
  onClaimLegacyAccount?: (params: { token: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onSelectOAuth,
  oauthLoadingProvider,
  onSwitchToCreate,
  onSwitchToJoin,
  onClaimLegacyAccount,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mode activation de compte historique
  const [isClaimMode, setIsClaimMode] = useState(false);
  const [claimToken, setClaimToken] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPassword, setClaimPassword] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setClaimSuccess('');

    if (!claimToken.trim() || !claimEmail.trim() || !claimPassword.trim()) {
      setError('Veuillez remplir tous les champs pour activer votre compte.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimEmail.trim())) {
      setError('Veuillez renseigner une adresse email valide.');
      return;
    }

    if (claimPassword.trim().length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (!onClaimLegacyAccount) {
      setError("Le service d'activation n'est pas disponible.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await onClaimLegacyAccount({
        token: claimToken.trim(),
        email: claimEmail.trim(),
        password: claimPassword.trim()
      });

      if (!res.success) {
        setError(res.error || "Erreur lors de l'activation du compte.");
      } else {
        setClaimSuccess("Compte activé avec succès ! Connexion en cours...");
      }
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'activation du compte.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim();
    if (!cleanUsername || !password.trim()) {
      setError('Veuillez renseigner votre identifiant et mot de passe.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onLogin(cleanUsername, password);
      if (typeof result === 'boolean') {
        if (!result) {
          setError('Identifiant ou mot de passe incorrect.');
        }
      } else if (!result.success) {
        setError(result.error || 'Identifiant ou mot de passe incorrect.');
      }
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isClaimMode) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
            <span className="text-base">🔐</span>
            <span>Activation d'un compte historique</span>
          </div>
          <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
            Pour les comptes historiques sans mot de passe serveur ou sans email (ex : Sophie), renseignez votre jeton d'activation remis par votre administrateur de foyer et définissez votre mot de passe personnel sécurisé.
          </p>
        </div>

        {claimSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            ✓ {claimSuccess}
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-shake">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleClaimSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Jeton d'activation
            </label>
            <input
              type="text"
              value={claimToken}
              onChange={(e) => setClaimToken(e.target.value)}
              placeholder="Ex: ACT-SOPHIE-FOYER-7392"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-xs font-mono tracking-wider focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Votre adresse email personnelle
            </label>
            <input
              type="email"
              value={claimEmail}
              onChange={(e) => setClaimEmail(e.target.value)}
              placeholder="votre.email@exemple.fr"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Choisissez votre nouveau mot de passe
            </label>
            <input
              type="password"
              value={claimPassword}
              onChange={(e) => setClaimPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? "Vérification et activation..." : "Activer et lier mon compte"}
          </button>

          <button
            type="button"
            onClick={() => { setIsClaimMode(false); setError(''); }}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium py-1.5 cursor-pointer"
          >
            ← Revenir à la connexion habituelle
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1-Click Social Sign-In */}
      <div className="space-y-2">
        <SocialAuthButtons
          onSelect={onSelectOAuth}
          loadingProvider={oauthLoadingProvider}
          actionLabel="connecter"
        />
        <AuthDivider label="ou avec votre identifiant" />
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-shake">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifiant */}
        <div>
          <label
            htmlFor="login-username"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Identifiant
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <input
              type="text"
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="Votre identifiant"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:focus:ring-sky-500/20 font-medium transition-all"
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Mot de passe
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:focus:ring-sky-500/20 font-medium transition-all"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
              aria-label={isPasswordVisible ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
            >
              {isPasswordVisible ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          id="login-submit-button"
          disabled={isLoading}
          className="group relative w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-600 hover:from-sky-600 hover:via-sky-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md hover:shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 overflow-hidden mt-2"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Connexion en cours...</span>
            </div>
          ) : (
            <>
              <span>Se connecter</span>
              <ChevronRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {/* Quick contextual links */}
      <div className="pt-2 flex flex-col items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
        <div className="w-full flex items-center justify-between">
          <button
            type="button"
            onClick={onSwitchToCreate}
            className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium cursor-pointer"
          >
            Nouveau ? <span className="font-semibold underline underline-offset-2 text-slate-700 dark:text-slate-300">Créer un foyer</span>
          </button>
          <button
            type="button"
            onClick={onSwitchToJoin}
            className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-medium cursor-pointer"
          >
            Vous avez un code ? <span className="font-semibold underline underline-offset-2 text-slate-700 dark:text-slate-300">Rejoindre</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => { setIsClaimMode(true); setError(''); }}
          className="text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 transition-colors font-semibold flex items-center gap-1.5 py-1 px-3 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 cursor-pointer"
        >
          <span>🔑</span>
          <span>Compte historique sans mot de passe ? Activer avec un jeton</span>
        </button>
      </div>
    </div>
  );
};
