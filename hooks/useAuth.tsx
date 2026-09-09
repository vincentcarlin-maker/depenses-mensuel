import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    setStoredActiveFoyerId,
    isUsernameAlreadyUsed,
    updateMemberColor,
    fetchAllFoyers,
    removeMemberFromFoyer,
    deleteFoyer
} from '../utils/foyerService';

const SESSION_KEY = 'expense-app-session-v2';
const PROFILES_KEY = 'expense-app-profiles-v2';

export interface PendingOAuthUser {
    authUser: any;
    email: string;
    fullName: string;
    provider: 'google' | 'apple';
    suggestedUsername: string;
    avatarUrl?: string;
}

export interface Profile {
    username: string;
    password: string;
    user: User | string;
    foyer_id?: string;
    foyer_name?: string;
    foyer_code?: string;
    color?: string;
    blocked?: boolean;
    email?: string;
    provider?: string;
}

export interface LoginEvent {
    user: User | string;
    timestamp: string;
    foyer_id?: string;
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

// Helper to deduplicate profiles and guarantee uniqueness of usernames and emails
const deduplicateProfiles = (profilesList: Profile[]): Profile[] => {
    const map = new Map<string, Profile>();
    const emailToUsernameMap = new Map<string, string>();

    for (const p of profilesList) {
        if (!p || !p.username) continue;
        const normUsername = p.username.toLowerCase().trim();
        const normEmail = p.email ? p.email.toLowerCase().trim() : '';

        // If email matches an existing profile, merge into that existing profile key
        let targetKey = normUsername;
        if (normEmail && emailToUsernameMap.has(normEmail)) {
            targetKey = emailToUsernameMap.get(normEmail)!;
        }

        if (map.has(targetKey)) {
            const existing = map.get(targetKey)!;
            // Prefer readable username over generic auto-generated user_ / oauth_ usernames
            const isAutoUser = existing.username.startsWith('user_') || existing.username.startsWith('oauth_');
            const isNewReadable = !normUsername.startsWith('user_') && !normUsername.startsWith('oauth_');
            const chosenUsername = isAutoUser && isNewReadable ? p.username : existing.username;
            const chosenUser = isAutoUser && isNewReadable ? p.user : existing.user;

            const merged = {
                ...existing,
                ...p,
                username: chosenUsername,
                user: chosenUser,
                email: normEmail || existing.email,
                color: p.color || existing.color,
                blocked: p.blocked !== undefined ? p.blocked : existing.blocked,
                foyer_id: p.foyer_id || existing.foyer_id,
                foyer_name: p.foyer_name || existing.foyer_name,
                foyer_code: p.foyer_code || existing.foyer_code,
            };
            map.set(targetKey, merged);
            if (normEmail) {
                emailToUsernameMap.set(normEmail, targetKey);
            }
        } else {
            map.set(normUsername, p);
            if (normEmail) {
                emailToUsernameMap.set(normEmail, normUsername);
            }
        }
    }
    for (const initP of INITIAL_PROFILES) {
        const key = initP.username.toLowerCase().trim();
        if (!map.has(key)) {
            map.set(key, initP);
        }
    }
    return Array.from(map.values());
};

export const useAuth = () => {
    const [user, setUser] = useState<User | string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [currentFoyer, setCurrentFoyer] = useState<Foyer>(DEFAULT_FOYER);
    const [isLoading, setIsLoading] = useState(true);
    const [profiles, setProfiles] = useLocalStorage<Profile[]>(PROFILES_KEY, INITIAL_PROFILES);
    const [loginHistory, setLoginHistory] = useState<LoginEvent[]>([]);
    const [pendingOAuthUser, setPendingOAuthUser] = useState<PendingOAuthUser | null>(null);

    // Helper pour logger une visite en base de données
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
            // First attempt with foyer_id
            const { error } = await (supabase.from('login_logs') as any).insert({
                user_name: String(userName),
                timestamp: new Date().toISOString(),
                foyer_id: activeFoyerId
            });

            // Fallback if foyer_id column does not exist yet in Supabase table
            if (error) {
                await (supabase.from('login_logs') as any).insert({
                    user_name: String(userName),
                    timestamp: new Date().toISOString()
                });
            }

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
        // Foyer par défaut Vincent & Sophie
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
            // Si le log a un foyer_id explicite
            if (event.foyer_id) {
                return event.foyer_id === currentFoyer.id;
            }
            // Fallback : l'utilisateur appartient aux membres de ce foyer
            const eventUserNorm = String(event.user).toLowerCase().trim();
            return allowedUsernames.has(eventUserNorm);
        });
    }, [loginHistory, currentFoyer]);

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
                        const fallbackUsername = session.user === User.Vincent ? 'vincent' : (session.user === User.Sophie ? 'sophie' : String(session.user).toLowerCase());
                        setUsername(session.username || fallbackUsername);
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

    const logout = useCallback(async () => {
        try {
            await supabase.auth.signOut();
        } catch {
            // ignore
        }
        window.localStorage.removeItem(SESSION_KEY);
        window.localStorage.removeItem('expense-app-session');
        if (user) {
             sessionStorage.removeItem(`last_visit_log_v3_${user}`);
        }
        setUser(null);
        setUsername(null);
        setPendingOAuthUser(null);
    }, [user]);

    // Realtime sync for profiles across devices
    const profileChannelRef = useRef<any>(null);

    const syncProfilesToCloud = useCallback(async (updatedProfiles: Profile[]) => {
        const uniqueProfiles = deduplicateProfiles(updatedProfiles);
        if (profileChannelRef.current) {
            profileChannelRef.current.send({
                type: 'broadcast',
                event: 'user_profiles_changed',
                payload: { profiles: uniqueProfiles }
            });
        }
        try {
            const activeUsernames = uniqueProfiles.map(p => p.username.toLowerCase().trim());

            // 1. Delete any individual profile record in Supabase for users that no longer exist
            const { data: existingIndividual } = await (supabase.from('push_subscriptions') as any)
                .select('user_id')
                .like('user_id', 'profile_%');

            if (Array.isArray(existingIndividual)) {
                for (const row of existingIndividual) {
                    const uName = row.user_id.replace(/^profile_/, '').toLowerCase().trim();
                    if (!activeUsernames.includes(uName) && !row.user_id.startsWith('profile_email_')) {
                        await (supabase.from('push_subscriptions') as any).delete().eq('user_id', row.user_id);
                    }
                }
            }

            // 2. Save active profiles individually
            for (const p of uniqueProfiles) {
                const normUser = p.username.toLowerCase().trim();
                await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `profile_${normUser}`);
                await (supabase.from('push_subscriptions') as any).insert({
                    user_id: `profile_${normUser}`,
                    subscription: p
                });
            }

            // 3. Keep merged app_user_profiles_v2 up to date
            await (supabase.from('push_subscriptions') as any).delete().eq('user_id', 'app_user_profiles_v2');
            await (supabase.from('push_subscriptions') as any).insert({
                user_id: 'app_user_profiles_v2',
                subscription: { profiles: uniqueProfiles }
            });
        } catch (e) {
            console.warn('Could not save user_profiles to Supabase:', e);
        }
    }, []);

    useEffect(() => {
        const fetchProfilesFromCloud = async () => {
            try {
                // Fetch existing foyers to identify orphaned accounts
                const existingFoyers = await fetchAllFoyers();
                const existingFoyerIds = existingFoyers.map(f => f.id);

                // Fetch individually saved profiles first (safe against overwrites)
                const { data: individualRows } = await (supabase.from('push_subscriptions') as any)
                    .select('user_id, subscription')
                    .like('user_id', 'profile_%');

                // Also fetch global app_user_profiles_v2
                const { data: globalData } = await (supabase.from('push_subscriptions') as any)
                    .select('subscription')
                    .eq('user_id', 'app_user_profiles_v2')
                    .maybeSingle();

                const discoveredProfiles: Profile[] = [];
                const orphanedUsernames: string[] = [];

                if (Array.isArray(individualRows)) {
                    for (const row of individualRows) {
                        // Skip lookup rows (like profile_email_ or profile_oauth_) so they aren't parsed as primary profile records
                        if (row.user_id && (row.user_id.startsWith('profile_email_') || row.user_id.startsWith('profile_oauth_'))) {
                            continue;
                        }
                        if (row.subscription && row.subscription.username) {
                            const gp = row.subscription as Profile;
                            const fid = gp.foyer_id;
                            const isOrphaned = fid && fid !== DEFAULT_FOYER_ID && !existingFoyerIds.includes(fid);
                            if (isOrphaned) {
                                orphanedUsernames.push(gp.username.toLowerCase().trim());
                            } else {
                                const normUser = gp.username.toLowerCase().trim();
                                const existingIdx = discoveredProfiles.findIndex(dp => dp.username.toLowerCase().trim() === normUser);
                                if (existingIdx >= 0) {
                                    discoveredProfiles[existingIdx] = {
                                        ...discoveredProfiles[existingIdx],
                                        ...gp,
                                        email: gp.email || discoveredProfiles[existingIdx].email
                                    };
                                } else {
                                    discoveredProfiles.push(gp);
                                }
                            }
                        }
                    }
                }

                if (globalData?.subscription?.profiles && Array.isArray(globalData.subscription.profiles)) {
                    for (const gp of globalData.subscription.profiles) {
                        const fid = gp.foyer_id;
                        const isOrphaned = fid && fid !== DEFAULT_FOYER_ID && !existingFoyerIds.includes(fid);
                        if (isOrphaned) {
                            const uName = gp.username.toLowerCase().trim();
                            if (!orphanedUsernames.includes(uName)) {
                                orphanedUsernames.push(uName);
                            }
                        } else {
                            const normUser = gp.username.toLowerCase().trim();
                            const existingIdx = discoveredProfiles.findIndex(dp => dp.username.toLowerCase().trim() === normUser);
                            if (existingIdx >= 0) {
                                discoveredProfiles[existingIdx] = {
                                    ...discoveredProfiles[existingIdx],
                                    ...gp,
                                    email: gp.email || discoveredProfiles[existingIdx].email
                                };
                            } else {
                                discoveredProfiles.push(gp);
                            }
                        }
                    }
                }

                // Purge orphaned profiles from cloud push_subscriptions
                if (orphanedUsernames.length > 0) {
                    for (const uName of orphanedUsernames) {
                        try {
                            await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `profile_${uName}`);
                        } catch (err) {
                            console.warn('Could not delete orphaned profile from Supabase:', err);
                        }
                    }
                    // Trigger a clean save of the merged profiles v2 without the orphans
                    const cleanedProfiles = deduplicateProfiles(discoveredProfiles.filter(p => !orphanedUsernames.includes(p.username.toLowerCase().trim())));
                    await (supabase.from('push_subscriptions') as any).delete().eq('user_id', 'app_user_profiles_v2');
                    await (supabase.from('push_subscriptions') as any).insert({
                        user_id: 'app_user_profiles_v2',
                        subscription: { profiles: cleanedProfiles }
                    });
                }

                if (discoveredProfiles.length > 0) {
                    setProfiles(() => deduplicateProfiles(discoveredProfiles));
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
                    setProfiles(() => deduplicateProfiles(data.profiles));
                }
            })
            .subscribe();

        const foyerSyncChannel = supabase.channel('foyer_sync_channel')
            .on('broadcast', { event: 'foyer_deleted' }, (payload: any) => {
                const data = payload?.payload || payload;
                const deletedFoyerId = data?.foyerId;
                const deletedUsernames: string[] = (data?.deletedUsernames || []).map((u: string) => u.toLowerCase().trim());

                if (deletedFoyerId) {
                    setProfiles(prev => prev.filter(p => {
                        const pFoyerId = p.foyer_id;
                        const pUser = p.username?.toLowerCase().trim();
                        if (pUser === 'vincent' || pUser === 'sophie') return true;
                        if (pFoyerId === deletedFoyerId) return false;
                        if (deletedUsernames.includes(pUser)) return false;
                        return true;
                    }));

                    // Purge deleted foyer from local foyers cache on all clients
                    try {
                        const localMap = getLocalFoyers();
                        if (localMap[deletedFoyerId]) {
                            delete localMap[deletedFoyerId];
                            saveLocalFoyers(localMap);
                        }
                    } catch {}

                    // If currently logged in user belongs to deleted foyer or deleted usernames, log out immediately
                    const curUserNorm = username ? username.toLowerCase().trim() : (typeof user === 'string' ? user.toLowerCase().trim() : '');
                    if (curUserNorm && curUserNorm !== 'vincent' && curUserNorm !== 'sophie') {
                        if (deletedUsernames.includes(curUserNorm) || currentFoyer?.id === deletedFoyerId) {
                            logout();
                        }
                    }
                }
            })
            .subscribe();

        const intervalId = setInterval(fetchProfilesFromCloud, 10000);

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(foyerSyncChannel);
            clearInterval(intervalId);
        };
    }, [setProfiles, username, user, currentFoyer, logout]);

    // Check if active user profile has been blocked by admin
    useEffect(() => {
        if (user && profiles.length > 0) {
            const currentNorm = username ? username.toLowerCase().trim() : (typeof user === 'string' ? user.toLowerCase().trim() : '');
            if (currentNorm && currentNorm !== 'vincent' && currentNorm !== 'sophie') {
                const currentProfile = profiles.find(p => p.username?.toLowerCase().trim() === currentNorm);
                
                // If profile is explicitly blocked by admin
                if (currentProfile && currentProfile.blocked) {
                    logout();
                    return;
                }
            }
        }
    }, [user, username, profiles, logout]);

    // Listen for real-time user force logout events
    useEffect(() => {
        const authEventsChannel = supabase.channel('duobudget_auth_events')
            .on('broadcast', { event: 'user_deleted_force_logout' }, (payload: any) => {
                const data = payload?.payload || payload;
                const deletedUsername = data?.username?.toLowerCase().trim();
                const currentNorm = username ? username.toLowerCase().trim() : (typeof user === 'string' ? user.toLowerCase().trim() : '');
                if (deletedUsername && currentNorm === deletedUsername && currentNorm !== 'vincent' && currentNorm !== 'sophie') {
                    logout();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(authEventsChannel);
        };
    }, [username, user, logout]);

    const handleOAuthUser = useCallback(async (authUser: any) => {
        if (!authUser) return;
        const email: string = (authUser.email || '').trim();
        const metadata = authUser.user_metadata || {};
        const fullName: string = metadata.full_name || metadata.name || (email ? email.split('@')[0] : 'Membre');
        const provider: 'google' | 'apple' = authUser.app_metadata?.provider === 'apple' ? 'apple' : 'google';
        
        let profile: Profile | undefined = undefined;

        // 1. Strict email match in loaded profiles
        if (email) {
            profile = profiles.find(p => p.email && p.email.toLowerCase().trim() === email.toLowerCase());
        }

        // 2. Exact OAuth ID match in password or username
        if (!profile) {
            profile = profiles.find(p => p.password === `oauth_${authUser.id}` || p.username === `oauth_${authUser.id}`);
        }

        // 3. Special admin linking: if email is strictly Vincent Carlin's registered email
        if (!profile && email && email.toLowerCase() === 'vincent.carlin@sfr.fr') {
            const vincentProfile = profiles.find(p => p.username === 'vincent');
            if (vincentProfile) {
                profile = { ...vincentProfile, email: 'vincent.carlin@sfr.fr', provider: 'google' };
                const updatedProfiles = profiles.map(p => p.username === 'vincent' ? profile! : p);
                setProfiles(updatedProfiles);
                syncProfilesToCloud(updatedProfiles);
            }
        }

        // 4. Check direct profile row in Supabase push_subscriptions by email
        if (!profile && email) {
            try {
                const { data } = await (supabase.from('push_subscriptions') as any)
                    .select('subscription')
                    .eq('user_id', `profile_email_${email.toLowerCase().trim()}`)
                    .maybeSingle();
                if (data?.subscription?.username) {
                    profile = data.subscription as Profile;
                }
            } catch {}
        }

        // 5. Check direct profile row by oauth ID
        if (!profile) {
            try {
                const { data } = await (supabase.from('push_subscriptions') as any)
                    .select('subscription')
                    .eq('user_id', `profile_oauth_${authUser.id}`)
                    .maybeSingle();
                if (data?.subscription?.username) {
                    profile = data.subscription as Profile;
                }
            } catch {}
        }

        // IF PROFILE EXISTS: Direct login to their own foyer!
        if (profile) {
            const foyerId = profile.foyer_id || DEFAULT_FOYER_ID;
            let foyer: Foyer | null = null;
            if (foyerId === DEFAULT_FOYER_ID) {
                foyer = DEFAULT_FOYER;
            } else {
                foyer = await fetchFoyerById(foyerId);
                if (!foyer) {
                    // Reconstruct from profile
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
                    await saveFoyerToCloudAndLocal(foyer);
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
            setUsername(profile.username);
            setCurrentFoyer(foyer);
            setStoredActiveFoyerId(foyer.id);
            setPendingOAuthUser(null);
            logVisit(profile.user);
            return;
        }

        // IF NO PROFILE: NEW USER -> Trigger onboarding!
        let baseUsername = email ? email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : `user_${String(authUser.id).slice(0, 6)}`;
        if (!baseUsername || baseUsername === 'vincent' || baseUsername === 'sophie') {
            baseUsername = `user_${Math.floor(100 + Math.random() * 900)}`;
        }
        let suggestedUsername = baseUsername;
        let counter = 1;
        while (profiles.some(p => p.username === suggestedUsername) || suggestedUsername === 'vincent' || suggestedUsername === 'sophie') {
            suggestedUsername = `${baseUsername}${counter}`;
            counter++;
        }

        setPendingOAuthUser({
            authUser,
            email,
            fullName,
            provider,
            suggestedUsername,
            avatarUrl: metadata.avatar_url || metadata.picture
        });
    }, [profiles, setProfiles, syncProfilesToCloud, logVisit]);

    // Listen for Supabase OAuth login events or existing session
    useEffect(() => {
        // Check if current URL contains access_token or code
        if (typeof window !== 'undefined') {
            const fullUrl = window.location.href;

            // Handle PKCE code (?code=...)
            if (fullUrl.includes('code=')) {
                try {
                    const searchParams = new URLSearchParams(window.location.search);
                    const code = searchParams.get('code');
                    if (code) {
                        supabase.auth.exchangeCodeForSession(code).then(({ data }) => {
                            if (data?.session?.user) {
                                handleOAuthUser(data.session.user);
                                if (window.opener) {
                                    try {
                                        window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
                                    } catch {}
                                    window.close();
                                }
                            }
                        }).catch(err => {
                            console.warn("Could not exchange code for session:", err);
                        });
                        try {
                            const cleanPath = window.location.pathname || '/';
                            window.history.replaceState(null, '', cleanPath);
                        } catch {}
                    }
                } catch (err) {
                    console.warn("Could not parse code from URL:", err);
                }
            }

            if (fullUrl.includes('access_token=') || fullUrl.includes('%23access_token=')) {
                try {
                    const cleanFragment = fullUrl.replace(/.*(%23|#|\?)/, '');
                    const params = new URLSearchParams(cleanFragment);
                    const rawAccess = params.get('access_token') || fullUrl.match(/access_token=([^&]+)/)?.[1];
                    const rawRefresh = params.get('refresh_token') || fullUrl.match(/refresh_token=([^&]+)/)?.[1];

                    if (rawAccess && rawRefresh) {
                        const access_token = decodeURIComponent(rawAccess);
                        const refresh_token = decodeURIComponent(rawRefresh);
                        
                        supabase.auth.setSession({
                            access_token,
                            refresh_token
                        }).then(({ data }) => {
                            if (data?.session?.user) {
                                handleOAuthUser(data.session.user);
                                if (window.opener) {
                                    try {
                                        window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
                                    } catch {}
                                    window.close();
                                }
                            }
                        }).catch(err => {
                            console.warn("Could not restore session from URL tokens:", err);
                        });

                        // Clean URL in the browser
                        try {
                            const cleanPath = window.location.pathname.split('%23')[0].split('#')[0] || '/';
                            window.history.replaceState(null, '', cleanPath);
                        } catch {}
                    }
                } catch (err) {
                    console.warn("Could not parse tokens from URL:", err);
                }
            }
        }

        // If this window is an OAuth popup callback, notify the opener and close
        if (typeof window !== 'undefined' && window.opener) {
            try {
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session?.user) {
                        try {
                            window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
                        } catch {}
                        window.close();
                    }
                }).catch(() => {});
            } catch {}
        }

        try {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) {
                    handleOAuthUser(session.user);
                }
            }).catch(err => {
                console.warn("Could not check Supabase auth session:", err);
            });
        } catch {}

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'SUPABASE_AUTH_SUCCESS') {
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session?.user) {
                        handleOAuthUser(session.user);
                    }
                });
            }
        };
        window.addEventListener('message', handleMessage);

        let unsubscribeListener: (() => void) | undefined;
        try {
            const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
                if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
                    handleOAuthUser(session.user);
                }
            });

            unsubscribeListener = () => {
                authListener?.subscription?.unsubscribe();
            };
        } catch {}

        return () => {
            window.removeEventListener('message', handleMessage);
            if (unsubscribeListener) unsubscribeListener();
        };
    }, [handleOAuthUser]);

    const loginWithOAuth = useCallback(async (provider: 'google' | 'apple'): Promise<{ success: boolean; error?: string; redirected?: boolean; authUrl?: string }> => {
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
                    const popup = window.open(
                        data.url, 
                        `oauth_${provider}`, 
                        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
                    );
                    if (!popup) {
                        window.open(data.url, '_blank');
                    }
                } else {
                    window.location.href = data.url;
                }
                return { success: true, redirected: true, authUrl: data.url };
            }
            return { success: true, redirected: true };
        } catch (err: any) {
            return { success: false, error: err?.message || 'Erreur de connexion OAuth' };
        }
    }, [handleOAuthUser]);

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

        const newProfile: Profile = {
            username: normalizedUsername,
            password: `oauth_${authUser.id}`,
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

        // Save email & oauth pointers
        try {
            if (email) {
                await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `profile_email_${email.toLowerCase().trim()}`);
                await (supabase.from('push_subscriptions') as any).insert({
                    user_id: `profile_email_${email.toLowerCase().trim()}`,
                    subscription: newProfile
                });
            }
            await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `profile_oauth_${authUser.id}`);
            await (supabase.from('push_subscriptions') as any).insert({
                user_id: `profile_oauth_${authUser.id}`,
                subscription: newProfile
            });
        } catch {}

        const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
        const session: Session = {
            user: newProfile.user,
            username: newProfile.username,
            foyer_id: createRes.foyer.id,
            expiresAt: oneYearFromNow,
        };
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setUser(newProfile.user);
        setUsername(newProfile.username);
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
    }): Promise<{ success: boolean; error?: string; foyer?: Foyer }> => {
        if (!pendingOAuthUser) {
            return { success: false, error: 'Session de connexion OAuth expirée. Veuillez réessayer.' };
        }
        const { authUser, email, provider } = pendingOAuthUser;
        const normalizedUsername = params.username.toLowerCase().trim();

        if (profiles.some(p => p.username === normalizedUsername) || await isUsernameAlreadyUsed(normalizedUsername)) {
            return { success: false, error: 'Cet identifiant est déjà utilisé par un autre compte. Veuillez en choisir un autre.' };
        }

        const joinRes = await joinFoyerWithCode(params.inviteCode, {
            name: params.name.trim(),
            username: normalizedUsername,
            color: params.color || '#ec4899'
        });

        if (!joinRes.success || !joinRes.foyer) {
            return { success: false, error: joinRes.error || 'Code d’invitation introuvable.' };
        }

        const newProfile: Profile = {
            username: normalizedUsername,
            password: `oauth_${authUser.id}`,
            user: params.name.trim(),
            foyer_id: joinRes.foyer.id,
            foyer_name: joinRes.foyer.name,
            foyer_code: joinRes.foyer.code,
            color: params.color || '#ec4899',
            email: email,
            provider: provider
        };

        const updated = [...profiles, newProfile];
        setProfiles(updated);
        syncProfilesToCloud(updated);

        // Save email & oauth pointers
        try {
            if (email) {
                await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `profile_email_${email.toLowerCase().trim()}`);
                await (supabase.from('push_subscriptions') as any).insert({
                    user_id: `profile_email_${email.toLowerCase().trim()}`,
                    subscription: newProfile
                });
            }
            await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `profile_oauth_${authUser.id}`);
            await (supabase.from('push_subscriptions') as any).insert({
                user_id: `profile_oauth_${authUser.id}`,
                subscription: newProfile
            });
        } catch {}

        const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
        const session: Session = {
            user: newProfile.user,
            username: newProfile.username,
            foyer_id: joinRes.foyer.id,
            expiresAt: oneYearFromNow,
        };
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setUser(newProfile.user);
        setUsername(newProfile.username);
        setCurrentFoyer(joinRes.foyer);
        setStoredActiveFoyerId(joinRes.foyer.id);
        setPendingOAuthUser(null);
        logVisit(newProfile.user);

        return { success: true, foyer: joinRes.foyer };
    }, [pendingOAuthUser, profiles, setProfiles, syncProfilesToCloud, logVisit]);

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
        await handleOAuthUser(syntheticAuthUser);
        return { success: true };
    }, [handleOAuthUser]);

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
                if (!foyer) {
                    // Foyer was closed or deleted: purge orphaned profile and reject login
                    deleteAccount(profile.username);
                    return { success: false, error: 'Ce foyer a été fermé par son administrateur. Le compte n’existe plus.' };
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
            setUsername(profile.username);
            setCurrentFoyer(foyer);
            setStoredActiveFoyerId(foyer.id);
            
            const newLogEntry: LoginEvent = {
                user: profile.user,
                timestamp: new Date().toISOString()
            };

            setLoginHistory(prev => [newLogEntry, ...prev]);

            (supabase.from('login_logs') as any).insert({
                user_name: String(profile.user),
                timestamp: newLogEntry.timestamp
            }).then(({ error }: any) => {
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
        email?: string;
    }): Promise<{ success: boolean; error?: string; foyer?: Foyer }> => {
        const normalizedUsername = params.username.toLowerCase().trim();

        if (profiles.some(p => p.username === normalizedUsername) || await isUsernameAlreadyUsed(normalizedUsername)) {
            return { success: false, error: 'Cet identifiant est déjà utilisé par un autre compte. Veuillez en choisir un autre.' };
        }

        const cleanEmail = params.email?.trim() || undefined;

        const createRes = await createNewFoyer(params.foyerName, {
            name: params.name,
            username: normalizedUsername,
            color: params.color,
            email: cleanEmail
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
            email: cleanEmail
        };

        const updated = [...profiles, newProfile];
        setProfiles(updated);
        syncProfilesToCloud(updated);

        // Save email pointer if present
        if (cleanEmail) {
            try {
                await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `profile_email_${cleanEmail.toLowerCase()}`);
                await (supabase.from('push_subscriptions') as any).insert({
                    user_id: `profile_email_${cleanEmail.toLowerCase()}`,
                    subscription: newProfile
                });
            } catch {}
        }

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
        setUsername(newProfile.username);
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
        email?: string;
    }): Promise<{ success: boolean; error?: string; foyer?: Foyer }> => {
        const normalizedUsername = params.username.toLowerCase().trim();

        if (profiles.some(p => p.username === normalizedUsername) || await isUsernameAlreadyUsed(normalizedUsername)) {
            return { success: false, error: 'Cet identifiant est déjà utilisé par un autre compte. Veuillez en choisir un autre.' };
        }

        const cleanEmail = params.email?.trim() || undefined;

        const joinRes = await joinFoyerWithCode(params.inviteCode, {
            name: params.name,
            username: normalizedUsername,
            color: params.color,
            email: cleanEmail
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
            email: cleanEmail
        };

        const updated = [...profiles, newProfile];
        setProfiles(updated);
        syncProfilesToCloud(updated);

        // Save email pointer if present
        if (cleanEmail) {
            try {
                await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `profile_email_${cleanEmail.toLowerCase()}`);
                await (supabase.from('push_subscriptions') as any).insert({
                    user_id: `profile_email_${cleanEmail.toLowerCase()}`,
                    subscription: newProfile
                });
            } catch {}
        }

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
        setUsername(newProfile.username);
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

    const updateProfileEmail = useCallback((username: string, newEmail: string): boolean => {
        const normalizedUsername = username.toLowerCase().trim();
        const cleanEmail = newEmail.trim();
        if (!profiles.some(p => p.username === normalizedUsername)) {
            return false; // User not found
        }
        const updated = profiles.map(p => p.username === normalizedUsername ? { ...p, email: cleanEmail } : p);
        setProfiles(updated);
        syncProfilesToCloud(updated);
        return true;
    }, [profiles, setProfiles, syncProfilesToCloud]);

    const switchFoyer = useCallback(async (foyerId: string): Promise<boolean> => {
        try {
            const foyer = await fetchFoyerById(foyerId);
            if (foyer) {
                setCurrentFoyer(foyer);
                setStoredActiveFoyerId(foyer.id);
                try {
                    const raw = window.localStorage.getItem(SESSION_KEY) || window.localStorage.getItem('expense-app-session');
                    if (raw) {
                        const sess = JSON.parse(raw);
                        sess.foyer_id = foyer.id;
                        window.localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
                    }
                } catch {}
                return true;
            }
        } catch (e) {
            console.error('Error switching foyer:', e);
        }
        return false;
    }, []);

    const deleteProfile = useCallback(async (username: string): Promise<boolean> => {
        const normalizedUsername = username.toLowerCase().trim();
        if (normalizedUsername === 'vincent') {
            return false; // Impossible de supprimer l'administrateur principal
        }
        
        // 1. Delete individual profile row and any email/oauth lookup rows from Supabase push_subscriptions
        try {
            await (supabase.from('push_subscriptions') as any)
                .delete()
                .eq('user_id', `profile_${normalizedUsername}`);

            // Find any email or OAuth lookup rows that reference this username and delete them
            const { data: allProfileRows } = await (supabase.from('push_subscriptions') as any)
                .select('user_id, subscription')
                .like('user_id', 'profile_%');

            if (Array.isArray(allProfileRows)) {
                for (const row of allProfileRows) {
                    if (row.subscription?.username?.toLowerCase().trim() === normalizedUsername) {
                        await (supabase.from('push_subscriptions') as any)
                            .delete()
                            .eq('user_id', row.user_id);
                    }
                }
            }
        } catch (e) {
            console.warn(`Could not delete profile rows for ${normalizedUsername} from Supabase:`, e);
        }

        // 2. Remove member from current foyer ONLY if currentFoyer actually has this member
        if (currentFoyer && currentFoyer.members) {
            const hasMember = currentFoyer.members.some(m => 
                m.username?.toLowerCase().trim() === normalizedUsername ||
                m.name.toLowerCase().trim() === normalizedUsername
            );
            if (hasMember) {
                const remainingMembers = currentFoyer.members.filter(m => 
                    m.username?.toLowerCase().trim() !== normalizedUsername &&
                    m.name.toLowerCase().trim() !== normalizedUsername
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
        }

        // 3. Remove member from all foyers in foyerService
        try {
            const allFoyers = await fetchAllFoyers();
            for (const f of allFoyers) {
                if (f.members.some(m => m.username?.toLowerCase().trim() === normalizedUsername || m.name.toLowerCase().trim() === normalizedUsername)) {
                    await removeMemberFromFoyer(f.id, normalizedUsername);
                }
            }
        } catch (e) {
            console.warn('Error removing member from foyers:', e);
        }

        // 4. Update profiles state
        const updated = profiles.filter(p => p.username.toLowerCase().trim() !== normalizedUsername);
        setProfiles(updated);
        await syncProfilesToCloud(updated);

        // 5. Broadcast real-time user deletion to immediately kick out the deleted user
        try {
            const authChannel = supabase.channel('duobudget_auth_events');
            authChannel.send({
                type: 'broadcast',
                event: 'user_deleted_force_logout',
                payload: { username: normalizedUsername }
            });
        } catch (e) {
            console.warn('Could not broadcast user deletion:', e);
        }

        // 6. Clean up local storage
        localStorage.removeItem(`profile_${normalizedUsername}`);
        return true;
    }, [profiles, setProfiles, currentFoyer, syncProfilesToCloud]);

    // Password change for the currently logged-in user
    const changeMyPassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) {
            return { success: false, error: 'Non authentifié.' };
        }
        const effectiveUsername = (username || (typeof user === 'string' ? user : '')).toLowerCase().trim();
        const effectiveUserDisplay = (typeof user === 'string' ? user : '').toLowerCase().trim();
        const profile = profiles.find(p => 
            p.username?.toLowerCase().trim() === effectiveUsername || 
            p.username?.toLowerCase().trim() === effectiveUserDisplay || 
            p.user === user
        );

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
    }, [user, username, profiles, setProfiles, syncProfilesToCloud]);

    // Store Compliance (Apple & Google): Delete own account
    const deleteOwnAccount = useCallback(async (confirmPassword?: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'Non authentifié.' };
        const effectiveUsername = (username || (typeof user === 'string' ? user : '')).toLowerCase().trim();
        const effectiveUserDisplay = (typeof user === 'string' ? user : '').toLowerCase().trim();
        const profile = profiles.find(p => 
            p.username?.toLowerCase().trim() === effectiveUsername || 
            p.username?.toLowerCase().trim() === effectiveUserDisplay || 
            p.user === user
        );

        if (confirmPassword && profile && profile.password !== confirmPassword) {
            return { success: false, error: 'Mot de passe de confirmation incorrect.' };
        }

        const normToDelete = profile?.username?.toLowerCase().trim() || effectiveUsername;

        if (normToDelete === 'vincent') {
            return { success: false, error: "Le compte administrateur principal ne peut pas être supprimé." };
        }

        // 1. Delete individual profile record from Supabase push_subscriptions
        try {
            await (supabase.from('push_subscriptions') as any)
                .delete()
                .eq('user_id', `profile_${normToDelete}`);
        } catch (e) {
            console.warn(`Could not delete profile_${normToDelete} from Supabase:`, e);
        }

        // 2. Remove member from all foyers
        try {
            const allFoyers = await fetchAllFoyers();
            for (const f of allFoyers) {
                if (f.members.some(m => m.username?.toLowerCase().trim() === normToDelete || m.name.toLowerCase().trim() === normToDelete)) {
                    await removeMemberFromFoyer(f.id, normToDelete);
                }
            }
        } catch (e) {
            console.warn('Error removing member from foyers:', e);
        }

        // 3. Remove profile from profiles
        const updated = profiles.filter(p => p.username.toLowerCase().trim() !== normToDelete && p.user !== user);
        setProfiles(updated);
        await syncProfilesToCloud(updated);

        // 4. Remove local storage caches
        localStorage.removeItem(`profile_${normToDelete}`);
        localStorage.removeItem('user');
        localStorage.removeItem('duobudget_auth_state');

        // 5. Clear session and log out
        logout();
        return { success: true };
    }, [user, profiles, setProfiles, syncProfilesToCloud, logout]);
    
    // Mise à jour de la couleur d'un utilisateur (profil + membre de foyer)
    const updateUserColor = useCallback(async (username: string, newColor: string): Promise<boolean> => {
        const normUser = username.toLowerCase().trim();

        // 1. Mettre à jour profiles
        const updatedProfiles = profiles.map(p => 
            p.username.toLowerCase().trim() === normUser ? { ...p, color: newColor } : p
        );
        setProfiles(updatedProfiles);
        syncProfilesToCloud(updatedProfiles);

        // 2. Mettre à jour currentFoyer
        if (currentFoyer) {
            const res = await updateMemberColor(currentFoyer.id, normUser, newColor);
            if (res.success && res.foyer) {
                setCurrentFoyer(res.foyer);
            }
        }

        return true;
    }, [profiles, setProfiles, syncProfilesToCloud, currentFoyer]);

    // Fermer définitivement le foyer courant et supprimer toutes ses données
    const closeFoyer = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        if (!user || !currentFoyer) {
            return { success: false, error: 'Non authentifié ou aucun foyer actif.' };
        }
        
        if (currentFoyer.id === DEFAULT_FOYER_ID || currentFoyer.id === 'foyer_vincent_sophie') {
            return { success: false, error: 'Le foyer principal par défaut (Vincent & Sophie) ne peut pas être fermé.' };
        }

        const effectiveUsername = (username || (typeof user === 'string' ? user : '')).toLowerCase().trim();
        const effectiveUserDisplay = (typeof user === 'string' ? user : '').toLowerCase().trim();

        // Check if current user is admin of this foyer
        const myMember = currentFoyer.members?.find(m => {
            const mUser = m.username?.toLowerCase().trim();
            const mName = m.name?.toLowerCase().trim();
            const mId = m.id?.toLowerCase().trim();
            return (effectiveUsername && mUser === effectiveUsername) ||
                   (effectiveUserDisplay && mName === effectiveUserDisplay) ||
                   (effectiveUsername && mName === effectiveUsername) ||
                   (effectiveUsername && mId === effectiveUsername);
        });

        const isFoyerAdmin = myMember?.role === 'admin'
            || (currentFoyer.members && currentFoyer.members.length > 0 && (
                currentFoyer.members[0].username?.toLowerCase().trim() === effectiveUsername ||
                currentFoyer.members[0].name?.toLowerCase().trim() === effectiveUserDisplay
            ))
            || effectiveUsername === 'vincent'
            || effectiveUserDisplay === 'vincent'
            || !myMember
            || myMember.role !== 'member';

        if (!isFoyerAdmin) {
            return { success: false, error: 'Seuls les administrateurs du foyer peuvent le fermer définitivement.' };
        }

        const foyerIdToDelete = currentFoyer.id;

        try {
            // Delete foyer data via deleteFoyer service
            const deleteRes = await deleteFoyer(foyerIdToDelete);
            if (!deleteRes.success) {
                return deleteRes;
            }

            // Update global profiles: filter out any accounts belonging to this deleted foyer
            const updatedProfiles = profiles.filter(p => p.foyer_id !== foyerIdToDelete);
            setProfiles(updatedProfiles);
            await syncProfilesToCloud(updatedProfiles);

            // Broadcast real-time foyer deletion event so all connected members get logged out
            try {
                const syncChannel = supabase.channel('foyer_sync_channel');
                await syncChannel.send({
                    type: 'broadcast',
                    event: 'foyer_deleted',
                    payload: { foyerId: foyerIdToDelete }
                });
            } catch {}

            // Logout
            logout();

            return { success: true };
        } catch (e: any) {
            return { success: false, error: e?.message || 'Erreur lors de la suppression du foyer.' };
        }
    }, [user, username, currentFoyer, profiles, setProfiles, syncProfilesToCloud, logout]);

    // Quitter le foyer actif courant
    const leaveFoyer = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        if (!user || !currentFoyer) {
            return { success: false, error: 'Non authentifié ou aucun foyer actif.' };
        }
        
        if (currentFoyer.id === DEFAULT_FOYER_ID || currentFoyer.id === 'foyer_vincent_sophie') {
            return { success: false, error: 'Le foyer principal par défaut (Vincent & Sophie) ne peut pas être quitté.' };
        }

        const effectiveUsername = (username || (typeof user === 'string' ? user : '')).toLowerCase().trim();
        const effectiveUserDisplay = (typeof user === 'string' ? user : '').toLowerCase().trim();

        const myMember = currentFoyer.members?.find(m => {
            const mUser = m.username?.toLowerCase().trim();
            const mName = m.name?.toLowerCase().trim();
            const mId = m.id?.toLowerCase().trim();
            return (effectiveUsername && mUser === effectiveUsername) ||
                   (effectiveUserDisplay && mName === effectiveUserDisplay) ||
                   (effectiveUsername && mName === effectiveUsername) ||
                   (effectiveUsername && mId === effectiveUsername);
        });

        // Si l'utilisateur est administrateur ou seul membre, quitter le foyer le ferme définitivement et supprime les données
        const isFoyerAdmin = myMember?.role === 'admin'
            || (currentFoyer.members && currentFoyer.members.length > 0 && (
                currentFoyer.members[0].username?.toLowerCase().trim() === effectiveUsername ||
                currentFoyer.members[0].name?.toLowerCase().trim() === effectiveUserDisplay
            ))
            || effectiveUsername === 'vincent'
            || effectiveUserDisplay === 'vincent'
            || (currentFoyer.members && currentFoyer.members.length <= 1)
            || !myMember
            || myMember.role !== 'member';

        if (isFoyerAdmin) {
            return await closeFoyer();
        }

        // Pour un membre classique, quitter le foyer supprime définitivement son compte et le déconnecte
        return await deleteOwnAccount();
    }, [user, username, currentFoyer, closeFoyer, deleteOwnAccount]);

    // Only the exact account "vincent" is Super Administrator (never Vincent1, VincentA, etc.)
    const normalizedUsername = username ? username.toLowerCase().trim() : '';
    const normalizedUser = typeof user === 'string' ? user.toLowerCase().trim() : '';
    const isAdmin = Boolean(
        normalizedUsername === 'vincent' ||
        (user === User.Vincent && (!normalizedUsername || normalizedUsername === 'vincent')) ||
        (normalizedUser === 'vincent' && (!normalizedUsername || normalizedUsername === 'vincent'))
    );

    return { 
        user, 
        username,
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
        loginHistory: foyerLoginHistory,
        allLoginHistory: loginHistory
    };
};
