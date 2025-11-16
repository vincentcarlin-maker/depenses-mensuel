import React, { useState } from 'react';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';

const Logo = () => (
    <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4">
        <rect width="40" height="40" rx="8" className="fill-cyan-500"/>
        <g transform="translate(5, 8)">
            <rect x="12" y="3" width="16" height="10" rx="2" fill="#FBBF24"/>
            <rect x="14" y="8" width="3.5" height="2.5" rx="0.5" fill="#F59E0B"/>
            <path d="M0 10C0 8.89543 0.895431 8 2 8H28C29.1046 8 30 8.89543 30 10V22C30 23.1046 29.1046 24 28 24H2C0.895431 24 0 23.1046 0 22V10Z" fill="#475569"/>
            <path d="M0 13C0 11.8954 0.895431 11 2 11H28C29.1046 11 30 11.8954 30 13V22C30 23.1046 29.1046 24 28 24H2C0.895431 24 0 23.1046 0 22V13Z" fill="#64748B"/>
            <path d="M2 13.5H28" stroke="#94A3B8" strokeWidth="0.75" strokeLinecap="round" strokeDasharray="1.5 1.5"/>
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