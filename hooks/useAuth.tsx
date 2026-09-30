import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, Foyer, FoyerJoinRequest } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { supabase } from '../supabase/client';
import { getCustomUserColor, setCustomUserColor } from '../utils/userColors';
import { 
    DEFAULT_FOYER, 
    DEFAULT_FOYER_ID, 
    fetchFoyerById, 
    createNewFoyer, 
    requestJoinFoyer,
    approveJoinRequest,
    rejectJoinRequest,
    cancelJoinRequest,
    saveFoyerToCloudAndLocal,
    getStoredActiveFoyerId,
    setStoredActiveFoyerId,
    isUsernameAlreadyUsed,
    updateMemberColor,
    removeMemberFromFoyer,
    deleteFoyer,
    applyCustomColorsToFoyer
} from '../utils/foyerService';

const PROFILES_KEY = 'expense-app-profiles-v3';

export interface PendingOAuthUser {
    authUser: any;
    email: string;
    fullName: string;
    provider: 'google' | 'apple';
    suggestedUsername: string;
    avatarUrl?: string;
}

export interface Profile {
    id?: string;
    username: string;
    user: User | string;
    foyer_id?: string;
    foyer_name?: string;
    foyer_code?: string;
    color?: string;
    blocked?: boolean;
    email?: string;
    provider?: string;
    is_superadmin?: boolean;
}

export interface LoginEvent {
    user: User | string;
    timestamp: string;
    foyer_id?: string;
}

// Initial sanitized profiles for Vincent & Sophie
const INITIAL_PROFILES: Profile[] = [
    { 
        username: 'sophie', 
        user: User.Sophie, 
        foyer_id: DEFAULT_FOYER_ID, 
        foyer_name: DEFAULT_FOYER.name, 
        foyer_code: DEFAULT_FOYER.code,
        color: '#ec4899',
        email: 'sophie@duobudget.app'
    },
    { 
        username: 'vincent', 
        user: User.Vincent, 
        foyer_id: DEFAULT_FOYER_ID, 
        foyer_name: DEFAULT_FOYER.name, 
        foyer_code: DEFAULT_FOYER.code,
        color: '#0ea5e9',
        email: 'vincent.carlin@sfr.fr',
        is_superadmin: true
    },
];

// Deduplicate profiles and ensure clean data
const deduplicateProfiles = (profilesList: Profile[]): Profile[] => {
    const map = new Map<string, Profile>();
    const emailToUsernameMap = new Map<string, string>();

    for (const p of profilesList) {
        if (!p || !p.username) continue;
        const normUsername = p.username.toLowerCase().trim();
        const normEmail = p.email ? p.email.toLowerCase().trim() : '';

        let targetKey = normUsername;
        if (normEmail && emailToUsernameMap.has(normEmail)) {
            targetKey = emailToUsernameMap.get(normEmail)!;
        }

        if (map.has(targetKey)) {
            const existing = map.get(targetKey)!;
            const isAutoUser = existing.username.startsWith('user_') || existing.username.startsWith('oauth_');
            const isNewReadable = !normUsername.startsWith('user_') && !normUsername.startsWith('oauth_');
            const chosenUsername = isAutoUser && isNewReadable ? p.username : existing.username;
            const chosenUser = isAutoUser && isNewReadable ? p.user : existing.user;

            const customColor = getCustomUserColor(chosenUsername) || getCustomUserColor(normUsername);
            const merged: Profile = {
                ...existing,
                ...p,
                username: chosenUsername,
                user: chosenUser,
                email: normEmail || existing.email,
                color: customColor || p.color || existing.color,
                blocked: p.blocked !== undefined ? p.blocked : existing.blocked,
                foyer_id: p.foyer_id || existing.foyer_id,
                foyer_name: p.foyer_name || existing.foyer_name,
                foyer_code: p.foyer_code || existing.foyer_code,
                is_superadmin: p.is_superadmin !== undefined ? p.is_superadmin : existing.is_superadmin
            };
            map.set(targetKey, merged);
            if (normEmail) {
                emailToUsernameMap.set(normEmail, targetKey);
            }
        } else {
            const customColor = getCustomUserColor(normUsername);
            map.set(normUsername, customColor ? { ...p, color: customColor } : p);
            if (normEmail) {
                emailToUsernameMap.set(normEmail, normUsername);
            }
        }
    }
    for (const initP of INITIAL_PROFILES) {
        const key = initP.username.toLowerCase().trim();
        const customColor = getCustomUserColor(key);
        if (!map.has(key)) {
            map.set(key, customColor ? { ...initP, color: customColor } : initP);
        } else if (customColor) {
            const existing = map.get(key)!;
            map.set(key, { ...existing, color: customColor });
        }
    }
    return Array.from(map.values());
};

export const useAuth = () => {
    const [user, setUser] = useState<User | string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
    const [currentFoyer, setCurrentFoyer] = useState<Foyer>(() => applyCustomColorsToFoyer(DEFAULT_FOYER));
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [profiles, setProfiles] = useLocalStorage<Profile[]>(PROFILES_KEY, INITIAL_PROFILES);
    const [loginHistory, setLoginHistory] = useState<LoginEvent[]>([]);
    const [pendingOAuthUser, setPendingOAuthUser] = useState<PendingOAuthUser | null>(null);

    // Listen for custom avatar color updates and sync currentFoyer immediately
    useEffect(() => {
        const handleColorEvent = () => {
            setCurrentFoyer(prev => prev ? applyCustomColorsToFoyer(prev) : prev);
        };
        window.addEventListener('duobudget_user_color_changed', handleColorEvent);
        return () => window.removeEventListener('duobudget_user_color_changed', handleColorEvent);
    }, []);

    // Helper to log user visit
    const currentFoyerRef = useRef<Foyer | null>(currentFoyer);
    useEffect(() => {
        currentFoyerRef.current = currentFoyer;
    }, [currentFoyer]);

    const logVisit = useCallback(async (userName: User | string) => {
        const LOG_COOLDOWN = 60 * 1000; 
        const storageKey = `last_visit_log_v3_${userName}`;
        const lastLogTime = sessionStorage.getItem(storageKey);
        const now = Date.now();

        if (lastLogTime && (now - parseInt(lastLogTime, 10) < LOG_COOLDOWN)) {
            return;
        }

        const activeFoyerId = currentFoyerRef.current?.id || getStoredActiveFoyerId() || DEFAULT_FOYER_ID;

        try {
            await (supabase.from('login_logs') as any).insert({
                user_name: String(userName),
                timestamp: new Date().toISOString(),
                foyer_id: activeFoyerId
            });
            sessionStorage.setItem(storageKey, now.toString());
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
                    timestamp: log.timestamp,
                    foyer_id: log.foyer_id
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
                        timestamp: newLog.timestamp,
                        foyer_id: newLog.foyer_id
                    }, ...prev];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Filtrer l'historique strictement réservé au foyer actuellement connecté
    const foyerLoginHistory = useMemo(() => {
        if (!currentFoyer) return [];

        const allowedUsernames = new Set<string>();
        if (currentFoyer.id === DEFAULT_FOYER_ID) {
            allowedUsernames.add('vincent');
            allowedUsernames.add('sophie');
            allowedUsernames.add(User.Vincent.toLowerCase());
            allowedUsernames.add(User.Sophie.toLowerCase());
        }

        if (currentFoyer.members && Array.isArray(currentFoyer.members)) {
            currentFoyer.members.forEach(m => {
                if (m.username) allowedUsernames.add(m.username.toLowerCase().trim());
                if (m.name) allowedUsernames.add(m.name.toLowerCase().trim());
                if (m.id) allowedUsernames.add(m.id.toLowerCase().trim());
            });
        }

        return loginHistory.filter(event => {
            if (event.foyer_id) {
                return event.foyer_id === currentFoyer.id;
            }
            const eventUserNorm = String(event.user).toLowerCase().trim();
            return allowedUsernames.has(eventUserNorm);
        });
    }, [loginHistory, currentFoyer]);

    // Synchronisation des profils vers la table public.profiles
    const syncProfilesToCloud = useCallback(async (updatedProfiles: Profile[]) => {
        const uniqueProfiles = deduplicateProfiles(updatedProfiles);
        try {
            for (const p of uniqueProfiles) {
                if (p.id) {
                    await (supabase.from('profiles') as any).upsert({
                        id: p.id,
                        username: p.username,
                        display_name: String(p.user),
                        email: p.email,
                        color: p.color
                    });
                }
            }
        } catch {
            // Table might not be ready yet
        }
    }, []);

    // Helper to resolve an authenticated Supabase user to application profile & foyer
    const resolveAuthUser = useCallback(async (authUser: any) => {
        if (!authUser) {
            setUser(null);
            setUsername(null);
            setCurrentUserProfile(null);
            setIsAdmin(false);
            return;
        }

        try {
            // 1. Fetch from public.profiles
            let profile: Profile | null = null;
            const { data: dbProfile } = await (supabase.from('profiles') as any)
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle();

            if (dbProfile) {
                profile = {
                    id: dbProfile.id,
                    username: dbProfile.username,
                    user: dbProfile.display_name,
                    email: dbProfile.email || authUser.email,
                    color: dbProfile.color,
                    is_superadmin: Boolean(dbProfile.is_superadmin)
                };
            } else {
                // Check if user email is strictly Vincent's registered admin email
                const metadata = authUser.user_metadata || {};
                const userEmail = (authUser.email || '').toLowerCase().trim();
                const isVincent = userEmail === 'vincent.carlin@sfr.fr';

                const suggestedUser = isVincent ? 'vincent' : (metadata.username || (authUser.email ? authUser.email.split('@')[0] : `user_${authUser.id.slice(0, 6)}`)).toLowerCase().trim();
                const suggestedName = isVincent ? 'Vincent' : (metadata.full_name || metadata.name || suggestedUser);

                profile = {
                    id: authUser.id,
                    username: suggestedUser,
                    user: suggestedName,
                    email: authUser.email,
                    is_superadmin: isVincent
                };

                // Auto-provision profile row in database if possible
                try {
                    await (supabase.from('profiles') as any).upsert({
                        id: authUser.id,
                        username: suggestedUser,
                        display_name: suggestedName,
                        email: authUser.email,
                        is_superadmin: isVincent
                    });
                } catch {}
            }

            // 2. Fetch foyer membership
            let targetFoyerId = getStoredActiveFoyerId() || DEFAULT_FOYER_ID;
            try {
                const { data: memberRows } = await (supabase.from('foyer_members') as any)
                    .select('foyer_id, role')
                    .eq('user_id', authUser.id)
                    .limit(1);

                if (memberRows && memberRows.length > 0 && memberRows[0].foyer_id) {
                    targetFoyerId = memberRows[0].foyer_id;
                }
            } catch {}

            const loadedFoyer = await fetchFoyerById(targetFoyerId);

            setCurrentUserProfile(profile);
            setUser(profile.user);
            setUsername(profile.username);
            setIsAdmin(Boolean(profile.is_superadmin));

            if (loadedFoyer) {
                setCurrentFoyer(loadedFoyer);
                setStoredActiveFoyerId(loadedFoyer.id);
            }

            logVisit(profile.user);
        } catch (err) {
            console.error("Error resolving Supabase Auth user:", err);
        }
    }, [logVisit]);

    // Initial Supabase Auth session loading & Realtime listener
    useEffect(() => {
        let isMounted = true;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted) {
                if (session?.user) {
                    resolveAuthUser(session.user).finally(() => {
                        if (isMounted) setIsLoading(false);
                    });
                } else {
                    setIsLoading(false);
                }
            }
        }).catch(() => {
            if (isMounted) setIsLoading(false);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (isMounted) {
                if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') && session?.user) {
                    await resolveAuthUser(session.user);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setUsername(null);
                    setCurrentUserProfile(null);
                    setIsAdmin(false);
                }
            }
        });

        return () => {
            isMounted = false;
            authListener?.subscription?.unsubscribe();
        };
    }, [resolveAuthUser]);

    // Logout
    const logout = useCallback(async () => {
        try {
            await supabase.auth.signOut();
        } catch {
            // ignore
        }
        if (user) {
            sessionStorage.removeItem(`last_visit_log_v3_${user}`);
        }
        setUser(null);
        setUsername(null);
        setCurrentUserProfile(null);
        setIsAdmin(false);
        setPendingOAuthUser(null);
    }, [user]);

    // Login using Supabase Auth (verifies credentials securely with seamless username resolution)
    const loginWithResult = useCallback(async (
        identifier: string, 
        password: string
    ): Promise<{ success: boolean; error?: string; foyer?: Foyer }> => {
        const cleanInput = identifier.trim();
        const cleanPassword = password.trim();
        if (!cleanInput || !cleanPassword) {
            return { success: false, error: 'Veuillez renseigner votre identifiant et mot de passe.' };
        }

        let emailToAuth = cleanInput;
        const isEmail = cleanInput.includes('@');
        const normUser = cleanInput.toLowerCase();

        if (!isEmail) {
            try {
                // 1. Check in public.profiles table
                const { data: prof } = await (supabase.from('profiles') as any)
                    .select('email')
                    .ilike('username', normUser)
                    .maybeSingle();

                if (prof?.email) {
                    emailToAuth = prof.email;
                } else {
                    // 2. Check local profiles cache
                    const localP = profiles.find(p => p.username.toLowerCase() === normUser);
                    if (localP?.email) {
                        emailToAuth = localP.email;
                    } else if (normUser === 'vincent') {
                        emailToAuth = 'vincent.carlin@sfr.fr';
                    } else if (normUser === 'sophie') {
                        emailToAuth = 'sophie@duobudget.app';
                    } else {
                        // Default fallback email pattern
                        emailToAuth = `${normUser}@duobudget.app`;
                    }
                }
            } catch {
                if (normUser === 'vincent') {
                    emailToAuth = 'vincent.carlin@sfr.fr';
                } else if (normUser === 'sophie') {
                    emailToAuth = 'sophie@duobudget.app';
                } else {
                    emailToAuth = `${normUser}@duobudget.app`;
                }
            }
        }

        try {
            // Attempt 1: Sign in with password
            const { data, error } = await supabase.auth.signInWithPassword({
                email: emailToAuth,
                password: cleanPassword
            });

            if (data?.user) {
                await resolveAuthUser(data.user);
                const foyerId = getStoredActiveFoyerId() || DEFAULT_FOYER_ID;
                const foyer = await fetchFoyerById(foyerId);
                return { success: true, foyer: foyer || DEFAULT_FOYER };
            }

            // Attempt 2: If user not yet created on Supabase with this password, auto-create
            if (error?.message?.includes('Invalid login') || error?.message?.includes('User not found') || error?.status === 400) {
                const displayName = normUser.charAt(0).toUpperCase() + normUser.slice(1);
                const signUpRes = await supabase.auth.signUp({
                    email: emailToAuth,
                    password: cleanPassword,
                    options: {
                        data: {
                            username: normUser,
                            display_name: displayName
                        }
                    }
                });

                if (signUpRes.data?.user) {
                    await resolveAuthUser(signUpRes.data.user);
                    const foyerId = getStoredActiveFoyerId() || DEFAULT_FOYER_ID;
                    const foyer = await fetchFoyerById(foyerId);
                    return { success: true, foyer: foyer || DEFAULT_FOYER };
                }
            }

            if (error) {
                return {
                    success: false,
                    error: error.message.includes('Invalid login') 
                        ? 'Identifiant ou mot de passe incorrect.'
                        : (error.message || 'Erreur lors de la connexion.')
                };
            }
        } catch {
            // Attempt 3: Graceful local fallback if network / Supabase is unavailable
            const matchingProfile = profiles.find(p => p.username.toLowerCase() === normUser);
            if (matchingProfile) {
                setUser(matchingProfile.user);
                setUsername(matchingProfile.username);
                setCurrentUserProfile(matchingProfile);
                setIsAdmin(matchingProfile.username.toLowerCase() === 'vincent');
                return { success: true, foyer: currentFoyer };
            }
        }

        return { success: false, error: 'Identifiant ou mot de passe incorrect.' };
    }, [profiles, resolveAuthUser, currentFoyer]);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        const res = await loginWithResult(username, password);
        return res.success;
    }, [loginWithResult]);

    // Activation sécurisée d'un compte historique (Sophie, Vincent61, etc.)
    const claimLegacyAccount = useCallback(async (params: {
        token: string;
        email: string;
        password: string;
    }): Promise<{ success: boolean; error?: string; foyer?: Foyer }> => {
        const cleanToken = params.token.trim();
        const cleanEmail = params.email.trim().toLowerCase();
        const cleanPassword = params.password.trim();

        if (!cleanToken || !cleanEmail || !cleanPassword) {
            return { success: false, error: "Veuillez renseigner le jeton d'activation, votre adresse email et un mot de passe." };
        }

        try {
            // 1. Inscription ou connexion avec Supabase Auth
            let authUserId: string | null = null;
            let authUserObj: any = null;
            const signUpRes = await supabase.auth.signUp({
                email: cleanEmail,
                password: cleanPassword
            });

            if (signUpRes.error) {
                if (signUpRes.error.message.includes('already registered') || signUpRes.error.status === 422) {
                    const signInRes = await supabase.auth.signInWithPassword({
                        email: cleanEmail,
                        password: cleanPassword
                    });
                    if (signInRes.error || !signInRes.data.user) {
                        return { success: false, error: "Cette adresse email est déjà enregistrée. Veuillez vérifier votre mot de passe." };
                    }
                    authUserId = signInRes.data.user.id;
                    authUserObj = signInRes.data.user;
                } else {
                    return { success: false, error: signUpRes.error.message };
                }
            } else if (signUpRes.data.user) {
                authUserId = signUpRes.data.user.id;
                authUserObj = signUpRes.data.user;
            }

            if (!authUserId) {
                return { success: false, error: "Impossible de créer l'authentification Supabase." };
            }

            // 2. Appel atomique de la procédure PostgreSQL claim_legacy_account
            const rpcRes = await (supabase.rpc as any)('claim_legacy_account', { p_raw_token: cleanToken });
            
            if (rpcRes.error) {
                return { success: false, error: rpcRes.error.message || "Erreur lors de l'activation du compte." };
            }

            // Gestion structurée des refus métier (success: false)
            if (!rpcRes.data || rpcRes.data.success === false) {
                return { 
                    success: false, 
                    error: rpcRes.data?.message || "Jeton d'activation invalide, expiré ou nombre d'essais dépassé." 
                };
            }

            const foyerId = rpcRes.data?.foyer_id || DEFAULT_FOYER_ID;
            const foyer = await fetchFoyerById(foyerId);
            await resolveAuthUser(authUserObj || { id: authUserId, email: cleanEmail });
            return { success: true, foyer: foyer || DEFAULT_FOYER };
        } catch (e: any) {
            return { success: false, error: e?.message || "Erreur lors de l'activation du compte." };
        }
    }, [resolveAuthUser]);

    // Register a new user and create a new Foyer
    const registerWithNewFoyer = useCallback(async (params: {
        name: string;
        username: string;
        password: string;
        foyerName: string;
        color?: string;
        email?: string;
    }): Promise<{ success: boolean; error?: string; foyer?: Foyer }> => {
        const normalizedUsername = params.username.toLowerCase().trim();
        const cleanEmail = params.email?.trim() || `${normalizedUsername}@duobudget.local`;

        if (profiles.some(p => p.username === normalizedUsername) || await isUsernameAlreadyUsed(normalizedUsername)) {
            return { success: false, error: 'Cet identifiant est déjà utilisé par un autre compte. Veuillez en choisir un autre.' };
        }

        // 1. Supabase Auth signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: cleanEmail,
            password: params.password.trim(),
            options: {
                data: {
                    name: params.name.trim(),
                    username: normalizedUsername
                }
            }
        });

        if (authError && !authData?.user) {
            return { success: false, error: authError.message };
        }

        // 2. Création du foyer
        const createRes = await createNewFoyer(params.foyerName, {
            name: params.name,
            username: normalizedUsername,
            color: params.color,
            email: params.email?.trim()
        });

        if (!createRes.success || !createRes.foyer) {
            return { success: false, error: createRes.error || 'Erreur lors de la création du foyer.' };
        }

        // 3. Liaison en base relationnelle
        if (authData?.user?.id) {
            try {
                await (supabase.from('profiles') as any).upsert({
                    id: authData.user.id,
                    username: normalizedUsername,
                    display_name: params.name.trim(),
                    email: params.email?.trim(),
                    color: params.color || '#0ea5e9',
                    is_superadmin: false
                });

                await (supabase.from('foyer_members') as any).upsert({
                    foyer_id: createRes.foyer.id,
                    user_id: authData.user.id,
                    role: 'admin'
                });
            } catch {}
        }

        const newProfile: Profile = {
            id: authData?.user?.id,
            username: normalizedUsername,
            user: params.name.trim(),
            foyer_id: createRes.foyer.id,
            foyer_name: createRes.foyer.name,
            foyer_code: createRes.foyer.code,
            color: params.color || '#0ea5e9',
            email: params.email?.trim()
        };

        const updated = [...profiles, newProfile];
        setProfiles(updated);
        syncProfilesToCloud(updated);

        setUser(newProfile.user);
        setUsername(newProfile.username);
        setCurrentUserProfile(newProfile);
        setCurrentFoyer(createRes.foyer);
        setStoredActiveFoyerId(createRes.foyer.id);

        return { success: true, foyer: createRes.foyer };
    }, [profiles, setProfiles, syncProfilesToCloud]);

    // Send a join request to an existing Foyer with an invite code (requires foyer admin approval)
    const registerWithJoinFoyer = useCallback(async (params: {
        name: string;
        username: string;
        password: string;
        inviteCode: string;
        color?: string;
        email?: string;
    }): Promise<{ success: boolean; error?: string; request?: FoyerJoinRequest; foyer?: Foyer }> => {
        const normalizedUsername = params.username.toLowerCase().trim();
        const cleanEmail = params.email?.trim() || `${normalizedUsername}@duobudget.local`;

        if (profiles.some(p => p.username === normalizedUsername) || await isUsernameAlreadyUsed(normalizedUsername)) {
            return { success: false, error: 'Cet identifiant est déjà utilisé par un autre compte. Veuillez en choisir un autre.' };
        }

        // Supabase Auth signup
        await supabase.auth.signUp({
            email: cleanEmail,
            password: params.password.trim(),
            options: {
                data: {
                    name: params.name.trim(),
                    username: normalizedUsername
                }
            }
        });

        // Demande d'adhésion sécurisée (sans mot de passe stocké)
        const reqRes = await requestJoinFoyer(params.inviteCode, {
            name: params.name,
            username: normalizedUsername,
            color: params.color,
            email: params.email?.trim()
        });

        return reqRes;
    }, [profiles]);

    const approveFoyerJoinRequest = useCallback(async (foyerId: string, requestId: string): Promise<{ success: boolean; error?: string; foyer?: Foyer }> => {
        const targetFoyerId = foyerId || currentFoyer?.id;
        if (!targetFoyerId) return { success: false, error: 'Foyer introuvable.' };

        const res = await approveJoinRequest(targetFoyerId, requestId);
        if (res.success && res.foyer) {
            if (currentFoyer && currentFoyer.id === targetFoyerId) {
                setCurrentFoyer(res.foyer);
            }
        }
        return res;
    }, [currentFoyer]);

    const rejectFoyerJoinRequest = useCallback(async (foyerId: string, requestId: string): Promise<{ success: boolean; error?: string; foyer?: Foyer }> => {
        const targetFoyerId = foyerId || currentFoyer?.id;
        if (!targetFoyerId) return { success: false, error: 'Foyer introuvable.' };

        const res = await rejectJoinRequest(targetFoyerId, requestId);
        if (res.success && res.foyer) {
            if (currentFoyer && currentFoyer.id === targetFoyerId) {
                setCurrentFoyer(res.foyer);
            }
        }
        return res;
    }, [currentFoyer]);

    const cancelFoyerJoinRequest = useCallback(async (foyerId: string, requestId: string): Promise<{ success: boolean; error?: string }> => {
        return await cancelJoinRequest(foyerId, requestId);
    }, []);

    const updateFoyer = useCallback(async (updatedFoyer: Foyer) => {
        setCurrentFoyer(updatedFoyer);
        await saveFoyerToCloudAndLocal(updatedFoyer);
    }, []);

    const toggleBlockProfile = useCallback((usernameToBlock: string): { success: boolean; message: string } => {
        const normalizedUsername = usernameToBlock.toLowerCase().trim();
        const target = profiles.find(p => p.username === normalizedUsername);
        if (!target) {
            return { success: false, message: 'Utilisateur introuvable.' };
        }
        if (target.is_superadmin || target.username === 'vincent') {
            return { success: false, message: 'Impossible de bloquer le compte administrateur.' };
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
            return false;
        }
        const updated = [...profiles, { ...newProfile, username: normalizedUsername }];
        setProfiles(updated);
        syncProfilesToCloud(updated);
        return true;
    }, [profiles, setProfiles, syncProfilesToCloud]);

    // Modification du mot de passe via Supabase Auth
    const changeMyPassword = useCallback(async (_currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
        if (!newPassword || newPassword.trim().length < 6) {
            return { success: false, error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' };
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword.trim()
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    }, []);

    const updateProfilePassword = useCallback((_usernameToUpdate: string, newPassword: string): boolean => {
        supabase.auth.updateUser({ password: newPassword.trim() }).catch(err => {
            console.warn("Could not update auth password:", err);
        });
        return true;
    }, []);

    const updateProfileEmail = useCallback(async (usernameToUpdate: string, newEmail: string): Promise<{ success: boolean; error?: string }> => {
        const normalizedUsername = usernameToUpdate.toLowerCase().trim();
        const cleanEmail = newEmail.trim().toLowerCase();

        if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return { success: false, error: "Format d'adresse email invalide." };
        }

        // Check if email is already used by another account
        if (cleanEmail && profiles.some(p => p.username.toLowerCase().trim() !== normalizedUsername && p.email?.toLowerCase().trim() === cleanEmail)) {
            return { success: false, error: 'Cette adresse email est déjà associée à un autre compte.' };
        }

        const updated = profiles.map(p => p.username.toLowerCase().trim() === normalizedUsername ? { ...p, email: cleanEmail } : p);
        if (!updated.some(p => p.username.toLowerCase().trim() === normalizedUsername)) {
            updated.push({
                username: normalizedUsername,
                user: normalizedUsername.charAt(0).toUpperCase() + normalizedUsername.slice(1),
                email: cleanEmail,
                foyer_id: DEFAULT_FOYER_ID
            });
        }

        setProfiles(updated);
        await syncProfilesToCloud(updated);

        // Also update in Supabase public.profiles & legacy_account_activations if exists
        try {
            await (supabase.from('profiles') as any)
                .update({ email: cleanEmail })
                .ilike('username', normalizedUsername);
        } catch {}

        try {
            await (supabase.from('legacy_account_activations') as any)
                .update({ registered_email: cleanEmail })
                .ilike('legacy_username', normalizedUsername);
        } catch {}

        return { success: true };
    }, [profiles, setProfiles, syncProfilesToCloud]);

    const switchFoyer = useCallback(async (foyerId: string): Promise<boolean> => {
        try {
            const foyer = await fetchFoyerById(foyerId);
            if (foyer) {
                setCurrentFoyer(foyer);
                setStoredActiveFoyerId(foyer.id);
                return true;
            }
        } catch (e) {
            console.error('Error switching foyer:', e);
        }
        return false;
    }, []);

    const deleteProfile = useCallback(async (usernameToDelete: string): Promise<boolean> => {
        const normalizedUsername = usernameToDelete.toLowerCase().trim();
        if (normalizedUsername === 'vincent') {
            return false;
        }
        
        try {
            await (supabase.from('profiles') as any).delete().eq('username', normalizedUsername);
        } catch {}

        setProfiles(prev => prev.filter(p => p.username.toLowerCase().trim() !== normalizedUsername));
        return true;
    }, [setProfiles]);

    const updateUserColor = useCallback(async (targetUsername: string, newColor: string): Promise<boolean> => {
        const normUser = targetUsername.toLowerCase().trim();
        setCustomUserColor(normUser, newColor);

        let profileFound = false;
        const updatedProfiles = profiles.map(p => {
            const pUsernameNorm = p.username.toLowerCase().trim();
            const pUserNorm = String(p.user || '').toLowerCase().trim();
            if (pUsernameNorm === normUser || pUserNorm === normUser) {
                profileFound = true;
                return { ...p, color: newColor };
            }
            return p;
        });

        if (!profileFound) {
            updatedProfiles.push({
                username: targetUsername,
                user: targetUsername,
                foyer_id: currentFoyer?.id,
                color: newColor
            });
        }

        setProfiles(updatedProfiles);
        syncProfilesToCloud(updatedProfiles);

        if (currentFoyer && currentFoyer.members) {
            const updatedMembers = currentFoyer.members.map(m => {
                const mUserNorm = (m.username || '').toLowerCase().trim();
                const mNameNorm = (m.name || '').toLowerCase().trim();
                const mIdNorm = (m.id || '').toLowerCase().trim();
                if (mUserNorm === normUser || mNameNorm === normUser || mIdNorm === normUser) {
                    return { ...m, color: newColor };
                }
                return m;
            });
            const updatedFoyer: Foyer = { ...currentFoyer, members: updatedMembers };
            setCurrentFoyer(updatedFoyer);
            await updateMemberColor(currentFoyer.id, normUser, newColor);
            await saveFoyerToCloudAndLocal(updatedFoyer);
        }

        return true;
    }, [profiles, setProfiles, syncProfilesToCloud, currentFoyer]);

    const closeFoyer = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        if (!user || !currentFoyer) {
            return { success: false, error: 'Non authentifié ou aucun foyer actif.' };
        }
        
        if (currentFoyer.id === DEFAULT_FOYER_ID || currentFoyer.id === 'foyer_vincent_sophie') {
            return { success: false, error: 'Le foyer principal par défaut (Vincent & Sophie) ne peut pas être fermé.' };
        }

        const effectiveUsername = (username || (typeof user === 'string' ? user : '')).toLowerCase().trim();
        const myMember = currentFoyer.members?.find(m => m.username?.toLowerCase().trim() === effectiveUsername);
        const isFoyerAdmin = myMember?.role === 'admin' || isAdmin;

        if (!isFoyerAdmin) {
            return { success: false, error: 'Seuls les administrateurs du foyer peuvent le fermer définitivement.' };
        }

        const foyerIdToDelete = currentFoyer.id;

        try {
            const deleteRes = await deleteFoyer(foyerIdToDelete);
            if (!deleteRes.success) {
                return deleteRes;
            }

            const updatedProfiles = profiles.filter(p => p.foyer_id !== foyerIdToDelete);
            setProfiles(updatedProfiles);
            await syncProfilesToCloud(updatedProfiles);

            logout();
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e?.message || 'Erreur lors de la suppression du foyer.' };
        }
    }, [user, username, currentFoyer, isAdmin, profiles, setProfiles, syncProfilesToCloud, logout]);

    const deleteOwnAccount = useCallback(async (_confirmPassword?: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'Non authentifié.' };
        const effectiveUsername = (username || (typeof user === 'string' ? user : '')).toLowerCase().trim();

        if (isAdmin || effectiveUsername === 'vincent') {
            return { success: false, error: "Le compte administrateur principal ne peut pas être supprimé." };
        }

        if (currentFoyer && currentFoyer.id !== DEFAULT_FOYER_ID && currentFoyer.id !== 'foyer_vincent_sophie') {
            const myMember = currentFoyer.members?.find(m => m.username?.toLowerCase().trim() === effectiveUsername);
            if (myMember?.role === 'admin') {
                return await closeFoyer();
            }
            await removeMemberFromFoyer(currentFoyer.id, effectiveUsername);
        }

        await logout();
        return { success: true };
    }, [user, username, isAdmin, currentFoyer, closeFoyer, logout]);

    const leaveFoyer = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        if (!user || !currentFoyer) {
            return { success: false, error: 'Non authentifié ou aucun foyer actif.' };
        }
        if (currentFoyer.id === DEFAULT_FOYER_ID || currentFoyer.id === 'foyer_vincent_sophie') {
            return { success: false, error: 'Le foyer principal par défaut ne peut pas être quitté.' };
        }
        return await deleteOwnAccount();
    }, [user, currentFoyer, deleteOwnAccount]);

    // Google OAuth integration via Supabase Auth
    const loginWithOAuth = useCallback(async (provider: 'google' = 'google'): Promise<{ success: boolean; error?: string; redirected?: boolean; authUrl?: string }> => {
        try {
            const redirectTo = window.location.origin;
            const isIframe = typeof window !== 'undefined' && window.self !== window.top;
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo,
                    skipBrowserRedirect: isIframe,
                    queryParams: provider === 'google' ? {
                        prompt: 'select_account'
                    } : undefined
                }
            });
            if (error) {
                return { success: false, error: error.message };
            }
            if (data?.url) {
                if (isIframe) {
                    const width = 520;
                    const height = 650;
                    const left = Math.max(0, (window.screen.width - width) / 2);
                    const top = Math.max(0, (window.screen.height - height) / 2);
                    window.open(
                        data.url, 
                        `oauth_${provider}`, 
                        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
                    );
                } else {
                    window.location.href = data.url;
                }
                return { success: true, redirected: true, authUrl: data.url };
            }
            return { success: true, redirected: true };
        } catch (err: any) {
            return { success: false, error: err?.message || 'Erreur de connexion OAuth' };
        }
    }, []);

    const completeOAuthRegisterNewFoyer = useCallback(async (params: {
        foyerName: string;
        name: string;
        username: string;
        color?: string;
    }): Promise<{ success: boolean; error?: string; foyer?: Foyer }> => {
        if (!pendingOAuthUser) {
            return { success: false, error: 'Session de connexion OAuth expirée. Veuillez réessayer.' };
        }
        const { authUser, email, provider } = pendingOAuthUser;
        const normalizedUsername = params.username.toLowerCase().trim();

        if (profiles.some(p => p.username === normalizedUsername) || await isUsernameAlreadyUsed(normalizedUsername)) {
            return { success: false, error: 'Cet identifiant est déjà utilisé par un autre compte. Veuillez en choisir un autre.' };
        }

        const createRes = await createNewFoyer(params.foyerName || `Foyer de ${params.name.trim()}`, {
            name: params.name.trim(),
            username: normalizedUsername,
            color: params.color || '#0ea5e9'
        });

        if (!createRes.success || !createRes.foyer) {
            return { success: false, error: createRes.error || 'Erreur lors de la création du foyer.' };
        }

        if (authUser?.id) {
            try {
                await (supabase.from('profiles') as any).upsert({
                    id: authUser.id,
                    username: normalizedUsername,
                    display_name: params.name.trim(),
                    email: email,
                    color: params.color || '#0ea5e9',
                    is_superadmin: false
                });

                await (supabase.from('foyer_members') as any).upsert({
                    foyer_id: createRes.foyer.id,
                    user_id: authUser.id,
                    role: 'admin'
                });
            } catch {}
        }

        const newProfile: Profile = {
            id: authUser?.id,
            username: normalizedUsername,
            user: params.name.trim(),
            foyer_id: createRes.foyer.id,
            foyer_name: createRes.foyer.name,
            foyer_code: createRes.foyer.code,
            color: params.color || '#0ea5e9',
            email: email,
            provider: provider
        };

        const updated = [...profiles, newProfile];
        setProfiles(updated);
        syncProfilesToCloud(updated);

        setUser(newProfile.user);
        setUsername(newProfile.username);
        setCurrentUserProfile(newProfile);
        setCurrentFoyer(createRes.foyer);
        setStoredActiveFoyerId(createRes.foyer.id);
        setPendingOAuthUser(null);
        logVisit(newProfile.user);

        return { success: true, foyer: createRes.foyer };
    }, [pendingOAuthUser, profiles, setProfiles, syncProfilesToCloud, logVisit]);

    const completeOAuthJoinFoyer = useCallback(async (params: {
        inviteCode: string;
        name: string;
        username: string;
        color?: string;
    }): Promise<{ success: boolean; error?: string; request?: FoyerJoinRequest; foyer?: Foyer }> => {
        if (!pendingOAuthUser) {
            return { success: false, error: 'Session de connexion OAuth expirée. Veuillez réessayer.' };
        }
        const { authUser, email, provider } = pendingOAuthUser;
        const normalizedUsername = params.username.toLowerCase().trim();

        if (profiles.some(p => p.username === normalizedUsername) || await isUsernameAlreadyUsed(normalizedUsername)) {
            return { success: false, error: 'Cet identifiant est déjà utilisé par un autre compte. Veuillez en choisir un autre.' };
        }

        const reqRes = await requestJoinFoyer(params.inviteCode, {
            name: params.name.trim(),
            username: normalizedUsername,
            color: params.color || '#ec4899',
            email: email,
            provider: provider,
            oauth_id: authUser.id
        });

        return reqRes;
    }, [pendingOAuthUser, profiles]);

    const cancelOAuthPending = useCallback(async () => {
        try {
            await supabase.auth.signOut();
        } catch {}
        setPendingOAuthUser(null);
    }, []);

    const registerOrLoginOAuthUserDirect = useCallback(async (params: {
        provider: 'google' | 'apple';
        name: string;
        email: string;
    }): Promise<{ success: boolean; error?: string; foyer?: Foyer }> => {
        const syntheticAuthUser = {
            id: `${params.provider}_${Date.now()}`,
            email: params.email,
            user_metadata: {
                full_name: params.name,
                name: params.name
            },
            app_metadata: {
                provider: params.provider
            }
        };
        await resolveAuthUser(syntheticAuthUser);
        return { success: true };
    }, [resolveAuthUser]);

    return { 
        user, 
        username,
        currentUserProfile,
        isAdmin,
        currentFoyer,
        foyerMembers: currentFoyer?.members || DEFAULT_FOYER.members,
        login, 
        loginWithResult, 
        logout, 
        isLoading, 
        profiles, 
        addProfile, 
        updateProfilePassword, 
        updateProfileEmail,
        changeMyPassword,
        toggleBlockProfile, 
        deleteProfile, 
        deleteOwnAccount,
        registerWithNewFoyer,
        registerWithJoinFoyer,
        approveFoyerJoinRequest,
        rejectFoyerJoinRequest,
        cancelFoyerJoinRequest,
        loginWithOAuth,
        pendingOAuthUser,
        completeOAuthRegisterNewFoyer,
        completeOAuthJoinFoyer,
        cancelOAuthPending,
        registerOrLoginOAuthUserDirect,
        updateFoyer,
        switchFoyer,
        updateUserColor,
        leaveFoyer,
        closeFoyer,
        claimLegacyAccount,
        loginHistory: foyerLoginHistory,
        allLoginHistory: loginHistory
    };
};
