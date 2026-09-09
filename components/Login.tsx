import React, { useState, useEffect } from 'react';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import GoogleIcon from './icons/GoogleIcon';
import AppleIcon from './icons/AppleIcon';
import { APP_LOGO_BASE64 } from '../constants/logoBase64';
import CoinOIcon from './icons/CoinOIcon';
import { fetchFoyerByCode } from '../utils/foyerService';
import { Foyer } from '../types';
import { USER_COLORS } from '../utils/userColors';

const SocialAuthButtons: React.FC<{
    onSelect: (provider: 'google' | 'apple') => void;
    loadingProvider: 'google' | 'apple' | null;
    actionLabel?: 'connecter' | 'inscrire' | 'continuer';
}> = ({ onSelect, loadingProvider, actionLabel = 'continuer' }) => {
    const textGoogle = actionLabel === 'inscrire' 
        ? "S'inscrire avec Google" 
        : (actionLabel === 'connecter' ? "Se connecter avec Google" : "Continuer avec Google");
    const textApple = actionLabel === 'inscrire' 
        ? "S'inscrire avec Apple" 
        : (actionLabel === 'connecter' ? "Se connecter avec Apple" : "Continuer avec Apple");

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
            <button
                type="button"
                onClick={() => onSelect('google')}
                disabled={Boolean(loadingProvider)}
                className="flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-100 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs hover:shadow-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
                {loadingProvider === 'google' ? (
                    <div className="w-4 h-4 border-2 border-slate-400/40 border-t-slate-700 dark:border-t-white rounded-full animate-spin" />
                ) : (
                    <GoogleIcon className="w-5 h-5 shrink-0" />
                )}
                <span className="truncate">{textGoogle}</span>
            </button>

            <button
                type="button"
                onClick={() => onSelect('apple')}
                disabled={Boolean(loadingProvider)}
                className="flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-2xl bg-black hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black font-bold text-xs sm:text-sm border border-transparent shadow-2xs hover:shadow-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
                {loadingProvider === 'apple' ? (
                    <div className="w-4 h-4 border-2 border-white/40 dark:border-black/40 border-t-white dark:border-t-black rounded-full animate-spin" />
                ) : (
                    <AppleIcon className="w-5 h-5 shrink-0" />
                )}
                <span className="truncate">{textApple}</span>
            </button>
        </div>
    );
};

const AuthDivider: React.FC<{ label: string }> = ({ label }) => (
    <div className="relative flex items-center justify-center my-2">
        <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
        <span className="bg-white dark:bg-slate-800 px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 select-none">
            {label}
        </span>
    </div>
);

const StyledLockIcon = () => (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const StyledBoltIcon = () => (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.645 20.91l-.007-.003-.003-.001a.75.75 0 01-.125-1.28l4.47-5.375H10.75a.75.75 0 01-.692-.462l-1.5-3.5a.75.75 0 01.127-.828l6.75-8.25a.75.75 0 011.22.84l-4.22 6.325h4.815a.75.75 0 01.672 1.08l-5.25 10.5a.75.75 0 01-.817.436z" />
    </svg>
);

const StyledDeviceIcon = () => (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 18h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const Logo = () => {
    return (
        <div className="relative inline-block mx-auto mb-2">
            <img 
                src={APP_LOGO_BASE64} 
                alt="Logo DuoBudget" 
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain mx-auto rounded-3xl shadow-md border border-slate-100 dark:border-slate-800" 
            />
        </div>
    );
};

interface LoginProps {
    onLogin: (username: string, password: string) => Promise<boolean | { success: boolean; error?: string; foyer?: Foyer }>;
    onRegisterNewFoyer?: (params: { name: string; username: string; password: string; foyerName: string; color?: string }) => Promise<{ success: boolean; error?: string; foyer?: Foyer }>;
    onRegisterJoinFoyer?: (params: { name: string; username: string; password: string; inviteCode: string; color?: string }) => Promise<{ success: boolean; error?: string; foyer?: Foyer }>;
    onLoginWithOAuth?: (provider: 'google' | 'apple') => Promise<{ success: boolean; error?: string; redirected?: boolean }>;
}

export const Login: React.FC<LoginProps> = ({ 
    onLogin, 
    onRegisterNewFoyer, 
    onRegisterJoinFoyer,
    onLoginWithOAuth
}) => {
    const [view, setView] = useState<'welcome' | 'login' | 'create' | 'join'>('welcome');

    // OAuth loading state
    const [oauthLoadingProvider, setOauthLoadingProvider] = useState<'google' | 'apple' | null>(null);

    // Login state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    
    // Create / Join state
    const [regName, setRegName] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [foyerName, setFoyerName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [selectedColor, setSelectedColor] = useState('#0ea5e9');

    // Live verification for invite code
    const [isCheckingCode, setIsCheckingCode] = useState(false);
    const [foundFoyer, setFoundFoyer] = useState<Foyer | null>(null);
    const [codeError, setCodeError] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Live foyer lookup when typing invite code
    useEffect(() => {
        const clean = inviteCode.trim().toUpperCase();
        if (clean.length < 3) {
            setFoundFoyer(null);
            setCodeError('');
            return;
        }

        let isCancelled = false;
        setIsCheckingCode(true);
        setCodeError('');

        const timer = setTimeout(async () => {
            try {
                const foyer = await fetchFoyerByCode(clean);
                if (!isCancelled) {
                    setIsCheckingCode(false);
                    if (foyer) {
                        setFoundFoyer(foyer);
                        setCodeError('');
                    } else {
                        setFoundFoyer(null);
                        if (clean.length >= 6) {
                            setCodeError('Aucun foyer trouvé pour ce code.');
                        }
                    }
                }
            } catch {
                if (!isCancelled) {
                    setIsCheckingCode(false);
                }
            }
        }, 400);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
        };
    }, [inviteCode]);

    const handleOAuth = async (provider: 'google' | 'apple') => {
        setError('');
        setOauthLoadingProvider(provider);
        try {
            if (onLoginWithOAuth) {
                const res = await onLoginWithOAuth(provider);
                if (!res.success && res.error) {
                    setError(res.error);
                }
            }
        } catch (err: any) {
            setError(err?.message || 'Erreur lors de la tentative de connexion.');
        } finally {
            setOauthLoadingProvider(null);
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username.trim() || !password.trim()) {
            setError('Veuillez renseigner votre identifiant et mot de passe.');
            return;
        }
        setIsLoading(true);
        const result = await onLogin(username.trim(), password);
        setIsLoading(false);

        if (typeof result === 'boolean') {
            if (!result) {
                setError('Identifiant ou mot de passe incorrect.');
            }
        } else if (!result.success) {
            setError(result.error || 'Identifiant ou mot de passe incorrect.');
        }
    };

    const handleCreateFoyerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!regName.trim() || !regUsername.trim() || !regPassword.trim()) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        if (!onRegisterNewFoyer) {
            setError('Service de création de foyer indisponible.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await onRegisterNewFoyer({
                name: regName.trim(),
                username: regUsername.trim(),
                password: regPassword,
                foyerName: foyerName.trim() || `Foyer de ${regName.trim()}`,
                color: selectedColor
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

    const handleJoinFoyerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!inviteCode.trim()) {
            setError('Veuillez saisir le code d’invitation du foyer.');
            return;
        }

        if (!regName.trim() || !regUsername.trim() || !regPassword.trim()) {
            setError('Veuillez renseigner votre prénom, identifiant et mot de passe.');
            return;
        }

        if (!onRegisterJoinFoyer) {
            setError('Service de liaison au foyer indisponible.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await onRegisterJoinFoyer({
                name: regName.trim(),
                username: regUsername.trim(),
                password: regPassword,
                inviteCode: inviteCode.trim(),
                color: selectedColor
            });

            if (!res.success) {
                setError(res.error || 'Code d’invitation introuvable ou incorrect.');
            }
        } catch (err: any) {
            setError(err?.message || 'Erreur lors de la liaison au foyer.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForms = () => {
        setError('');
        setCodeError('');
        setFoundFoyer(null);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8 sm:py-12 transition-colors">
            <div className="w-full max-w-lg">
                {/* Header Branding */}
                <div className="text-center mb-6">
                    <Logo />
                    <h1 className="text-3xl sm:text-4xl font-black text-center tracking-tight mb-1.5">
                        <span className="text-[#f32e5e]">Du</span>
                        <CoinOIcon />
                        <span className="text-sky-500">Budget</span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-semibold max-w-sm mx-auto leading-snug">
                        Vos comptes et dépenses partagées, équilibrés et synchronisés en temps réel.
                    </p>
                </div>

                {/* Main Card Container */}
                <div className="bg-white dark:bg-slate-800/95 backdrop-blur-md rounded-3xl shadow-xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/70 transition-all">
                    
                    {/* ============================================================ */}
                    {/* 1. ÉCRAN DE BIENVENUE (WELCOME SCREEN)                       */}
                    {/* ============================================================ */}
                    {view === 'welcome' && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="text-center space-y-1">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                    Bienvenue sur DuoBudget 👋
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    Choisissez comment vous souhaitez commencer :
                                </p>
                            </div>

                            {/* Option 1 : Créer un nouveau foyer */}
                            <button
                                type="button"
                                onClick={() => { resetForms(); setView('create'); }}
                                className="w-full text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#f0f9ff]/90 to-sky-50/50 dark:from-slate-800 dark:to-slate-750 border border-sky-100 dark:border-sky-950/60 hover:border-sky-300 dark:hover:border-sky-750 transition-all group relative overflow-hidden shadow-2xs hover:shadow-xs"
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 group-hover:shadow-lg transition-all shrink-0 bg-sky-500/10 flex items-center justify-center">
                                        <img 
                                            src="/icon-house-3d.png" 
                                            alt="Créer un foyer" 
                                            className="w-full h-full object-cover select-none" 
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                                Créer un nouveau foyer
                                            </h3>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 uppercase tracking-wide">
                                                Nouveau
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                            Démarrez un nouvel espace de dépenses à deux et obtenez un code d’invitation pour votre partenaire.
                                        </p>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all shrink-0 mt-3" />
                                </div>
                            </button>

                            {/* Option 2 : Rejoindre un foyer avec un code */}
                            <button
                                type="button"
                                onClick={() => { resetForms(); setView('join'); }}
                                className="w-full text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#fff1f2]/70 to-rose-50/40 dark:from-slate-800 dark:to-slate-750 border border-pink-100 dark:border-pink-950/60 hover:border-pink-300 dark:hover:border-pink-750 transition-all group relative overflow-hidden shadow-2xs hover:shadow-xs"
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 group-hover:shadow-lg transition-all shrink-0 bg-pink-500/10 flex items-center justify-center">
                                        <img 
                                            src="/icon-chain-3d.png" 
                                            alt="Rejoindre un foyer" 
                                            className="w-full h-full object-cover select-none" 
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                                Rejoindre avec un code
                                            </h3>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 uppercase tracking-wide">
                                                Partenaire
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                            Votre partenaire vous a donné un code d’invitation (ex: <code className="font-mono font-bold bg-pink-100/80 dark:bg-pink-900/40 px-1 py-0.5 rounded text-pink-700 dark:text-pink-300">VIN-SOP</code>) ? Rejoignez son espace !
                                        </p>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-slate-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-all shrink-0 mt-3" />
                                </div>
                            </button>

                            {/* Option 3 : Se connecter à un compte existant */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => { resetForms(); setView('login'); }}
                                    className="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-[#eef2ff] to-[#f5f7ff] dark:from-slate-800 dark:to-slate-750/80 border border-indigo-100/60 dark:border-slate-700/70 hover:border-indigo-300 dark:hover:border-slate-600 shadow-2xs hover:shadow-xs transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-xs group-hover:scale-105 transition-all shrink-0 bg-indigo-500/10 flex items-center justify-center">
                                            <img 
                                                src="/icon-key-3d.png" 
                                                alt="Se connecter" 
                                                className="w-full h-full object-cover select-none" 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm sm:text-base font-extrabold text-indigo-900 dark:text-indigo-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                J'ai déjà un compte : Se connecter
                                            </h3>
                                        </div>
                                        <ChevronRightIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0" />
                                    </div>
                                </button>
                            </div>

                            {/* Option 4 : Connexion & Inscription rapide avec Google et Apple */}
                            <div className="pt-2 space-y-2">
                                <AuthDivider label="Ou avec vos comptes" />
                                <SocialAuthButtons 
                                    onSelect={handleOAuth}
                                    loadingProvider={oauthLoadingProvider}
                                    actionLabel="continuer"
                                />
                            </div>
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* 2. CRÉER UN NOUVEAU FOYER (CREATE VIEW)                      */}
                    {/* ============================================================ */}
                    {view === 'create' && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => { resetForms(); setView('welcome'); }}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
                                >
                                    <ArrowLeftIcon className="w-4 h-4" />
                                    <span>Retour</span>
                                </button>
                                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                                    Étape 1 sur 1
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                                    Créer votre foyer partagé 🏠
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Un code unique sera automatiquement créé pour inviter votre partenaire.
                                </p>
                            </div>

                            {/* Inscription rapide via Google / Apple */}
                            <div className="space-y-2.5 p-3.5 rounded-2xl bg-sky-50/70 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700">
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Inscription rapide en 1 clic :
                                </div>
                                <SocialAuthButtons 
                                    onSelect={handleOAuth}
                                    loadingProvider={oauthLoadingProvider}
                                    actionLabel="inscrire"
                                />
                            </div>

                            <AuthDivider label="ou personnalisez votre foyer" />

                            <form onSubmit={handleCreateFoyerSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Nom du foyer <span className="text-slate-400 font-normal">(ex: Foyer Alexandre & Léa)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={foyerName}
                                        onChange={(e) => setFoyerName(e.target.value)}
                                        placeholder="ex: Foyer Alexandre & Léa"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                            Votre prénom <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={regName}
                                            onChange={(e) => setRegName(e.target.value)}
                                            required
                                            placeholder="ex: Alexandre"
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                            Identifiant (connexion) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={regUsername}
                                            onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                                            required
                                            placeholder="ex: alex"
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Mot de passe <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={isPasswordVisible ? 'text' : 'password'}
                                            value={regPassword}
                                            onChange={(e) => setRegPassword(e.target.value)}
                                            required
                                            placeholder="••••••••"
                                            className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            {isPasswordVisible ? <EyeSlashIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </div>

                                {/* Avatar Color */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                        Couleur de votre avatar
                                    </label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {USER_COLORS.map(c => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setSelectedColor(c.value)}
                                                className={`w-8 h-8 rounded-full ${c.bgClass} flex items-center justify-center transition-all ${
                                                    selectedColor === c.value ? 'ring-3 ring-offset-2 ring-sky-500 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
                                                }`}
                                                title={c.label}
                                            >
                                                {selectedColor === c.value && (
                                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-black text-sm shadow-md hover:shadow-lg transition-all transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                                            <span>Création du foyer en cours...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Créer mon foyer & Commencer</span>
                                            <span>✨</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* 3. REJOINDRE AVEC UN CODE D'INVITATION (JOIN VIEW)           */}
                    {/* ============================================================ */}
                    {view === 'join' && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => { resetForms(); setView('welcome'); }}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-pink-600 dark:text-slate-400 dark:hover:text-pink-400 transition-colors"
                                >
                                    <ArrowLeftIcon className="w-4 h-4" />
                                    <span>Retour</span>
                                </button>
                                <span className="text-xs font-extrabold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                                    Rejoindre un foyer
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                                    Rejoindre un foyer existant 🔗
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Entrez le code d’invitation à 6 ou 7 caractères partagé par votre partenaire.
                                </p>
                            </div>

                            <form onSubmit={handleJoinFoyerSubmit} className="space-y-4">
                                {/* Invite Code Box */}
                                <div className="bg-pink-50/80 dark:bg-pink-950/30 p-3.5 rounded-2xl border-2 border-pink-200 dark:border-pink-900/60 space-y-2">
                                    <label className="block text-xs font-black uppercase tracking-wider text-pink-800 dark:text-pink-300">
                                        Code d’invitation du foyer
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={inviteCode}
                                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                            required
                                            maxLength={10}
                                            placeholder="EXEMPLE: VIN-SOP ou PAR-482"
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-700 font-mono font-black text-base tracking-widest text-center text-slate-900 dark:text-white rounded-xl border border-pink-300 dark:border-pink-800 uppercase focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-inner"
                                        />
                                        {isCheckingCode && (
                                            <div className="absolute right-3 top-3.5">
                                                <div className="w-5 h-5 border-2 border-pink-400/40 border-t-pink-500 rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Live Badge if Foyer Found */}
                                    {foundFoyer && (
                                        <div className="p-2.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
                                            <span className="text-base">🎉</span>
                                            <div>
                                                <div>Foyer trouvé : <strong>{foundFoyer.name}</strong></div>
                                                <div className="text-[11px] font-normal text-emerald-700 dark:text-emerald-300">
                                                    Membres actuels : {foundFoyer.members.map(m => m.name).join(', ')}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {codeError && (
                                        <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold">
                                            {codeError}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                            Votre prénom <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={regName}
                                            onChange={(e) => setRegName(e.target.value)}
                                            required
                                            placeholder="ex: Sophie"
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                            Identifiant (connexion) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={regUsername}
                                            onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                                            required
                                            placeholder="ex: sophie"
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                        Mot de passe <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={isPasswordVisible ? 'text' : 'password'}
                                            value={regPassword}
                                            onChange={(e) => setRegPassword(e.target.value)}
                                            required
                                            placeholder="••••••••"
                                            className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            {isPasswordVisible ? <EyeSlashIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </div>

                                {/* Avatar Color */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                        Couleur de votre avatar
                                    </label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {USER_COLORS.map(c => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setSelectedColor(c.value)}
                                                className={`w-8 h-8 rounded-full ${c.bgClass} flex items-center justify-center transition-all ${
                                                    selectedColor === c.value ? 'ring-3 ring-offset-2 ring-pink-500 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
                                                }`}
                                                title={c.label}
                                            >
                                                {selectedColor === c.value && (
                                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-sm shadow-md hover:shadow-lg transition-all transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                                            <span>Liaison au foyer en cours...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Rejoindre le foyer partagé</span>
                                            <span>🚀</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* 4. CONNEXION CLASSIQUE (LOGIN VIEW)                          */}
                    {/* ============================================================ */}
                    {view === 'login' && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => { resetForms(); setView('welcome'); }}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
                                >
                                    <ArrowLeftIcon className="w-4 h-4" />
                                    <span>Retour</span>
                                </button>
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                    Connexion
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                                    Connexion à votre compte 🔑
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Renseignez votre identifiant pour accéder à vos dépenses.
                                </p>
                            </div>

                            {/* Connexion rapide avec Google & Apple */}
                            <div className="space-y-2.5">
                                <SocialAuthButtons 
                                    onSelect={handleOAuth}
                                    loadingProvider={oauthLoadingProvider}
                                    actionLabel="connecter"
                                />
                                <AuthDivider label="ou avec votre identifiant DuoBudget" />
                            </div>

                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <div>
                                    <label 
                                        htmlFor="username" 
                                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                                    >
                                        Identifiant de connexion
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        placeholder="ex: sophie, vincent, alex..."
                                        autoComplete="username"
                                    />
                                </div>

                                <div>
                                    <label 
                                        htmlFor="password" 
                                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                                    >
                                        Mot de passe
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={isPasswordVisible ? 'text' : 'password'}
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            aria-label={isPasswordVisible ? "Cacher le mot de passe" : "Montrer le mot de passe"}
                                        >
                                            {isPasswordVisible ? <EyeSlashIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-black text-sm shadow-md hover:shadow-lg transition-all transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                                            <span>Connexion en cours...</span>
                                        </>
                                    ) : (
                                        <span>Se connecter</span>
                                    )}
                                </button>
                            </form>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-center flex items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <button
                                    type="button"
                                    onClick={() => { resetForms(); setView('create'); }}
                                    className="hover:text-sky-600 dark:hover:text-sky-400 underline underline-offset-2"
                                >
                                    Créer un foyer
                                </button>
                                <span>•</span>
                                <button
                                    type="button"
                                    onClick={() => { resetForms(); setView('join'); }}
                                    className="hover:text-pink-600 dark:hover:text-pink-400 underline underline-offset-2"
                                >
                                    Rejoindre avec code
                                </button>
                            </div>
                        </div>
                    )}

                    {/* RGPD & Isolation Reassurance Pill Banner */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/80 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px]">
                            <span className="inline-flex items-center gap-1.5 bg-[#e2f0d9]/90 dark:bg-emerald-950/40 border border-[#c5e0b4]/60 dark:border-emerald-900/30 px-3 py-1.5 rounded-xl font-extrabold text-emerald-800 dark:text-emerald-300 shadow-3xs">
                                <StyledLockIcon />
                                <span>Données 100% isolées</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-[#fff2cc]/90 dark:bg-amber-950/40 border border-[#fce4d6]/60 dark:border-amber-900/30 px-3 py-1.5 rounded-xl font-extrabold text-amber-800 dark:text-amber-300 shadow-3xs">
                                <StyledBoltIcon />
                                <span>Temps réel</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-[#e1dff1]/90 dark:bg-indigo-950/40 border border-[#d9d5ec]/60 dark:border-indigo-900/30 px-3 py-1.5 rounded-xl font-extrabold text-[#4f46e5] dark:text-indigo-300 shadow-3xs">
                                <StyledDeviceIcon />
                                <span>Multi-appareils</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
