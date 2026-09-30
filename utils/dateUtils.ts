/**
 * Module centralisé de gestion des dates pour DuoBudget.
 *
 * Règle d'or :
 * - Les dates de dépenses sont des dates calendaires saisies par l'utilisateur dans le fuseau français (Europe/Paris).
 * - L'affichage, les regroupements, les filtres mensuels et annuels doivent respecter ce calendrier sans décalage de jour ou de mois autour de minuit.
 * - Les données historiques et existantes restent compatibles (formats ISO, date seule YYYY-MM-DD ou datetime-local).
 */

const PARIS_TZ = 'Europe/Paris';

export interface CalendarDateParts {
  year: number;
  month: number; // 0-indexed (0 = janvier, 11 = décembre)
  day: number; // 1-31
  hour: number;
  minute: number;
  dateKey: string; // "YYYY-MM-DD"
  monthKey: string; // "YYYY-MM"
}

// Formateur optimisé pour l'extraction des composantes dans le fuseau horaire français
const parisPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PARIS_TZ,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hour12: false,
});

export const MONTH_NAMES_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

export const MONTH_NAMES_SHORT_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'
];

/**
 * Extrait les composantes calendaires exactes d'une date (année, mois 0-indexé, jour, heure, minute).
 * Priorise la date brute calendaire saisie par l'utilisateur si aucun fuseau n'est spécifié,
 * ou calcule l'heure locale française exacte si un horodatage avec fuseau horaire ou objet Date est fourni.
 */
export function getCalendarDateParts(input: string | Date | null | undefined): CalendarDateParts {
  if (!input) {
    const now = new Date();
    return getCalendarDateParts(now);
  }

  // 1. Chaîne pure date calendaire (ex: "2026-09-30" ou "2026-09-30T14:30" sans fuseau)
  if (typeof input === 'string') {
    const raw = input.trim();
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const hour = match[4] ? parseInt(match[4], 10) : 12;
      const minute = match[5] ? parseInt(match[5], 10) : 0;
      const dateKey = `${match[1]}-${match[2]}-${match[3]}`;
      const monthKey = `${match[1]}-${match[2]}`;
      return { year, month, day, hour, minute, dateKey, monthKey };
    }
  }

  // 2. Horodatage avec fuseau horaire (ex: "2026-09-30T22:01:00.000Z") ou objet Date
  const dateObj = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(dateObj.getTime())) {
    // Fallback date actuelle si date invalide
    const now = new Date();
    return getCalendarDateParts(now);
  }

  try {
    const parts = parisPartsFormatter.formatToParts(dateObj);
    const map: Record<string, string> = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }

    const year = parseInt(map.year, 10);
    const month = parseInt(map.month, 10) - 1;
    const day = parseInt(map.day, 10);
    const hour = parseInt(map.hour, 10) === 24 ? 0 : parseInt(map.hour, 10);
    const minute = parseInt(map.minute, 10);

    const yearStr = String(year).padStart(4, '0');
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');

    const dateKey = `${yearStr}-${monthStr}-${dayStr}`;
    const monthKey = `${yearStr}-${monthStr}`;

    return { year, month, day, hour, minute, dateKey, monthKey };
  } catch {
    // Fallback standard en cas d'environnement restreint
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    const hour = dateObj.getHours();
    const minute = dateObj.getMinutes();
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return {
      year,
      month,
      day,
      hour,
      minute,
      dateKey: `${year}-${monthStr}-${dayStr}`,
      monthKey: `${year}-${monthStr}`,
    };
  }
}

/**
 * Renvoie l'année de la dépense dans le calendrier français.
 */
export function getExpenseYear(dateInput: string | Date): number {
  return getCalendarDateParts(dateInput).year;
}

/**
 * Renvoie le mois de la dépense (0 à 11) dans le calendrier français.
 */
export function getExpenseMonth(dateInput: string | Date): number {
  return getCalendarDateParts(dateInput).month;
}

/**
 * Renvoie le jour du mois (1 à 31) dans le calendrier français.
 */
export function getExpenseDay(dateInput: string | Date): number {
  return getCalendarDateParts(dateInput).day;
}

/**
 * Renvoie la clé de mois "YYYY-MM" de la dépense.
 */
export function getExpenseMonthKey(dateInput: string | Date): string {
  return getCalendarDateParts(dateInput).monthKey;
}

/**
 * Renvoie la clé de date "YYYY-MM-DD" de la dépense.
 */
export function getExpenseCalendarKey(dateInput: string | Date): string {
  return getCalendarDateParts(dateInput).dateKey;
}

/**
 * Vérifie si une dépense appartient à l'année et au mois (0-indexé) spécifiés.
 */
export function isExpenseInMonth(dateInput: string | Date, targetYear: number, targetMonth: number): boolean {
  const parts = getCalendarDateParts(dateInput);
  return parts.year === targetYear && parts.month === targetMonth;
}

/**
 * Vérifie si une dépense appartient à une année spécifiée.
 */
export function isExpenseInYear(dateInput: string | Date, targetYear: number): boolean {
  return getCalendarDateParts(dateInput).year === targetYear;
}

/**
 * Vérifie si une dépense est strictement antérieure à un mois/année cible.
 */
export function isExpenseBeforeMonth(dateInput: string | Date, targetYear: number, targetMonth: number): boolean {
  const parts = getCalendarDateParts(dateInput);
  if (parts.year < targetYear) return true;
  if (parts.year > targetYear) return false;
  return parts.month < targetMonth;
}

/**
 * Compare deux dates pour le tri chronologique décroissant (plus récent d'abord).
 */
export function compareExpenseDatesDesc(dateA: string | Date, dateB: string | Date): number {
  const timeA = typeof dateA === 'string' ? new Date(dateA).getTime() : dateA.getTime();
  const timeB = typeof dateB === 'string' ? new Date(dateB).getTime() : dateB.getTime();
  return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
}

/**
 * Formate une date pour affichage en français.
 * Exemples : "15 mars 2026", "15 janv. 2026"
 */
export function formatDateFrench(dateInput: string | Date, options?: { shortMonth?: boolean; includeYear?: boolean }): string {
  const { year, month, day } = getCalendarDateParts(dateInput);
  const monthName = options?.shortMonth ? MONTH_NAMES_SHORT_FR[month] : MONTH_NAMES_FR[month];
  if (options?.includeYear === false) {
    return `${day} ${monthName}`;
  }
  return `${day} ${monthName} ${year}`;
}

/**
 * Formate une date pour un champ HTML <input type="date"> ("YYYY-MM-DD").
 */
export function formatDateForInput(dateInput?: string | Date): string {
  return getCalendarDateParts(dateInput).dateKey;
}

/**
 * Formate une date pour un champ HTML <input type="datetime-local"> ("YYYY-MM-DDTHH:mm").
 */
export function formatDateTimeLocalForInput(dateInput?: string | Date): string {
  const { dateKey, hour, minute } = getCalendarDateParts(dateInput);
  const hourStr = String(hour).padStart(2, '0');
  const minStr = String(minute).padStart(2, '0');
  return `${dateKey}T${hourStr}:${minStr}`;
}

/**
 * Convertit une date saisie dans un formulaire en date ISO stockable compatible Supabase.
 */
export function toStoredExpenseDate(dateInput: string | Date): string {
  if (dateInput instanceof Date) {
    return dateInput.toISOString();
  }
  const s = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    // Si seule la date sans heure est fournie, on la place à 12:00:00 UTC
    // ce qui se situe à 13h/14h à Paris et ne peut jamais déborder sur le jour suivant/précédent.
    return `${s}T12:00:00.000Z`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }
  return new Date().toISOString();
}
