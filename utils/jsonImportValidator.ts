import { Expense, Reminder, MoneyPotTransaction } from '../types';
import { DEFAULT_FOYER_ID } from './foyerService';

export interface ValidatedImportPayload {
  validExpenses: Expense[];
  validReminders: Reminder[];
  validMoneyPot: MoneyPotTransaction[];
  ignoredExpensesCount: number;
  ignoredRemindersCount: number;
  ignoredMoneyPotCount: number;
  totalIgnoredCount: number;
}

/**
 * Nettoie et valide un identifiant existant.
 * Renvoie l'ID s'il est valide et non vide, ou génère un UUID.
 */
function sanitizeOrGenerateId(rawId: any): string {
  if (typeof rawId === 'string' && rawId.trim().length >= 3) {
    return rawId.trim();
  }
  return crypto.randomUUID();
}

/**
 * Valide et extrait un montant numérique.
 * Gère les nombres et les chaînes avec virgule ou point.
 */
function parseNumericAmount(rawAmount: any): number | null {
  if (typeof rawAmount === 'number' && !isNaN(rawAmount) && isFinite(rawAmount)) {
    return rawAmount;
  }
  if (typeof rawAmount === 'string') {
    const cleaned = rawAmount.trim().replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

/**
 * Valide une date et renvoie une chaîne ISO valide.
 */
function parseValidDate(rawDate: any): string | null {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Parse et valide les données JSON brutes pour l'import DuoBudget.
 * Filtre les données invalides, assigne le foyer_id cible, et élimine tout champ sensible (passwords, etc.).
 */
export function parseAndValidateImportPayload(rawInput: any, targetFoyerId: string = DEFAULT_FOYER_ID): ValidatedImportPayload {
  let rawExpenses: any[] = [];
  let rawReminders: any[] = [];
  let rawMoneyPot: any[] = [];

  if (Array.isArray(rawInput)) {
    // Cas 1 : tableau direct de dépenses
    rawExpenses = rawInput;
  } else if (rawInput && typeof rawInput === 'object') {
    // Cas 2 & 3 : objet avec data ou propriétés directes
    const container = rawInput.data && typeof rawInput.data === 'object' ? rawInput.data : rawInput;
    if (Array.isArray(container.expenses)) rawExpenses = container.expenses;
    if (Array.isArray(container.reminders)) rawReminders = container.reminders;
    if (Array.isArray(container.moneyPotTransactions)) rawMoneyPot = container.moneyPotTransactions;
    else if (Array.isArray(container.money_pot)) rawMoneyPot = container.money_pot;
    else if (Array.isArray(container.money_pot_transactions)) rawMoneyPot = container.money_pot_transactions;
  }

  // 1. Validation des Dépenses
  const validExpenses: Expense[] = [];
  let ignoredExpensesCount = 0;

  for (const raw of rawExpenses) {
    if (!raw || typeof raw !== 'object') {
      ignoredExpensesCount++;
      continue;
    }

    const amount = parseNumericAmount(raw.amount);
    const date = parseValidDate(raw.date);
    const userStr = typeof raw.user === 'string' ? raw.user.trim() : '';
    const descStr = typeof raw.description === 'string' ? raw.description.trim() : '';

    if (amount === null || !date || !userStr || !descStr) {
      ignoredExpensesCount++;
      continue;
    }

    // Assainissement : exclusion de tout champ password / sensible
    const category = typeof raw.category === 'string' && raw.category.trim() ? raw.category.trim() : 'Divers';
    const createdAt = parseValidDate(raw.created_at) || date;

    validExpenses.push({
      id: sanitizeOrGenerateId(raw.id),
      description: descStr,
      amount,
      date,
      user: userStr,
      category,
      foyer_id: targetFoyerId,
      created_at: createdAt,
      subtracted_items: Array.isArray(raw.subtracted_items) ? raw.subtracted_items : undefined,
    });
  }

  // 2. Validation des Rappels
  const validReminders: Reminder[] = [];
  let ignoredRemindersCount = 0;

  for (const raw of rawReminders) {
    if (!raw || typeof raw !== 'object') {
      ignoredRemindersCount++;
      continue;
    }

    const amount = parseNumericAmount(raw.amount);
    const day = typeof raw.day_of_month === 'number' ? raw.day_of_month : parseInt(String(raw.day_of_month), 10);
    const userStr = typeof raw.user === 'string' ? raw.user.trim() : '';
    const descStr = typeof raw.description === 'string' ? raw.description.trim() : '';

    if (amount === null || isNaN(day) || day < 1 || day > 31 || !userStr || !descStr) {
      ignoredRemindersCount++;
      continue;
    }

    const category = typeof raw.category === 'string' && raw.category.trim() ? raw.category.trim() : 'Divers';
    const createdAt = parseValidDate(raw.created_at) || new Date().toISOString();

    validReminders.push({
      id: sanitizeOrGenerateId(raw.id),
      description: descStr,
      amount,
      day_of_month: day,
      user: userStr,
      category,
      is_active: raw.is_active !== false,
      foyer_id: targetFoyerId,
      created_at: createdAt,
    });
  }

  // 3. Validation des Transactions de Cagnotte
  const validMoneyPot: MoneyPotTransaction[] = [];
  let ignoredMoneyPotCount = 0;

  for (const raw of rawMoneyPot) {
    if (!raw || typeof raw !== 'object') {
      ignoredMoneyPotCount++;
      continue;
    }

    const amount = parseNumericAmount(raw.amount);
    const date = parseValidDate(raw.date);
    const userNameStr = typeof raw.user_name === 'string' && raw.user_name.trim() 
      ? raw.user_name.trim() 
      : (typeof raw.user === 'string' ? raw.user.trim() : '');
    const descStr = typeof raw.description === 'string' ? raw.description.trim() : '';

    if (amount === null || !date || !userNameStr || !descStr) {
      ignoredMoneyPotCount++;
      continue;
    }

    const createdAt = parseValidDate(raw.created_at) || date;

    validMoneyPot.push({
      id: sanitizeOrGenerateId(raw.id),
      description: descStr,
      amount,
      date,
      user_name: userNameStr,
      foyer_id: targetFoyerId,
      created_at: createdAt,
    });
  }

  return {
    validExpenses,
    validReminders,
    validMoneyPot,
    ignoredExpensesCount,
    ignoredRemindersCount,
    ignoredMoneyPotCount,
    totalIgnoredCount: ignoredExpensesCount + ignoredRemindersCount + ignoredMoneyPotCount,
  };
}
