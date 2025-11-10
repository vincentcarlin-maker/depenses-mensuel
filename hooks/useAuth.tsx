import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';

const SESSION_KEY = 'expense-app-session';

interface Session {
    user: User;
    expiresAt: number;
}

// Hardcoded profiles for login
const PROFILES: { [key: string]: { password: string; user: User } } = {
    sophie: { password: '12/05/2008', user: User.Sophie },
    vincent: { password: '12/05/2008', user: User.Vincent },
};

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
        const profile = PROFILES[normalizedUsername];

        // Simulate network delay
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
    }, []);

    const logout = useCallback(() => {
        window.localStorage.removeItem(SESSION_KEY);
        setUser(null);
    }, []);
    
    return { user, login, logout, isLoading };
};