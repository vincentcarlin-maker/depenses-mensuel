
import React, { useState } from 'react';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';

const Logo = () => (
    <svg width="120" height="120" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4">
        <defs>
            <linearGradient id="loginPinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
            <linearGradient id="loginBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="loginNoteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
            
            <filter id="loginSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="8"></feGaussianBlur>
                <feOffset dx="0" dy="8"></feOffset>
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.15"></feFuncA>
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
            </filter>
        </defs>

        <rect x="60" y="140" width="392" height="230" rx="40" stroke="url(#loginNoteGrad)" strokeWidth="20" filter="url(#loginSoftGlow)"></rect>
        <path d="M120 180H392M120 330H392" stroke="url(#loginNoteGrad)" strokeWidth="4" strokeOpacity="0.2" strokeLinecap="round"></path>
        
        <g filter="url(#loginSoftGlow)">
            <circle cx="210" cy="280" r="90" fill="url(#loginBlueGrad)"></circle>
            <circle cx="210" cy="280" r="70" stroke="white" strokeWidth="4" strokeOpacity="0.4" fill="none"></circle>
            <path d="M225 255C215 250 200 250 190 260C180 270 180 290 190 300C200 310 215 310 225 305M180 275H205M180 285H205" stroke="white" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.9"></path>
        </g>

        <g filter="url(#loginSoftGlow)">
            <circle cx="310" cy="240" r="90" fill="url(#loginPinkGrad)"></circle>
            <circle cx="310" cy="240" r="70" stroke="white" strokeWidth="4" strokeOpacity="0.4" fill="none"></circle>
            <path d="M325 215C315 210 300 210 290 220C280 230 280 250 290 260C300 270 315 270 325 265M280 235H305M280 245H305" stroke="white" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.9"></path>
        </g>
    </svg>
);

interface LoginProps {
    onLogin: (username: string, password: string) => Promise<boolean>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const success = await onLogin(username, password);
        setIsLoading(false);
        if (!success) {
            setError('Nom d’utilisateur ou mot de passe incorrect.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
            <div className="w-full max-w-sm">
                <Logo />
                <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">
                    Suivi des Dépenses
                </h1>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
                    Veuillez vous connecter pour continuer.
                </p>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label 
                                htmlFor="username" 
                                className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2"
                            >
                                Nom d’utilisateur
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                                placeholder="sophie"
                                autoComplete="username"
                            />
                        </div>
                        <div>
                            <label 
                                htmlFor="password" 
                                className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2"
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
                                    className="block w-full px-3 py-2.5 pr-10 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-transparent rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordVisible(prev => !prev)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                                    aria-label={isPasswordVisible ? "Cacher le mot de passe" : "Montrer le mot de passe"}
                                >
                                    {isPasswordVisible ? <EyeSlashIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        
                        {error && (
                            <p className="text-red-500 dark:text-red-400 text-sm text-center animate-shake">
                                {error}
                            </p>
                        )}
                        
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-800 transition-all duration-200 ease-in-out transform hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Connexion...
                                </>
                            ) : (
                                'Se connecter'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
