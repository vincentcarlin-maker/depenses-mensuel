export interface UserColorOption {
  label: string;
  value: string;
  bgClass: string;
  ringClass: string;
  lightBgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
}

export const USER_COLORS: UserColorOption[] = [
  { label: 'Bleu ciel', value: '#0ea5e9', bgClass: 'bg-sky-500', ringClass: 'ring-sky-500', lightBgClass: 'bg-sky-50/50 dark:bg-sky-950/20', borderClass: 'border-sky-100/90 dark:border-sky-900/30', textClass: 'text-sky-600 dark:text-sky-400', badgeClass: 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300' },
  { label: 'Rose poudré', value: '#ec4899', bgClass: 'bg-pink-500', ringClass: 'ring-pink-500', lightBgClass: 'bg-pink-50/50 dark:bg-pink-950/20', borderClass: 'border-pink-100/90 dark:border-pink-900/30', textClass: 'text-pink-600 dark:text-pink-400', badgeClass: 'bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300' },
  { label: 'Émeraude', value: '#10b981', bgClass: 'bg-emerald-500', ringClass: 'ring-emerald-500', lightBgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20', borderClass: 'border-emerald-100/90 dark:border-emerald-900/30', textClass: 'text-emerald-600 dark:text-emerald-400', badgeClass: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300' },
  { label: 'Violet', value: '#8b5cf6', bgClass: 'bg-purple-500', ringClass: 'ring-purple-500', lightBgClass: 'bg-purple-50/50 dark:bg-purple-950/20', borderClass: 'border-purple-100/90 dark:border-purple-900/30', textClass: 'text-purple-600 dark:text-purple-400', badgeClass: 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300' },
  { label: 'Ambre / Orange', value: '#f97316', bgClass: 'bg-orange-500', ringClass: 'ring-orange-500', lightBgClass: 'bg-orange-50/50 dark:bg-orange-950/20', borderClass: 'border-orange-100/90 dark:border-orange-900/30', textClass: 'text-orange-600 dark:text-orange-400', badgeClass: 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300' },
  { label: 'Indigo', value: '#6366f1', bgClass: 'bg-indigo-500', ringClass: 'ring-indigo-500', lightBgClass: 'bg-indigo-50/50 dark:bg-indigo-950/20', borderClass: 'border-indigo-100/90 dark:border-indigo-900/30', textClass: 'text-indigo-600 dark:text-indigo-400', badgeClass: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300' },
  { label: 'Corail', value: '#f43f5e', bgClass: 'bg-rose-500', ringClass: 'ring-rose-500', lightBgClass: 'bg-rose-50/50 dark:bg-rose-950/20', borderClass: 'border-rose-100/90 dark:border-rose-900/30', textClass: 'text-rose-600 dark:text-rose-400', badgeClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300' },
  { label: 'Turquoise', value: '#06b6d4', bgClass: 'bg-cyan-500', ringClass: 'ring-cyan-500', lightBgClass: 'bg-cyan-50/50 dark:bg-cyan-950/20', borderClass: 'border-cyan-100/90 dark:border-cyan-900/30', textClass: 'text-cyan-600 dark:text-cyan-400', badgeClass: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300' },
  { label: 'Citron vert', value: '#84cc16', bgClass: 'bg-lime-500', ringClass: 'ring-lime-500', lightBgClass: 'bg-lime-50/50 dark:bg-lime-950/20', borderClass: 'border-lime-100/90 dark:border-lime-900/30', textClass: 'text-lime-600 dark:text-lime-400', badgeClass: 'bg-lime-100 dark:bg-lime-950/80 text-lime-700 dark:text-lime-300' },
  { label: 'Fuchsia', value: '#d946ef', bgClass: 'bg-fuchsia-500', ringClass: 'ring-fuchsia-500', lightBgClass: 'bg-fuchsia-50/50 dark:bg-fuchsia-950/20', borderClass: 'border-fuchsia-100/90 dark:border-fuchsia-900/30', textClass: 'text-fuchsia-600 dark:text-fuchsia-400', badgeClass: 'bg-fuchsia-100 dark:bg-fuchsia-950/80 text-fuchsia-700 dark:text-fuchsia-300' },
  { label: 'Jaune doré', value: '#eab308', bgClass: 'bg-yellow-500', ringClass: 'ring-yellow-500', lightBgClass: 'bg-yellow-50/50 dark:bg-yellow-950/20', borderClass: 'border-yellow-100/90 dark:border-yellow-900/30', textClass: 'text-yellow-600 dark:text-yellow-400', badgeClass: 'bg-yellow-100 dark:bg-yellow-950/80 text-yellow-700 dark:text-yellow-300' },
  { label: 'Ardoise', value: '#64748b', bgClass: 'bg-slate-500', ringClass: 'ring-slate-500', lightBgClass: 'bg-slate-50/50 dark:bg-slate-800/40', borderClass: 'border-slate-200/80 dark:border-slate-700', textClass: 'text-slate-600 dark:text-slate-400', badgeClass: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200' },
];

export function getUserColorOption(hexColor?: string): UserColorOption {
  if (!hexColor) return USER_COLORS[0];
  const found = USER_COLORS.find(c => c.value.toLowerCase() === hexColor.toLowerCase());
  if (found) return found;
  return {
    label: 'Personnalisée',
    value: hexColor,
    bgClass: 'bg-sky-500',
    ringClass: 'ring-sky-500',
    lightBgClass: 'bg-sky-50/50 dark:bg-sky-950/20',
    borderClass: 'border-sky-100/90 dark:border-sky-900/30',
    textClass: 'text-sky-600 dark:text-sky-400',
    badgeClass: 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300',
  };
}

export interface UserTheme {
  hex: string;
  bgClass: string;
  ringClass: string;
  lightBgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
  activeButtonClass: string;
}

export function resolveUserTheme(
  userNameOrUser?: string | null,
  members?: Array<{ name?: string; username?: string; color?: string }>,
  profiles?: Array<{ username?: string; user?: string; color?: string }>
): UserTheme {
  const norm = String(userNameOrUser || '').trim().toLowerCase();

  // Special case: Cagnotte / Commun
  if (norm === 'commun' || norm === 'cagnotte') {
    const purple = getUserColorOption('#8b5cf6');
    return {
      hex: '#8b5cf6',
      bgClass: purple.bgClass,
      ringClass: purple.ringClass,
      lightBgClass: purple.lightBgClass,
      borderClass: purple.borderClass,
      textClass: purple.textClass,
      badgeClass: purple.badgeClass,
      activeButtonClass: 'bg-purple-50/90 dark:bg-purple-950/40 border-2 border-purple-500 dark:border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
    };
  }

  // 1. Check in members
  let hex: string | undefined;
  if (members && Array.isArray(members)) {
    const matchedMember = members.find(m => 
      (m.name && m.name.toLowerCase().trim() === norm) ||
      (m.username && m.username.toLowerCase().trim() === norm)
    );
    if (matchedMember?.color) {
      hex = matchedMember.color;
    }
  }

  // 2. Check in profiles
  if (!hex && profiles && Array.isArray(profiles)) {
    const matchedProfile = profiles.find(p => 
      (p.user && String(p.user).toLowerCase().trim() === norm) ||
      (p.username && p.username.toLowerCase().trim() === norm)
    );
    if (matchedProfile?.color) {
      hex = matchedProfile.color;
    }
  }

  // 3. Fallback defaults
  if (!hex) {
    if (norm === 'sophie') hex = '#ec4899';
    else if (norm === 'vincent') hex = '#0ea5e9';
    else hex = '#0ea5e9';
  }

  const option = getUserColorOption(hex);
  return {
    hex: option.value,
    bgClass: option.bgClass,
    ringClass: option.ringClass,
    lightBgClass: option.lightBgClass,
    borderClass: option.borderClass,
    textClass: option.textClass,
    badgeClass: option.badgeClass,
    activeButtonClass: `${option.lightBgClass} border-2 ${option.borderClass} ${option.textClass} shadow-xs`
  };
}

