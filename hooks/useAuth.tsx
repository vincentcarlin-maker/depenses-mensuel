import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { supabase } from '../supabase/client';

const SESSION_KEY = 'expense-app-session';
const PROFILES_KEY = 'expense-app-profiles';

export interface Profile {
    username: string;
    password: string;
    user: User;
    blocked?: boolean;
}

export interface LoginEvent {
    user: User;
    timestamp: string;
}

interface Session {
    user: User;
    expiresAt: number;
}

// Initial default profiles
const INITIAL_PROFILES: Profile[] = [
    { username: 'sophie', password: '12/05/2008', user: User.Sophie },
    { username: 'vincent', password: '12/05/2008', user: User.Vincent },
];

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profiles, setProfiles] = useLocalStorage<Profile[]>(PROFILES_KEY, INITIAL_PROFILES);
    const [loginHistory, setLoginHistory] = useState<LoginEvent[]>([]);

    // Fonction helper pour logger une visite en base de données
    // Utilise sessionStorage pour éviter de spammer la BDD si l'utilisateur rafraîchit la page
    const logVisit = useCallback(async (userName: User) => {
        // Délai réduit à 1 minute pour plus de réactivité
        const LOG_COOLDOWN = 60 * 1000; 
        // Changement de clé (v2) pour forcer la réinitialisation du cache chez l'utilisateur
        const storageKey = `last_visit_log_v2_${userName}`;
        const lastLogTime = sessionStorage.getItem(storageKey);

        const now = Date.now();

        // Si on a déjà loggé une visite il y a moins d'une minute, on ignore
        if (lastLogTime && (now - parseInt(lastLogTime, 10) < LOG_COOLDOWN)) {
            return;
        }

        // Sinon, on enregistre dans Supabase
        const { error } = await supabase.from('login_logs').insert({
            user_name: userName,
            timestamp: new Date().toISOString()
        });

        if (!error) {
            sessionStorage.setItem(storageKey, now.toString());
        } else {
            // Si erreur (ex: table inexistante), on ne bloque pas l'app mais on log en console
            console.warn("Erreur lors de l'enregistrement de la visite:", error.message);
        }
    }, []);

    // Charge l'historique global depuis Supabase et écoute les nouvelles connexions
    useEffect(() => {
        const fetchHistory = async () => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('login_logs')
                .select('*')
                .gte('timestamp', thirtyDaysAgo.toISOString())
                .order('timestamp', { ascending: false });

            if (!error && data) {
                const formattedHistory: LoginEvent[] = data.map((log: any) => ({
                    user: log.user_name as User,
                    timestamp: log.timestamp
                }));
                setLoginHistory(formattedHistory);
            }
        };

        fetchHistory();

        const channel = supabase.channel('public:login_logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'login_logs' }, (payload) => {
                const newLog = payload.new;
                setLoginHistory(prev => {
                    // Éviter les doublons si l'événement vient de nous-même (déjà ajouté optimistiquement)
                    // On vérifie si un log identique existe dans les 2 dernières secondes
                    const isDuplicate = prev.some(log => 
                        log.user === newLog.user_name && 
                        Math.abs(new Date(log.timestamp).getTime() - new Date(newLog.timestamp).getTime()) < 2000
                    );
                    
                    if (isDuplicate) return prev;

                    return [{
                        user: newLog.user_name as User,
                        timestamp: newLog.timestamp
                    }, ...prev];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        try {
            const sessionItem = window.localStorage.getItem(SESSION_KEY);
            if (sessionItem) {
                const session: Session = JSON.parse(sessionItem);
                if (session.expiresAt > Date.now()) {
                    setUser(session.user);
                    // Enregistrer la visite automatique (rechargement de page ou réouverture d'app)
                    logVisit(session.user);
                } else {
                    window.localStorage.removeItem(SESSION_KEY);
                }
            }
        } catch (error) {
            console.error("Failed to parse session from localStorage", error);
            window.localStorage.removeItem(SESSION_KEY);
        } finally {
            setIsLoading(false);
        }
    }, [logVisit]);

    const logout = useCallback(() => {
        window.localStorage.removeItem(SESSION_KEY);
        // On nettoie aussi le tracker de visite pour permettre un re-log immédiat si besoin
        if (user) {
             sessionStorage.removeItem(`last_visit_log_v2_${user}`);
        }
        setUser(null);
    }, [user]);

    // Check if active user profile has been blocked by admin
    useEffect(() => {
        if (user) {
            const currentProfile = profiles.find(p => p.user === user);
            if (currentProfile && currentProfile.blocked) {
                logout();
            }
        }
    }, [user, profiles, logout]);

    const loginWithResult = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        const normalizedUsername = username.toLowerCase().trim();
        const profile = profiles.find(p => p.username === normalizedUsername);

        await new Promise(resolve => setTimeout(resolve, 300));

        if (!profile) {
            return { success: false, error: 'Nom d’utilisateur ou mot de passe incorrect.' };
        }

        if (profile.blocked) {
            return { success: false, error: 'Ce compte utilisateur a été bloqué par l’administrateur.' };
        }

        if (profile.password === password) {
            const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
            const session: Session = {
                user: profile.user,
                expiresAt: oneYearFromNow,
            };
            window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            setUser(profile.user);
            
            const newLogEntry: LoginEvent = {
                user: profile.user,
                timestamp: new Date().toISOString()
            };

            setLoginHistory(prev => [newLogEntry, ...prev]);

            supabase.from('login_logs').insert({
                user_name: profile.user,
                timestamp: newLogEntry.timestamp
            }).then(({ error }) => {
                if (!error) {
                     sessionStorage.setItem(`last_visit_log_v2_${profile.user}`, Date.now().toString());
                }
            });
            
            return { success: true };
        }

        return { success: false, error: 'Nom d’utilisateur ou mot de passe incorrect.' };
    }, [profiles]);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        const res = await loginWithResult(username, password);
        return res.success;
    }, [loginWithResult]);

    const toggleBlockProfile = useCallback((username: string): { success: boolean; message: string } => {
        const normalizedUsername = username.toLowerCase().trim();
        const target = profiles.find(p => p.username === normalizedUsername);
        if (!target) {
            return { success: false, message: 'Utilisateur introuvable.' };
        }
        if (target.user === User.Vincent) {
            return { success: false, message: 'Impossible de bloquer le compte administrateur Vincent.' };
        }
        const willBlock = !target.blocked;
        setProfiles(prev => prev.map(p => p.username === normalizedUsername ? { ...p, blocked: willBlock } : p));
        return { 
            success: true, 
            message: `L'utilisateur « ${target.username} » a été ${willBlock ? 'bloqué' : 'débloqué'}.` 
        };
    }, [profiles, setProfiles]);

    const addProfile = useCallback((newProfile: Profile): boolean => {
        const normalizedUsername = newProfile.username.toLowerCase().trim();
        if (profiles.some(p => p.username === normalizedUsername)) {
            return false; // Username already exists
        }
        setProfiles(prev => [...prev, { ...newProfile, username: normalizedUsername }]);
        return true;
    }, [profiles, setProfiles]);

    const updateProfilePassword = useCallback((username: string, newPassword: string): boolean => {
        const normalizedUsername = username.toLowerCase().trim();
        if (!profiles.some(p => p.username === normalizedUsername)) {
            return false; // User not found
        }
        setProfiles(prev => prev.map(p => p.username === normalizedUsername ? { ...p, password: newPassword } : p));
        return true;
    }, [profiles, setProfiles]);

    const deleteProfile = useCallback((username: string): boolean => {
        const normalizedUsername = username.toLowerCase().trim();
        if (profiles.length <= 1) {
            return false; // Cannot delete the last profile
        }
        const profileToDelete = profiles.find(p => p.username === normalizedUsername);
        if (profileToDelete?.user === user) {
            return false; // Cannot delete currently logged-in user
        }
        setProfiles(prev => prev.filter(p => p.username !== normalizedUsername));
        return true;
    }, [profiles, setProfiles, user]);
    
    return { 
        user, 
        login, 
        loginWithResult, 
        logout, 
        isLoading, 
        profiles, 
        addProfile, 
        updateProfilePassword, 
        toggleBlockProfile, 
        deleteProfile, 
        loginHistory 
    };
};