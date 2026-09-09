import { supabase } from '../supabase/client';
import { Foyer, FoyerMember } from '../types';

export const DEFAULT_FOYER_ID = 'foyer_vincent_sophie';

export const DEFAULT_FOYER: Foyer = {
  id: DEFAULT_FOYER_ID,
  name: 'Foyer Vincent & Sophie',
  code: 'VIN-SOP',
  created_at: '2023-10-01T00:00:00Z',
  members: [
    { id: 'sophie', name: 'Sophie', username: 'sophie', color: '#ec4899', role: 'admin' },
    { id: 'vincent', name: 'Vincent', username: 'vincent', color: '#0ea5e9', role: 'admin' }
  ]
};

const LOCAL_FOYERS_KEY = 'duobudget_local_foyers_v1';
const ACTIVE_FOYER_KEY = 'duobudget_active_foyer_id';

// Generate clean 6-character code like "PAR-839" or "FOY-421"
export function generateFoyerCode(name?: string): string {
  const letters = name && name.trim().length >= 3 
    ? name.trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'FOY')
    : 'FOY';
  const digits = Math.floor(100 + Math.random() * 900).toString();
  return `${letters}-${digits}`;
}

// Get cached foyers from localStorage
export function getLocalFoyers(): Record<string, Foyer> {
  try {
    const raw = localStorage.getItem(LOCAL_FOYERS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed[DEFAULT_FOYER_ID]) {
      parsed[DEFAULT_FOYER_ID] = DEFAULT_FOYER;
    }
    return parsed;
  } catch {
    return { [DEFAULT_FOYER_ID]: DEFAULT_FOYER };
  }
}

export function saveLocalFoyers(foyers: Record<string, Foyer>): void {
  try {
    localStorage.setItem(LOCAL_FOYERS_KEY, JSON.stringify(foyers));
  } catch (e) {
    console.error('Error saving local foyers:', e);
  }
}

// Get active foyer ID
export function getStoredActiveFoyerId(): string {
  try {
    return localStorage.getItem(ACTIVE_FOYER_KEY) || DEFAULT_FOYER_ID;
  } catch {
    return DEFAULT_FOYER_ID;
  }
}

export function setStoredActiveFoyerId(foyerId: string): void {
  try {
    localStorage.setItem(ACTIVE_FOYER_KEY, foyerId);
  } catch (e) {
    console.error('Error setting active foyer id:', e);
  }
}

// Save Foyer both locally and to Supabase Cloud
export async function saveFoyerToCloudAndLocal(foyer: Foyer): Promise<boolean> {
  // Save local
  const local = getLocalFoyers();
  local[foyer.id] = foyer;
  saveLocalFoyers(local);

  // Sync to Supabase push_subscriptions (acts as durable JSON registry)
  try {
    // Save by foyer_id
    await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `foyer_id_${foyer.id}`);
    await (supabase.from('push_subscriptions') as any).insert({
      user_id: `foyer_id_${foyer.id}`,
      subscription: foyer
    });

    // Save by invite code (normalized uppercase)
    const normalizedCode = foyer.code.toUpperCase().trim();
    await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `foyer_reg_${normalizedCode}`);
    await (supabase.from('push_subscriptions') as any).insert({
      user_id: `foyer_reg_${normalizedCode}`,
      subscription: foyer
    });

    // Real-time broadcast
    const channel = supabase.channel('foyer_sync_channel');
    channel.send({
      type: 'broadcast',
      event: 'foyer_updated',
      payload: { foyer }
    });

    return true;
  } catch (e) {
    console.warn('Could not sync foyer to cloud:', e);
    return true; // Still saved locally
  }
}

// Fetch Foyer by ID (Cloud + Local fallback)
export async function fetchFoyerById(foyerId: string): Promise<Foyer | null> {
  if (foyerId === DEFAULT_FOYER_ID) {
    return DEFAULT_FOYER;
  }

  // Check local cache
  const local = getLocalFoyers();
  if (local[foyerId]) {
    // Also re-check cloud asynchronously
    (supabase.from('push_subscriptions') as any)
      .select('subscription')
      .eq('user_id', `foyer_id_${foyerId}`)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.subscription) {
          const cloudFoyer = data.subscription as Foyer;
          local[foyerId] = cloudFoyer;
          saveLocalFoyers(local);
        }
      });
    return local[foyerId];
  }

  try {
    const { data, error } = await (supabase.from('push_subscriptions') as any)
      .select('subscription')
      .eq('user_id', `foyer_id_${foyerId}`)
      .maybeSingle();

    if (!error && data?.subscription) {
      const cloudFoyer = data.subscription as Foyer;
      local[foyerId] = cloudFoyer;
      saveLocalFoyers(local);
      return cloudFoyer;
    }
  } catch (e) {
    console.error('Error fetching foyer from cloud:', e);
  }

  return local[foyerId] || null;
}

// Fetch Foyer by Invitation Code (used when a partner links their account)
export async function fetchFoyerByCode(code: string): Promise<Foyer | null> {
  const normalizedCode = code.toUpperCase().trim();

  if (normalizedCode === 'VIN-SOP' || normalizedCode === DEFAULT_FOYER.code) {
    return DEFAULT_FOYER;
  }

  // Check local cache first
  const local = getLocalFoyers();
  const localMatch = Object.values(local).find(f => f.code.toUpperCase().trim() === normalizedCode);
  if (localMatch) {
    return localMatch;
  }

  try {
    const { data, error } = await (supabase.from('push_subscriptions') as any)
      .select('subscription')
      .eq('user_id', `foyer_reg_${normalizedCode}`)
      .maybeSingle();

    if (!error && data?.subscription) {
      const foundFoyer = data.subscription as Foyer;
      local[foundFoyer.id] = foundFoyer;
      saveLocalFoyers(local);
      return foundFoyer;
    }
  } catch (e) {
    console.error('Error fetching foyer by code from cloud:', e);
  }

  return null;
}

// Check globally across all foyers and local profiles if a username is already taken
export async function isUsernameAlreadyUsed(username: string): Promise<boolean> {
  const norm = username.toLowerCase().trim();
  if (!norm) return false;

  // 1. Check default profiles
  if (norm === 'vincent' || norm === 'sophie') return true;

  // 2. Check local profiles
  try {
    const rawProfiles = localStorage.getItem('expense-tracker-profiles');
    if (rawProfiles) {
      const profiles = JSON.parse(rawProfiles);
      if (Array.isArray(profiles) && profiles.some((p: any) => p.username?.toLowerCase().trim() === norm)) {
        return true;
      }
    }
  } catch {
    // Ignore storage parse error
  }

  // 3. Check all foyers in cloud & local
  try {
    const allFoyers = await fetchAllFoyers();
    for (const f of allFoyers) {
      if (f.members && Array.isArray(f.members)) {
        if (f.members.some((m: any) => m.username?.toLowerCase().trim() === norm)) {
          return true;
        }
      }
    }
  } catch {
    // Best effort check
  }

  return false;
}

// Create a brand new Foyer
export async function createNewFoyer(
  foyerName: string,
  creator: { name: string; username: string; color?: string; email?: string }
): Promise<{ success: boolean; foyer?: Foyer; error?: string }> {
  try {
    const normalizedUsername = creator.username.toLowerCase().trim();
    if (await isUsernameAlreadyUsed(normalizedUsername)) {
      return { success: false, error: 'Cet identifiant est déjà pris par un autre compte. Veuillez en choisir un différent.' };
    }

    const foyerId = `foyer_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const inviteCode = generateFoyerCode(foyerName || creator.name);

    const newMember: FoyerMember = {
      id: normalizedUsername,
      name: creator.name.trim(),
      username: normalizedUsername,
      color: creator.color || '#0ea5e9',
      role: 'admin',
      joined_at: new Date().toISOString(),
      email: creator.email?.trim() || undefined
    };

    const newFoyer: Foyer = {
      id: foyerId,
      name: foyerName.trim() || `Foyer de ${creator.name.trim()}`,
      code: inviteCode,
      created_at: new Date().toISOString(),
      members: [newMember]
    };

    await saveFoyerToCloudAndLocal(newFoyer);
    setStoredActiveFoyerId(foyerId);

    // Initialize the three requested default categories for the new foyer
    const defaultNewFoyerCategories = ["Dépenses récurrentes", "Courses", "Carburant"];
    try {
      window.localStorage.setItem(`expenseCategories_${foyerId}`, JSON.stringify(defaultNewFoyerCategories));
      (async () => {
        try {
          await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `setting_expenseCategories_${foyerId}`);
          await (supabase.from('push_subscriptions') as any).insert({
            user_id: `setting_expenseCategories_${foyerId}`,
            subscription: { value: defaultNewFoyerCategories }
          });
        } catch (err) {
          console.warn('Could not sync initial categories to cloud:', err);
        }
      })();
    } catch {
      // LocalStorage fallback
    }

    return { success: true, foyer: newFoyer };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Erreur lors de la création du foyer.' };
  }
}

// Join an existing Foyer using an invite code
export async function joinFoyerWithCode(
  inviteCode: string,
  newMemberData: { name: string; username: string; color?: string; email?: string }
): Promise<{ success: boolean; foyer?: Foyer; error?: string }> {
  try {
    const normalizedUsername = newMemberData.username.toLowerCase().trim();
    if (await isUsernameAlreadyUsed(normalizedUsername)) {
      return { success: false, error: 'Cet identifiant est déjà pris par un autre compte. Veuillez en choisir un différent.' };
    }

    const foyer = await fetchFoyerByCode(inviteCode);
    if (!foyer) {
      return { 
        success: false, 
        error: `Code « ${inviteCode.toUpperCase().trim()} » introuvable. Vérifiez le code fourni par votre partenaire.` 
      };
    }

    const existingIndex = foyer.members.findIndex(m => m.username === normalizedUsername);

    const memberObj: FoyerMember = {
      id: normalizedUsername,
      name: newMemberData.name.trim(),
      username: normalizedUsername,
      color: newMemberData.color || '#ec4899',
      role: 'member',
      joined_at: new Date().toISOString(),
      email: newMemberData.email?.trim() || undefined
    };

    let updatedMembers: FoyerMember[];
    if (existingIndex >= 0) {
      updatedMembers = [...foyer.members];
      updatedMembers[existingIndex] = { ...updatedMembers[existingIndex], ...memberObj };
    } else {
      updatedMembers = [...foyer.members, memberObj];
    }

    const updatedFoyer: Foyer = {
      ...foyer,
      members: updatedMembers
    };

    await saveFoyerToCloudAndLocal(updatedFoyer);
    setStoredActiveFoyerId(updatedFoyer.id);

    return { success: true, foyer: updatedFoyer };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Erreur lors de la liaison au foyer.' };
  }
}

// Add a member directly to a foyer (by another member already in the foyer)
export async function addMemberToFoyer(
  foyerId: string,
  member: { name: string; username: string; color?: string; role?: 'admin' | 'member' }
): Promise<{ success: boolean; foyer?: Foyer; error?: string }> {
  const foyer = await fetchFoyerById(foyerId);
  if (!foyer) return { success: false, error: 'Foyer introuvable.' };

  const normalizedUsername = member.username.toLowerCase().trim();
  if (await isUsernameAlreadyUsed(normalizedUsername)) {
    return { success: false, error: 'Cet identifiant est déjà utilisé par un autre compte.' };
  }

  const newMember: FoyerMember = {
    id: normalizedUsername,
    name: member.name.trim(),
    username: normalizedUsername,
    color: member.color || '#10b981',
    role: member.role || 'member',
    joined_at: new Date().toISOString()
  };

  const updatedFoyer: Foyer = {
    ...foyer,
    members: [...foyer.members, newMember]
  };

  await saveFoyerToCloudAndLocal(updatedFoyer);
  return { success: true, foyer: updatedFoyer };
}

// Remove a member from a foyer
export async function removeMemberFromFoyer(
  foyerId: string,
  usernameToRemove: string
): Promise<{ success: boolean; foyer?: Foyer; error?: string }> {
  const foyer = await fetchFoyerById(foyerId);
  if (!foyer) return { success: false, error: 'Foyer introuvable.' };

  if (foyer.members.length <= 1) {
    return { success: false, error: 'Impossible de supprimer le dernier membre du foyer.' };
  }

  const normalizedUsername = usernameToRemove.toLowerCase().trim();
  const updatedMembers = foyer.members.filter(m => m.username.toLowerCase().trim() !== normalizedUsername);

  const updatedFoyer: Foyer = {
    ...foyer,
    members: updatedMembers
  };

  await saveFoyerToCloudAndLocal(updatedFoyer);

  // Clean up user profile for removed member (unless Vincent / Sophie)
  if (normalizedUsername !== 'vincent' && normalizedUsername !== 'sophie') {
    try {
      // 1. Delete individual profile row and any email/oauth lookup rows from Supabase
      await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `profile_${normalizedUsername}`);

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

      // 2. Remove from app_user_profiles_v2
      const { data: globalData } = await (supabase.from('push_subscriptions') as any)
        .select('subscription')
        .eq('user_id', 'app_user_profiles_v2')
        .maybeSingle();

      if (globalData?.subscription?.profiles && Array.isArray(globalData.subscription.profiles)) {
        const cleanedProfiles = globalData.subscription.profiles.filter(
          (p: any) => p.username?.toLowerCase().trim() !== normalizedUsername
        );
        await (supabase.from('push_subscriptions') as any).delete().eq('user_id', 'app_user_profiles_v2');
        await (supabase.from('push_subscriptions') as any).insert({
          user_id: 'app_user_profiles_v2',
          subscription: { profiles: cleanedProfiles }
        });
      }

      // 3. Clean up localStorage
      const rawLocal = localStorage.getItem('expense-app-profiles-v2');
      if (rawLocal) {
        try {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) {
            const updated = parsed.filter((p: any) => p.username?.toLowerCase().trim() !== normalizedUsername);
            localStorage.setItem('expense-app-profiles-v2', JSON.stringify(updated));
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Could not clean profile for removed member:', err);
    }
  }

  return { success: true, foyer: updatedFoyer };
}

// Fetch all Foyers (Cloud + LocalStorage merged)
export async function fetchAllFoyers(): Promise<Foyer[]> {
  const localMap = getLocalFoyers();
  if (!localMap[DEFAULT_FOYER_ID]) {
    localMap[DEFAULT_FOYER_ID] = DEFAULT_FOYER;
  }

  try {
    const { data, error } = await (supabase.from('push_subscriptions') as any)
      .select('subscription')
      .like('user_id', 'foyer_id_%');

    if (!error && Array.isArray(data)) {
      // Create a fresh map starting from DEFAULT_FOYER
      const cloudMap: Record<string, Foyer> = {
        [DEFAULT_FOYER_ID]: DEFAULT_FOYER
      };

      const orphanedGhostFoyerIds: string[] = [];

      for (const item of data) {
        if (item?.subscription && item.subscription.id) {
          const cloudFoyer = item.subscription as Foyer;
          if (cloudFoyer.id !== DEFAULT_FOYER_ID && cloudFoyer.id !== 'foyer_vincent_sophie') {
            // If foyer has no members left, mark as ghost/orphaned and do not display
            if (!cloudFoyer.members || !Array.isArray(cloudFoyer.members) || cloudFoyer.members.length === 0) {
              orphanedGhostFoyerIds.push(cloudFoyer.id);
              continue;
            }
          }
          cloudMap[cloudFoyer.id] = cloudFoyer;
        }
      }

      // Purge ghost foyers asynchronously from cloud
      if (orphanedGhostFoyerIds.length > 0) {
        (async () => {
          for (const ghostId of orphanedGhostFoyerIds) {
            try {
              await deleteFoyer(ghostId);
            } catch {}
          }
        })();
      }

      // Overwrite local map with current cloud source of truth
      saveLocalFoyers(cloudMap);
      return Object.values(cloudMap).sort((a, b) => {
        if (a.id === DEFAULT_FOYER_ID) return -1;
        if (b.id === DEFAULT_FOYER_ID) return 1;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
    }
  } catch (e) {
    console.error('Error fetching all foyers from cloud:', e);
  }

  const foyers = Object.values(localMap).filter(f => {
    if (f.id === DEFAULT_FOYER_ID || f.id === 'foyer_vincent_sophie') return true;
    return f.members && Array.isArray(f.members) && f.members.length > 0;
  });

  return foyers.sort((a, b) => {
    if (a.id === DEFAULT_FOYER_ID) return -1;
    if (b.id === DEFAULT_FOYER_ID) return 1;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}

// Update Foyer details (name and/or code)
export async function updateFoyer(
  foyerId: string,
  updates: Partial<Pick<Foyer, 'name' | 'code'>>
): Promise<{ success: boolean; foyer?: Foyer; error?: string }> {
  try {
    const existing = await fetchFoyerById(foyerId);
    if (!existing) {
      return { success: false, error: 'Foyer introuvable.' };
    }

    const oldCode = existing.code;
    const newCode = updates.code ? updates.code.toUpperCase().trim() : existing.code;
    const newName = updates.name !== undefined ? updates.name.trim() : existing.name;

    const updatedFoyer: Foyer = {
      ...existing,
      name: newName || existing.name,
      code: newCode || existing.code,
    };

    // If code changed, clean up old registration in push_subscriptions
    if (oldCode && oldCode.toUpperCase().trim() !== newCode) {
      try {
        await (supabase.from('push_subscriptions') as any)
          .delete()
          .eq('user_id', `foyer_reg_${oldCode.toUpperCase().trim()}`);
      } catch (err) {
        console.warn('Could not delete old code reg:', err);
      }
    }

    await saveFoyerToCloudAndLocal(updatedFoyer);
    return { success: true, foyer: updatedFoyer };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Erreur lors de la mise à jour du foyer.' };
  }
}

// Delete a Foyer (Protected: cannot delete DEFAULT_FOYER_ID)
export async function deleteFoyer(foyerId: string): Promise<{ success: boolean; error?: string }> {
  if (foyerId === DEFAULT_FOYER_ID || foyerId === 'foyer_vincent_sophie') {
    return { success: false, error: 'Le foyer principal par défaut (Vincent & Sophie) ne peut pas être supprimé.' };
  }

  try {
    // 1. Get foyer details before deletion to identify members and invite code
    const local = getLocalFoyers();
    let foyer = local[foyerId];

    if (!foyer) {
      try {
        const { data } = await (supabase.from('push_subscriptions') as any)
          .select('subscription')
          .eq('user_id', `foyer_id_${foyerId}`)
          .maybeSingle();
        if (data?.subscription) {
          foyer = data.subscription as Foyer;
        }
      } catch {}
    }

    const code = foyer?.code;

    // Discover all usernames belonging to this foyer from multiple sources
    const targetUsernames = new Set<string>();
    (foyer?.members || []).forEach(m => {
      if (m.username) targetUsernames.add(m.username.toLowerCase().trim());
      if (m.name) targetUsernames.add(m.name.toLowerCase().trim());
      if (m.id) targetUsernames.add(m.id.toLowerCase().trim());
    });

    // Check global app_user_profiles_v2
    let globalProfiles: any[] = [];
    try {
      const { data: globalData } = await (supabase.from('push_subscriptions') as any)
        .select('subscription')
        .eq('user_id', 'app_user_profiles_v2')
        .maybeSingle();

      if (globalData?.subscription?.profiles && Array.isArray(globalData.subscription.profiles)) {
        globalProfiles = globalData.subscription.profiles;
        globalProfiles.forEach((p: any) => {
          if (p.foyer_id === foyerId && p.username) {
            targetUsernames.add(p.username.toLowerCase().trim());
          }
        });
      }
    } catch {}

    // Check individual profile rows in push_subscriptions
    const individualProfileRowsToDelete: string[] = [];
    try {
      const { data: individualRows } = await (supabase.from('push_subscriptions') as any)
        .select('user_id, subscription')
        .like('user_id', 'profile_%');

      if (Array.isArray(individualRows)) {
        individualRows.forEach((row: any) => {
          const sub = row?.subscription;
          if (
            sub?.foyer_id === foyerId ||
            (sub?.username && targetUsernames.has(sub.username.toLowerCase().trim()))
          ) {
            if (sub?.username) targetUsernames.add(sub.username.toLowerCase().trim());
            individualProfileRowsToDelete.push(row.user_id);
          }
        });
      }
    } catch {}

    // Check local storage profiles
    try {
      const rawProfiles = localStorage.getItem('expense-app-profiles-v2');
      if (rawProfiles) {
        const parsed = JSON.parse(rawProfiles);
        if (Array.isArray(parsed)) {
          parsed.forEach((p: any) => {
            if (p.foyer_id === foyerId && p.username) {
              targetUsernames.add(p.username.toLowerCase().trim());
            }
          });
        }
      }
    } catch {}

    // Protect master admins
    targetUsernames.delete('vincent');
    targetUsernames.delete('sophie');

    const memberUsernames = Array.from(targetUsernames);

    // 2. Remove foyer from local cache immediately
    delete local[foyerId];
    saveLocalFoyers(local);

    // 3. Remove local foyer settings & categories
    try {
      localStorage.removeItem(`expenseCategories_${foyerId}`);
      localStorage.removeItem(`customCategoryRules_${foyerId}`);
      localStorage.removeItem(`moneyPots_${foyerId}`);
      localStorage.removeItem(`moneyPotTransactions_${foyerId}`);
    } catch {}

    // 4. If deleted foyer was currently active in localStorage, remove active foyer key
    if (getStoredActiveFoyerId() === foyerId) {
      try {
        localStorage.removeItem('duobudget_active_foyer_id');
      } catch {}
    }

    // 5. Clean up ALL foyer-related rows in Supabase push_subscriptions
    try {
      await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `foyer_id_${foyerId}`);
      if (code) {
        await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `foyer_reg_${code.toUpperCase().trim()}`);
      }
      await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `setting_expenseCategories_${foyerId}`);
      await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `custom_category_rules_${foyerId}`);
      await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `money_pots_${foyerId}`);
      await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `money_pot_transactions_${foyerId}`);

      // Scan and purge any registration rows matching this foyer ID or code
      const { data: allRegRows } = await (supabase.from('push_subscriptions') as any)
        .select('user_id, subscription')
        .or(`user_id.like.foyer_id_%,user_id.like.foyer_reg_%`);

      if (Array.isArray(allRegRows)) {
        for (const row of allRegRows) {
          if (
            row?.subscription?.id === foyerId ||
            row?.user_id === `foyer_id_${foyerId}` ||
            (code && row?.user_id === `foyer_reg_${code.toUpperCase().trim()}`)
          ) {
            await (supabase.from('push_subscriptions') as any).delete().eq('user_id', row.user_id);
          }
        }
      }
    } catch (err) {
      console.warn('Could not delete foyer subscriptions from cloud:', err);
    }

    // 6. Clean up individual member profile records & email/oauth pointers
    for (const uName of memberUsernames) {
      try {
        await (supabase.from('push_subscriptions') as any).delete().eq('user_id', `profile_${uName}`);
        localStorage.removeItem(`profile_${uName}`);
      } catch {}
    }

    for (const rowUserId of individualProfileRowsToDelete) {
      try {
        await (supabase.from('push_subscriptions') as any).delete().eq('user_id', rowUserId);
      } catch {}
    }

    // 7. Always update merged app_user_profiles_v2 in Supabase
    let cleanedProfiles: any[] = [];
    try {
      const { data: freshGlobal } = await (supabase.from('push_subscriptions') as any)
        .select('subscription')
        .eq('user_id', 'app_user_profiles_v2')
        .maybeSingle();

      const profilesToClean = freshGlobal?.subscription?.profiles || globalProfiles;

      if (Array.isArray(profilesToClean)) {
        cleanedProfiles = profilesToClean.filter((p: any) => {
          const pFoyerId = p.foyer_id;
          const pUsername = p.username?.toLowerCase().trim();
          if (pUsername === 'vincent' || pUsername === 'sophie') return true;
          if (pFoyerId === foyerId) return false;
          if (pUsername && memberUsernames.includes(pUsername)) return false;
          return true;
        });

        await (supabase.from('push_subscriptions') as any).delete().eq('user_id', 'app_user_profiles_v2');
        await (supabase.from('push_subscriptions') as any).insert({
          user_id: 'app_user_profiles_v2',
          subscription: { profiles: cleanedProfiles }
        });
      }
    } catch (err) {
      console.warn('Could not update app_user_profiles_v2 after foyer deletion:', err);
    }

    // 8. Clean up local profiles in localStorage
    try {
      const rawProfiles = localStorage.getItem('expense-app-profiles-v2');
      if (rawProfiles) {
        const parsed = JSON.parse(rawProfiles);
        if (Array.isArray(parsed)) {
          const localCleaned = parsed.filter((p: any) => {
            const pFoyerId = p.foyer_id;
            const pUsername = p.username?.toLowerCase().trim();
            if (pUsername === 'vincent' || pUsername === 'sophie') return true;
            if (pFoyerId === foyerId) return false;
            if (pUsername && memberUsernames.includes(pUsername)) return false;
            return true;
          });
          localStorage.setItem('expense-app-profiles-v2', JSON.stringify(localCleaned));
          if (cleanedProfiles.length === 0) {
            cleanedProfiles = localCleaned;
          }
        }
      }
    } catch {}

    // 9. Delete associated data in Supabase tables (expenses, reminders, logs)
    try {
      await supabase.from('expenses').delete().eq('foyer_id', foyerId);
      await supabase.from('reminders').delete().eq('foyer_id', foyerId);
      await (supabase.from('login_logs') as any).delete().eq('foyer_id', foyerId);
    } catch (err) {
      console.warn('Could not delete foyer table rows:', err);
    }

    // 10. Broadcast profile changes so active clients immediately remove deleted accounts
    if (cleanedProfiles.length > 0) {
      try {
        const profilesChannel = supabase.channel('duobudget_profiles_channel_v2');
        profilesChannel.send({
          type: 'broadcast',
          event: 'user_profiles_changed',
          payload: { profiles: cleanedProfiles }
        });
      } catch {}
    }

    // 11. Real-time broadcast deletion to sync and admin channels
    try {
      const channel = supabase.channel('foyer_sync_channel');
      channel.send({
        type: 'broadcast',
        event: 'foyer_deleted',
        payload: { foyerId, deletedUsernames: memberUsernames }
      });
    } catch {}

    try {
      const adminChannel = supabase.channel('foyer_admin_channel');
      adminChannel.send({
        type: 'broadcast',
        event: 'foyer_deleted',
        payload: { foyerId, deletedUsernames: memberUsernames }
      });
    } catch {}

    return { success: true };
  } catch (e: any) {
    console.error('deleteFoyer fatal error:', e);
    return { success: false, error: e?.message || 'Erreur lors de la suppression du foyer.' };
  }
}

// Update a member's role inside a foyer
export async function updateMemberRole(
  foyerId: string,
  username: string,
  newRole: 'admin' | 'member'
): Promise<{ success: boolean; foyer?: Foyer; error?: string }> {
  const foyer = await fetchFoyerById(foyerId);
  if (!foyer) return { success: false, error: 'Foyer introuvable.' };

  const normUser = username.toLowerCase().trim();
  const memberIndex = foyer.members.findIndex(m => m.username === normUser);
  if (memberIndex === -1) {
    return { success: false, error: 'Membre introuvable dans ce foyer.' };
  }

  const updatedMembers = [...foyer.members];
  updatedMembers[memberIndex] = {
    ...updatedMembers[memberIndex],
    role: newRole
  };

  const updatedFoyer: Foyer = {
    ...foyer,
    members: updatedMembers
  };

  await saveFoyerToCloudAndLocal(updatedFoyer);
  return { success: true, foyer: updatedFoyer };
}

// Update a member's avatar / badge color inside a foyer
export async function updateMemberColor(
  foyerId: string,
  username: string,
  newColor: string
): Promise<{ success: boolean; foyer?: Foyer; error?: string }> {
  const foyer = await fetchFoyerById(foyerId);
  if (!foyer) return { success: false, error: 'Foyer introuvable.' };

  const normUser = username.toLowerCase().trim();
  const memberIndex = foyer.members.findIndex(m => m.username === normUser);
  if (memberIndex === -1) {
    return { success: false, error: 'Membre introuvable dans ce foyer.' };
  }

  const updatedMembers = [...foyer.members];
  updatedMembers[memberIndex] = {
    ...updatedMembers[memberIndex],
    color: newColor
  };

  const updatedFoyer: Foyer = {
    ...foyer,
    members: updatedMembers
  };

  await saveFoyerToCloudAndLocal(updatedFoyer);
  return { success: true, foyer: updatedFoyer };
}

