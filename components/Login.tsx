import React, { useState } from 'react';
import { Foyer } from '../types';
import { PendingOAuthUser } from '../hooks/useAuth';
import { AuthHeader } from './auth/AuthHeader';
import { LoginForm } from './auth/LoginForm';
import { CreateFoyerForm } from './auth/CreateFoyerForm';
import { JoinFoyerForm } from './auth/JoinFoyerForm';
import { OAuthOnboardingForm } from './auth/OAuthOnboardingForm';
import { AuthTrustFooter } from './auth/AuthTrustFooter';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<boolean | { success: boolean; error?: string; foyer?: Foyer }>;
  onRegisterNewFoyer?: (params: {
    name: string;
    username: string;
    password: string;
    foyerName: string;
    color?: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string; foyer?: Foyer }>;
  onRegisterJoinFoyer?: (params: {
    name: string;
    username: string;
    password: string;
    inviteCode: string;
    color?: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string; foyer?: Foyer }>;
  onLoginWithOAuth?: (provider: 'google') => Promise<{ success: boolean; error?: string; redirected?: boolean }>;
  pendingOAuthUser?: PendingOAuthUser | null;
  onCompleteOAuthRegisterNewFoyer?: (params: {
    foyerName: string;
    name: string;
    username: string;
    color?: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string; foyer?: Foyer }>;
  onCompleteOAuthJoinFoyer?: (params: {
    inviteCode: string;
    name: string;
    username: string;
    color?: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string; foyer?: Foyer }>;
  onCancelOAuthPending?: () => void;
}

export type AuthTab = 'login' | 'create' | 'join';

export const Login: React.FC<LoginProps> = ({
  onLogin,
  onRegisterNewFoyer,
  onRegisterJoinFoyer,
  onLoginWithOAuth,
  pendingOAuthUser,
  onCompleteOAuthRegisterNewFoyer,
  onCompleteOAuthJoinFoyer,
  onCancelOAuthPending,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<'google' | null>(null);

  const handleOAuth = async (provider: 'google') => {
    setOauthLoadingProvider(provider);
    try {
      if (onLoginWithOAuth) {
        await onLoginWithOAuth(provider);
      }
    } catch {
      // Handled in auth hook
    } finally {
      setOauthLoadingProvider(null);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:py-12 selection:bg-sky-500 selection:text-white transition-colors duration-300 overflow-hidden">
      {/* Ambient background glows with Duo color signature */}
      <div className="absolute -top-32 -left-32 w-80 h-80 sm:w-96 sm:h-96 bg-rose-500/15 dark:bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 sm:w-96 sm:h-96 bg-sky-500/15 dark:bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-80 bg-gradient-to-tr from-rose-500/5 to-cyan-500/5 dark:from-rose-500/10 dark:to-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative w-full max-w-lg z-10">
        {/* Header with App Brand */}
        <AuthHeader />

        {/* Main Card Container */}
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] transition-all duration-300">
          {pendingOAuthUser ? (
            /* Google OAuth First-Time Onboarding Flow */
            <OAuthOnboardingForm
              pendingOAuthUser={pendingOAuthUser}
              onCompleteOAuthRegisterNewFoyer={onCompleteOAuthRegisterNewFoyer}
              onCompleteOAuthJoinFoyer={onCompleteOAuthJoinFoyer}
              onCancelOAuthPending={onCancelOAuthPending}
            />
          ) : (
            <div className="space-y-6">
              {/* Sleek Segmented Switcher */}
              <div className="grid grid-cols-3 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-750/70">
                <button
                  type="button"
                  id="tab-login-btn"
                  onClick={() => setActiveTab('login')}
                  className={`py-2 sm:py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'login'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  <span className="truncate">Connexion</span>
                </button>

                <button
                  type="button"
                  id="tab-create-btn"
                  onClick={() => setActiveTab('create')}
                  className={`py-2 sm:py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'create'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span className="truncate">Nouveau foyer</span>
                </button>

                <button
                  type="button"
                  id="tab-join-btn"
                  onClick={() => setActiveTab('join')}
                  className={`py-2 sm:py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'join'
                      ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span className="truncate">Rejoindre</span>
                </button>
              </div>

              {/* Active Tab View */}
              {activeTab === 'login' && (
                <LoginForm
                  onLogin={onLogin}
                  onSelectOAuth={handleOAuth}
                  oauthLoadingProvider={oauthLoadingProvider}
                  onSwitchToCreate={() => setActiveTab('create')}
                  onSwitchToJoin={() => setActiveTab('join')}
                />
              )}

              {activeTab === 'create' && (
                <CreateFoyerForm
                  onRegisterNewFoyer={onRegisterNewFoyer}
                  onSelectOAuth={handleOAuth}
                  oauthLoadingProvider={oauthLoadingProvider}
                  onSwitchToLogin={() => setActiveTab('login')}
                  onSwitchToJoin={() => setActiveTab('join')}
                />
              )}

              {activeTab === 'join' && (
                <JoinFoyerForm
                  onRegisterJoinFoyer={onRegisterJoinFoyer}
                  onSwitchToLogin={() => setActiveTab('login')}
                  onSwitchToCreate={() => setActiveTab('create')}
                />
              )}
            </div>
          )}

          {/* Security and Data Privacy Reassurance */}
          <AuthTrustFooter />
        </div>
      </div>
    </div>
  );
};

export default Login;
