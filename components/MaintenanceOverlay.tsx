import React, { useState } from 'react';
import { APP_LOGO_BASE64 } from '../constants/logoBase64';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';

interface MaintenanceOverlayProps {
  onAdminLogin?: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({ onAdminLogin }) => {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [username, setUsername] = useState('vincent');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAdminLogin) return;
    setLoginError('');
    setIsSubmitting(true);

    const res = await onAdminLogin(username, password);
    setIsSubmitting(false);

    if (!res.success) {
      setLoginError(res.error || 'Accès administrateur refusé.');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 text-white font-sans overflow-y-auto">
      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 my-auto">
        {/* Logo and Maintenance Wrench Badge */}
        <div className="relative inline-block mx-auto">
          <img
            src={APP_LOGO_BASE64}
            alt="Logo DuoBudget"
            className="w-20 h-20 object-contain mx-auto rounded-2xl shadow-lg border border-slate-700/50"
          />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center text-xl font-bold shadow-lg animate-bounce">
            🛠️
          </div>
        </div>

        {/* Header Titles */}
        <div className="space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
            Mode Maintenance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Application en maintenance
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
            DuoBudget est temporairement indisponible. L'administrateur effectue une opération de maintenance ou de mise à jour.
          </p>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-2xl bg-slate-700/50 border border-slate-600/50 text-left space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
            <span>⏳</span>
            <span>Reprise très prochaine</span>
          </div>
          <p className="text-slate-400 leading-snug">
            Vos données de dépenses et de cagnotte restent synchronisées en toute sécurité. Merci de patienter quelques instants.
          </p>
        </div>

        {/* Admin Login Toggle Button */}
        {!showAdminLogin ? (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdminLogin(true)}
              className="text-xs font-semibold text-slate-400 hover:text-amber-400 underline underline-offset-4 transition-colors cursor-pointer"
            >
              Vous êtes administrateur ? Connexion Administrateur
            </button>
          </div>
        ) : (
          /* Admin Login Form */
          <div className="pt-2 border-t border-slate-700/80 text-left space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Accès Administrateur
              </h3>
              <button
                type="button"
                onClick={() => setShowAdminLogin(false)}
                className="text-slate-400 hover:text-white text-xs font-medium"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Identifiant Administrateur
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="vincent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {loginError && (
                <p className="text-xs font-bold text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Vérification...' : 'Se connecter en tant qu’Administrateur'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
