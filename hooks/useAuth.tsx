import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { useLocalStorage } from './useLocalStorage';

const SESSION_KEY = 'expense-app-session';
const PROFILES_KEY = 'expense-app-profiles';

export interface Profile {
    username: string;
    password: string;
    user: User;
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
    
    return { user, login, logout, isLoading, profiles, addProfile, updateProfilePassword, deleteProfile };
};
