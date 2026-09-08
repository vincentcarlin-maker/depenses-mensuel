export interface UserColorOption {
  label: string;
  value: string;
  bgClass: string;
  ringClass: string;
}

export const USER_COLORS: UserColorOption[] = [
  { label: 'Bleu ciel', value: '#0ea5e9', bgClass: 'bg-sky-500', ringClass: 'ring-sky-500' },
  { label: 'Rose poudré', value: '#ec4899', bgClass: 'bg-pink-500', ringClass: 'ring-pink-500' },
  { label: 'Émeraude', value: '#10b981', bgClass: 'bg-emerald-500', ringClass: 'ring-emerald-500' },
  { label: 'Violet', value: '#8b5cf6', bgClass: 'bg-purple-500', ringClass: 'ring-purple-500' },
  { label: 'Ambre / Orange', value: '#f97316', bgClass: 'bg-orange-500', ringClass: 'ring-orange-500' },
  { label: 'Indigo', value: '#6366f1', bgClass: 'bg-indigo-500', ringClass: 'ring-indigo-500' },
  { label: 'Corail', value: '#f43f5e', bgClass: 'bg-rose-500', ringClass: 'ring-rose-500' },
  { label: 'Turquoise', value: '#06b6d4', bgClass: 'bg-cyan-500', ringClass: 'ring-cyan-500' },
  { label: 'Citron vert', value: '#84cc16', bgClass: 'bg-lime-500', ringClass: 'ring-lime-500' },
  { label: 'Fuchsia', value: '#d946ef', bgClass: 'bg-fuchsia-500', ringClass: 'ring-fuchsia-500' },
  { label: 'Jaune doré', value: '#eab308', bgClass: 'bg-yellow-500', ringClass: 'ring-yellow-500' },
  { label: 'Ardoise', value: '#64748b', bgClass: 'bg-slate-500', ringClass: 'ring-slate-500' },
];

export function getUserColorOption(hexColor?: string): UserColorOption {
  if (!hexColor) return USER_COLORS[0];
  const found = USER_COLORS.find(c => c.value.toLowerCase() === hexColor.toLowerCase());
  if (found) return found;
  return {
    label: 'Personnalisée',
    value: hexColor,
    bgClass: 'bg-sky-500',
    ringClass: 'ring-sky-500'
  };
}
