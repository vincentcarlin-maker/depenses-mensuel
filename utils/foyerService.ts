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
function getLocalFoyers(): Record<string, Foyer> {
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

function saveLocalFoyers(foyers: Record<string, Foyer>): void {
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

// Create a brand new Foyer
export async function createNewFoyer(
  foyerName: string,
  creator: { name: string; username: string; color?: string }
): Promise<{ success: boolean; foyer?: Foyer; error?: string }> {
  try {
    const foyerId = `foyer_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const inviteCode = generateFoyerCode(foyerName || creator.name);

    const newMember: FoyerMember = {
      id: creator.username.toLowerCase().trim(),
      name: creator.name.trim(),
      username: creator.username.toLowerCase().trim(),
      color: creator.color || '#0ea5e9',
      role: 'admin',
      joined_at: new Date().toISOString()
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
  newMemberData: { name: string; username: string; color?: string }
): Promise<{ success: boolean; foyer?: Foyer; error?: string }> {
  try {
    const foyer = await fetchFoyerByCode(inviteCode);
    if (!foyer) {
      return { 
        success: false, 
        error: `Code « ${inviteCode.toUpperCase().trim()} » introuvable. Vérifiez le code fourni par votre partenaire.` 
      };
    }

    const normalizedUsername = newMemberData.username.toLowerCase().trim();
    const existingIndex = foyer.members.findIndex(m => m.username === normalizedUsername);

    const memberObj: FoyerMember = {
      id: normalizedUsername,
      name: newMemberData.name.trim(),
      username: normalizedUsername,
      color: newMemberData.color || '#ec4899',
      role: 'member',
      joined_at: new Date().toISOString()
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
  const exists = foyer.members.some(m => m.username === normalizedUsername);
  if (exists) {
    return { success: false, error: 'Ce nom d’utilisateur existe déjà dans le foyer.' };
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
  const updatedMembers = foyer.members.filter(m => m.username !== normalizedUsername);

  const updatedFoyer: Foyer = {
    ...foyer,
    members: updatedMembers
  };

  await saveFoyerToCloudAndLocal(updatedFoyer);
  return { success: true, foyer: updatedFoyer };
}
