import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Foyer } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { supabase } from '../supabase/client';
import { 
    DEFAULT_FOYER, 
    DEFAULT_FOYER_ID, 
    fetchFoyerById, 
    createNewFoyer, 
    joinFoyerWithCode, 
    saveFoyerToCloudAndLocal,
    getStoredActiveFoyerId,
    setStoredActiveFoyerId
} from '../utils/foyerService';

const SESSION_KEY = 'expense-app-session-v2';
const PROFILES_KEY = 'expense-app-profiles-v2';

export interface Profile {
    username: string;
    password: string;
    user: User | string;
    foyer_id?: string;
    foyer_name?: string;
    foyer_code?: string;
    color?: string;
    blocked?: boolean;
}

export interface LoginEvent {
    user: User | string;
    timestamp: string;
}

interface Session {
    user: User | string;
    username: string;
    foyer_id: string;
    expiresAt: number;
}

// Initial default profiles for Vincent & Sophie
const INITIAL_PROFILES: Profile[] = [
    { 
        username: 'sophie', 
        password: '12/05/2008', 
        user: User.Sophie, 
        foyer_id: DEFAULT_FOYER_ID, 
        foyer_name: DEFAULT_FOYER.name, 
        foyer_code: DEFAULT_FOYER.code,
        color: '#ec4899'
    },
    { 
        username: 'vincent', 
        password: '12/05/2008', 
        user: User.Vincent, 
        foyer_id: DEFAULT_FOYER_ID, 
        foyer_name: DEFAULT_FOYER.name, 
        foyer_code: DEFAULT_FOYER.code,
        color: '#0ea5e9'
    },
];

export const useAuth = () => {
    const [user, setUser] = useState<User | string | null>(null);
    const [currentFoyer, setCurrentFoyer] = useState<Foyer>(DEFAULT_FOYER);
    const [isLoading, setIsLoading] = useState(true);
    const [profiles, setProfiles] = useLocalStorage<Profile[]>(PROFILES_KEY, INITIAL_PROFILES);
    const [loginHistory, setLoginHistory] = useState<LoginEvent[]>([]);

    // Helper pour logger une visite en base de données
    const logVisit = useCallback(async (userName: User | string) => {
        const LOG_COOLDOWN = 60 * 1000; 
        const storageKey = `last_visit_log_v3_${userName}`;
        const lastLogTime = sessionStorage.getItem(storageKey);
        const now = Date.now();

        if (lastLogTime && (now - parseInt(lastLogTime, 10) < LOG_COOLDOWN)) {
            return;
        }

        try {
            const { error } = await supabase.from('login_logs').insert({
                user_name: String(userName),
                timestamp: new Date().toISOString()
            });

            if (!error) {
                sessionStorage.setItem(storageKey, now.toString());
            }
        } catch {
            // Ignore logging errors
        }
    }, []);

    // Charge l'historique global depuis Supabase
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
                    user: log.user_name,
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
                    const isDuplicate = prev.some(log => 
                        log.user === newLog.user_name && 
                        Math.abs(new Date(log.timestamp).getTime() - new Date(newLog.timestamp).getTime()) < 2000
                    );
                    if (isDuplicate) return prev;
                    return [{
                        user: newLog.user_name,
                        timestamp: newLog.timestamp
                    }, ...prev];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Initial session load
    useEffect(() => {
        const initSession = async () => {
            try {
                // Try reading new v2 session, fallback to old session
                let sessionItem = window.localStorage.getItem(SESSION_KEY);
                if (!sessionItem) {
                    sessionItem = window.localStorage.getItem('expense-app-session');
                }

                if (sessionItem) {
                    const session = JSON.parse(sessionItem);
                    if (session.expiresAt > Date.now()) {
                        setUser(session.user);
                        const foyerId = session.foyer_id || getStoredActiveFoyerId() || DEFAULT_FOYER_ID;
                        const loadedFoyer = await fetchFoyerById(foyerId);
                        if (loadedFoyer) {
                            setCurrentFoyer(loadedFoyer);
                            setStoredActiveFoyerId(loadedFoyer.id);
                        }
                        logVisit(session.user);
                    } else {
                        window.localStorage.removeItem(SESSION_KEY);
                        window.localStorage.removeItem('expense-app-session');
                    }
                }
            } catch (error) {
                console.error("Failed to parse session from localStorage", error);
                window.localStorage.removeItem(SESSION_KEY);
            } finally {
                setIsLoading(false);
            }
        };

        initSession();
    }, [logVisit]);

    const logout = useCallback(() => {
        window.localStorage.removeItem(SESSION_KEY);
        window.localStorage.removeItem('expense-app-session');
        if (user) {
             sessionStorage.removeItem(`last_visit_log_v3_${user}`);
        }
        setUser(null);
    }, [user]);

    // Realtime sync for profiles across devices
    const profileChannelRef = useRef<any>(null);

    const syncProfilesToCloud = useCallback(async (updatedProfiles: Profile[]) => {
        if (profileChannelRef.current) {
            profileChannelRef.current.send({
                type: 'broadcast',
                event: 'user_profiles_changed',
                payload: { profiles: updatedProfiles }
            });
        }
        try {
            // 1. Save each profile individually to prevent overwriting between users/foyers
            for (const p of updatedProfiles) {
                const normUser = p.username.toLowerCase().trim();
                await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `profile_${normUser}`);
                await (supabase.from('push_subscriptions') as any).insert({
                    user_id: `profile_${normUser}`,
                    subscription: p
                });
            }

            // 2. Also keep merged app_user_profiles_v2 up to date
            await (supabase.from('push_subscriptions') as any).delete().eq('user_id', 'app_user_profiles_v2');
            await (supabase.from('push_subscriptions') as any).insert({
                user_id: 'app_user_profiles_v2',
                subscription: { profiles: updatedProfiles }
            });
        } catch (e) {
            console.warn('Could not save user_profiles to Supabase:', e);
        }
    }, []);

    useEffect(() => {
        const fetchProfilesFromCloud = async () => {
            try {
                // Fetch individually saved profiles first (safe against overwrites)
                const { data: individualRows } = await (supabase.from('push_subscriptions') as any)
                    .select('subscription')
                    .like('user_id', 'profile_%');

                // Also fetch global app_user_profiles_v2
                const { data: globalData } = await (supabase.from('push_subscriptions') as any)
                    .select('subscription')
                    .eq('user_id', 'app_user_profiles_v2')
                    .maybeSingle();

                const discoveredProfiles: Profile[] = [];

                if (Array.isArray(individualRows)) {
                    for (const row of individualRows) {
                        if (row.subscription && row.subscription.username) {
                            discoveredProfiles.push(row.subscription as Profile);
                        }
                    }
                }

                if (globalData?.subscription?.profiles && Array.isArray(globalData.subscription.profiles)) {
                    for (const gp of globalData.subscription.profiles) {
                        if (!discoveredProfiles.some(dp => dp.username === gp.username)) {
                            discoveredProfiles.push(gp);
                        }
                    }
                }

                if (discoveredProfiles.length > 0) {
                    setProfiles(prev => {
                        const merged = [...discoveredProfiles];
                        // Merge with existing local profiles so we don't lose any
                        for (const localP of prev) {
                            if (!merged.some(p => p.username === localP.username)) {
                                merged.push(localP);
                            }
                        }
                        // Merge ensuring Vincent & Sophie always exist
                        for (const initP of INITIAL_PROFILES) {
                            if (!merged.some(p => p.username === initP.username)) {
                                merged.push(initP);
                            }
                        }
                        return merged;
                    });
                }
            } catch {
                // Ignore missing table or network error
            }
        };

        fetchProfilesFromCloud();

        const channel = supabase.channel('duobudget_profiles_channel_v2', {
            config: { broadcast: { ack: false, self: true } }
        });

        profileChannelRef.current = channel;

        channel
            .on('broadcast', { event: 'user_profiles_changed' }, (payload: any) => {
                const data = payload?.payload || payload;
                if (data && Array.isArray(data.profiles)) {
                    setProfiles(prev => {
                        const merged = [...data.profiles];
                        for (const p of prev) {
                            if (!merged.some(m => m.username === p.username)) {
                                merged.push(p);
                            }
                        }
                        return merged;
                    });
                }
            })
            .subscribe();

        const intervalId = setInterval(fetchProfilesFromCloud, 10000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(intervalId);
        };
    }, [setProfiles]);

    // Check if active user profile has been blocked by admin
    useEffect(() => {
        if (user) {
            const currentProfile = profiles.find(p => p.user === user || p.username === String(user).toLowerCase());
            if (currentProfile && currentProfile.blocked) {
                logout();
            }
        }
    }, [user, profiles, logout]);

    const loginWithResult = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string; foyer?: Foyer }> => {
        const normalizedUsername = username.toLowerCase().trim();
        let profile = profiles.find(p => p.username === normalizedUsername);

        if (!profile) {
            // Check direct profile row in push_subscriptions
            try {
                const { data } = await (supabase.from('push_subscriptions') as any)
                    .select('subscription')
                    .eq('user_id', `profile_${normalizedUsername}`)
                    .maybeSingle();
                if (data?.subscription) {
                    profile = data.subscription as Profile;
                    setProfiles(prev => [...prev.filter(p => p.username !== normalizedUsername), profile!]);
                }
            } catch {
                // ignore
            }
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        if (!profile) {
            return { success: false, error: 'Nom d’utilisateur ou mot de passe incorrect.' };
        }

        if (profile.blocked) {
            return { success: false, error: 'Ce compte utilisateur a été bloqué par l’administrateur.' };
        }

        if (profile.password === password) {
            const foyerId = profile.foyer_id || DEFAULT_FOYER_ID;
            let foyer: Foyer | null = null;
            if (foyerId === DEFAULT_FOYER_ID) {
                foyer = DEFAULT_FOYER;
            } else {
                foyer = await fetchFoyerById(foyerId);
                // NEVER default a user with a distinct foyer_id to Vincent & Sophie!
                if (!foyer) {
                    foyer = {
                        id: foyerId,
                        name: profile.foyer_name || `Foyer de ${profile.user}`,
                        code: profile.foyer_code || 'FOY-000',
                        created_at: new Date().toISOString(),
                        members: [{
                            id: profile.username,
                            name: String(profile.user),
                            username: profile.username,
                            color: profile.color || '#0ea5e9',
                            role: 'admin',
                            joined_at: new Date().toISOString()
                        }]
                    };
                }
            }
            
            const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
            const session: Session = {
                user: profile.user,
                username: profile.username,
                foyer_id: foyer.id,
                expiresAt: oneYearFromNow,
            };
            window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            setUser(profile.user);
            setCurrentFoyer(foyer);
            setStoredActiveFoyerId(foyer.id);
            
            const newLogEntry: LoginEvent = {
                user: profile.user,
                timestamp: new Date().toISOString()
            };

            setLoginHistory(prev => [newLogEntry, ...prev]);

            supabase.from('login_logs').insert({
                user_name: String(profile.user),
                timestamp: newLogEntry.timestamp
            }).then(({ error }) => {
                if (!error) {
                     sessionStorage.setItem(`last_visit_log_v3_${profile.user}`, Date.now().toString());
                }
            });
            
            return { success: true, foyer };
        }

        return { success: false, error: 'Nom d’utilisateur ou mot de passe incorrect.' };
    }, [profiles, setProfiles]);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        const res = await loginWithResult(username, password);
        return res.success;
    }, [loginWithResult]);

    // Register a new user and create a new Foyer
    const registerWithNewFoyer = useCallback(async (params: {
        name: string;
        username: string;
        password: string;
        foyerName: string;
        color?: string;
    }): Promise<{ success: boolean; error?: string; foyer?: Foyer }> => {
        const normalizedUsername = params.username.toLowerCase().trim();

        if (profiles.some(p => p.username === normalizedUsername)) {
            return { success: false, error: 'Cet identifiant est déjà pris. Veuillez en choisir un autre.' };
        }

        const createRes = await createNewFoyer(params.foyerName, {
            name: params.name,
            username: normalizedUsername,
            color: params.color
        });

        if (!createRes.success || !createRes.foyer) {
            return { success: false, error: createRes.error || 'Erreur lors de la création du foyer.' };
        }

        const newProfile: Profile = {
            username: normalizedUsername,
            password: params.password,
            user: params.name.trim(),
            foyer_id: createRes.foyer.id,
            foyer_name: createRes.foyer.name,
            foyer_code: createRes.foyer.code,
            color: params.color || '#0ea5e9',
        };

        const updated = [...profiles, newProfile];
        setProfiles(updated);
        syncProfilesToCloud(updated);

        // Initialize strictly 3 categories for the new foyer: Dépenses récurrentes, Courses, Carburant
        const initialCategories = ["Dépenses récurrentes", "Courses", "Carburant"];
        const catStorageKey = `expenseCategories_${createRes.foyer.id}`;
        try {
            window.localStorage.setItem(catStorageKey, JSON.stringify(initialCategories));
            // Persist into durable storage
            (async () => {
                try {
                    await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `setting_${catStorageKey}`);
                    await (supabase.from('push_subscriptions') as any).insert({
                        user_id: `setting_${catStorageKey}`,
                        subscription: { value: initialCategories }
                    });
                } catch (e) {
                    console.warn('Could not sync initial categories to cloud:', e);
                }
            })();
        } catch (e) {
            console.warn('Failed to set initial categories in localStorage:', e);
        }

        // Auto login
        const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
        const session: Session = {
            user: newProfile.user,
            username: newProfile.username,
            foyer_id: createRes.foyer.id,
            expiresAt: oneYearFromNow,
        };
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setUser(newProfile.user);
        setCurrentFoyer(createRes.foyer);
        setStoredActiveFoyerId(createRes.foyer.id);

        return { success: true, foyer: createRes.foyer };
    }, [profiles, setProfiles, syncProfilesToCloud]);

    // Register a new user and join an existing Foyer with an invite code
    const registerWithJoinFoyer = useCallback(async (params: {
        name: string;
        username: string;
        password: string;
        inviteCode: string;
        color?: string;
    }): Promise<{ success: boolean; error?: string; foyer?: Foyer }> => {
        const normalizedUsername = params.username.toLowerCase().trim();

        if (profiles.some(p => p.username === normalizedUsername)) {
            return { success: false, error: 'Cet identifiant est déjà pris. Veuillez en choisir un autre.' };
        }

        const joinRes = await joinFoyerWithCode(params.inviteCode, {
            name: params.name,
            username: normalizedUsername,
            color: params.color
        });

        if (!joinRes.success || !joinRes.foyer) {
            return { success: false, error: joinRes.error || 'Code d’invitation introuvable.' };
        }

        const newProfile: Profile = {
            username: normalizedUsername,
            password: params.password,
            user: params.name.trim(),
            foyer_id: joinRes.foyer.id,
            foyer_name: joinRes.foyer.name,
            foyer_code: joinRes.foyer.code,
            color: params.color || '#ec4899',
        };

        const updated = [...profiles, newProfile];
        setProfiles(updated);
        syncProfilesToCloud(updated);

        // Auto login
        const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
        const session: Session = {
            user: newProfile.user,
            username: newProfile.username,
            foyer_id: joinRes.foyer.id,
            expiresAt: oneYearFromNow,
        };
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setUser(newProfile.user);
        setCurrentFoyer(joinRes.foyer);
        setStoredActiveFoyerId(joinRes.foyer.id);

        return { success: true, foyer: joinRes.foyer };
    }, [profiles, setProfiles, syncProfilesToCloud]);

    const updateFoyer = useCallback(async (updatedFoyer: Foyer) => {
        setCurrentFoyer(updatedFoyer);
        await saveFoyerToCloudAndLocal(updatedFoyer);
    }, []);

    const toggleBlockProfile = useCallback((username: string): { success: boolean; message: string } => {
        const normalizedUsername = username.toLowerCase().trim();
        const target = profiles.find(p => p.username === normalizedUsername);
        if (!target) {
            return { success: false, message: 'Utilisateur introuvable.' };
        }
        if (target.username === 'vincent') {
            return { success: false, message: 'Impossible de bloquer le compte administrateur Vincent.' };
        }
        const willBlock = !target.blocked;
        const updated = profiles.map(p => p.username === normalizedUsername ? { ...p, blocked: willBlock } : p);
        setProfiles(updated);
        syncProfilesToCloud(updated);
        return { 
            success: true, 
            message: `L'utilisateur « ${target.username} » a été ${willBlock ? 'bloqué' : 'débloqué'}.` 
        };
    }, [profiles, setProfiles, syncProfilesToCloud]);

    const addProfile = useCallback((newProfile: Profile): boolean => {
        const normalizedUsername = newProfile.username.toLowerCase().trim();
        if (profiles.some(p => p.username === normalizedUsername)) {
            return false; // Username already exists
        }
        const updated = [...profiles, { ...newProfile, username: normalizedUsername }];
        setProfiles(updated);
        syncProfilesToCloud(updated);
        return true;
    }, [profiles, setProfiles, syncProfilesToCloud]);

    const updateProfilePassword = useCallback((username: string, newPassword: string): boolean => {
        const normalizedUsername = username.toLowerCase().trim();
        if (!profiles.some(p => p.username === normalizedUsername)) {
            return false; // User not found
        }
        const updated = profiles.map(p => p.username === normalizedUsername ? { ...p, password: newPassword } : p);
        setProfiles(updated);
        syncProfilesToCloud(updated);
        return true;
    }, [profiles, setProfiles, syncProfilesToCloud]);

    const deleteProfile = useCallback((username: string): boolean => {
        const normalizedUsername = username.toLowerCase().trim();
        if (profiles.length <= 1) {
            return false;
        }
        const profileToDelete = profiles.find(p => p.username === normalizedUsername);
        if (profileToDelete?.user === user) {
            return false;
        }
        const updated = profiles.filter(p => p.username !== normalizedUsername);
        setProfiles(updated);
        syncProfilesToCloud(updated);
        return true;
    }, [profiles, setProfiles, user, syncProfilesToCloud]);

    // Password change for the currently logged-in user
    const changeMyPassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) {
            return { success: false, error: 'Non authentifié.' };
        }
        const currentUsername = String(user).toLowerCase().trim();
        const profile = profiles.find(p => p.username === currentUsername || p.user === user);

        if (!profile) {
            return { success: false, error: 'Profil utilisateur introuvable.' };
        }

        if (profile.password !== currentPassword) {
            return { success: false, error: 'Le mot de passe actuel est incorrect.' };
        }

        if (!newPassword || newPassword.trim().length < 4) {
            return { success: false, error: 'Le nouveau mot de passe doit comporter au moins 4 caractères.' };
        }

        const updated = profiles.map(p => 
            (p.username === profile.username || p.user === user) ? { ...p, password: newPassword.trim() } : p
        );
        setProfiles(updated);
        await syncProfilesToCloud(updated);

        return { success: true };
    }, [user, profiles, setProfiles, syncProfilesToCloud]);

    // Store Compliance (Apple & Google): Delete own account
    const deleteOwnAccount = useCallback(async (confirmPassword?: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'Non authentifié.' };
        const currentUsername = String(user).toLowerCase().trim();
        const profile = profiles.find(p => p.username === currentUsername || p.user === user);

        if (confirmPassword && profile && profile.password !== confirmPassword) {
            return { success: false, error: 'Mot de passe de confirmation incorrect.' };
        }

        // 1. Update foyer members if applicable
        if (currentFoyer && currentFoyer.members) {
            const remainingMembers = currentFoyer.members.filter(m => 
                m.name.toLowerCase() !== String(user).toLowerCase() && 
                m.username?.toLowerCase() !== currentUsername
            );
            if (remainingMembers.length > 0) {
                const updatedFoyer: Foyer = {
                    ...currentFoyer,
                    members: remainingMembers
                };
                setCurrentFoyer(updatedFoyer);
                await saveFoyerToCloudAndLocal(updatedFoyer);
            }
        }

        // 2. Remove profile from profiles
        const updated = profiles.filter(p => p.username !== currentUsername && p.user !== user);
        setProfiles(updated);
        await syncProfilesToCloud(updated);

        // 3. Clear session and log out
        logout();
        return { success: true };
    }, [user, profiles, setProfiles, syncProfilesToCloud, currentFoyer, logout]);
    
    return { 
        user, 
        currentFoyer,
        foyerMembers: currentFoyer?.members || DEFAULT_FOYER.members,
        login, 
        loginWithResult, 
        logout, 
        isLoading, 
        profiles, 
        addProfile, 
        updateProfilePassword, 
        changeMyPassword,
        toggleBlockProfile, 
        deleteProfile, 
        deleteOwnAccount,
        registerWithNewFoyer,
        registerWithJoinFoyer,
        updateFoyer,
        loginHistory 
    };
};
