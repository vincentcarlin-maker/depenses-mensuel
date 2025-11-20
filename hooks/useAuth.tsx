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

    // Charge l'historique global depuis Supabase et écoute les nouvelles connexions
    useEffect(() => {
        const fetchHistory = async () => {
            const { data, error } = await supabase
                .from('login_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50);

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
                setLoginHistory(prev => [{
                    user: newLog.user_name as User,
                    timestamp: newLog.timestamp
                }, ...prev].slice(0, 50));
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
    }, []);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        const normalizedUsername = username.toLowerCase().trim();
        const profile = profiles.find(p => p.username === normalizedUsername);

        await new Promise(resolve => setTimeout(resolve, 500));

        if (profile && profile.password === password) {
            const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
            const session: Session = {
                user: profile.user,
                expiresAt: oneYearFromNow,
            };
            window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            setUser(profile.user);
            
            // Enregistrement de la connexion dans Supabase (Historique Global)
            // On ne bloque pas l'UI si ça échoue (fire and forget)
            supabase.from('login_logs').insert({
                user_name: profile.user,
                timestamp: new Date().toISOString()
            }).then(({ error }) => {
                if (error) console.warn("Erreur lors de l'enregistrement de la connexion:", error.message);
            });
            
            return true;
        }
        return false;
    }, [profiles]);

    const logout = useCallback(() => {
        window.localStorage.removeItem(SESSION_KEY);
        setUser(null);
    }, []);

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
    
    return { user, login, logout, isLoading, profiles, addProfile, updateProfilePassword, deleteProfile, loginHistory };
};