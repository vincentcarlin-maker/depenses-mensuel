import { User } from '../types';

/**
 * Calcule l'impact sur la cagnotte commune lors de l'ajout d'une dépense.
 * Règle : Une dépense signée de X € pour l'utilisateur 'Commun' impacte la cagnotte de -X €.
 * - Dépense de +100 € -> -100 € dans la cagnotte
 * - Rentrée ou remboursement de -20 € -> +20 € dans la cagnotte
 * - Dépense de Sophie ou Vincent -> aucun impact (null)
 */
export function getMoneyPotImpactForAdd(expense: { user: User | string; amount: number }): number | null {
  if (expense.user !== User.Commun) {
    return null;
  }
  return -expense.amount;
}

/**
 * Calcule l'impact sur la cagnotte commune lors de la suppression d'une dépense.
 * Règle : Annule exactement l'effet initial de la dépense sur la cagnotte.
 * - Dépense de +100 € supprimée -> +100 € dans la cagnotte
 * - Rentrée ou remboursement de -20 € supprimé -> -20 € dans la cagnotte
 * - Dépense de Sophie ou Vincent -> aucun impact (null)
 */
export function getMoneyPotImpactForDelete(expense: { user: User | string; amount: number }): number | null {
  if (expense.user !== User.Commun) {
    return null;
  }
  return expense.amount;
}

/**
 * Calcule l'impact sur la cagnotte commune lors de la modification d'une dépense.
 * Règle : Applique uniquement la différence signée.
 * - Commun vers Commun : oldAmount - newAmount
 *   Ex : 100 € vers 150 € -> -50 €
 *   Ex : 100 € vers 80 €  -> +20 €
 *   Ex : -20 € vers -30 € -> +10 €
 * - Non-Commun vers Commun : -newAmount
 * - Commun vers Non-Commun : +oldAmount
 * - Non-Commun vers Non-Commun : aucun impact (null)
 */
export function getMoneyPotImpactForUpdate(
  oldExpense: { user: User | string; amount: number },
  newExpense: { user: User | string; amount: number }
): number | null {
  const wasCommun = oldExpense.user === User.Commun;
  const isCommun = newExpense.user === User.Commun;

  if (!wasCommun && isCommun) {
    return -newExpense.amount;
  }
  if (wasCommun && !isCommun) {
    return oldExpense.amount;
  }
  if (wasCommun && isCommun) {
    const diff = oldExpense.amount - newExpense.amount;
    return Math.abs(diff) > 0.001 ? diff : null;
  }
  return null;
}

/**
 * Calcule l'impact sur la cagnotte lors de l'annulation d'une suppression.
 * Règle : Rétablit l'effet initial de la dépense sur la cagnotte.
 * - Dépense de +100 € restaurée -> -100 €
 * - Rentrée de -20 € restaurée -> +20 €
 */
export function getMoneyPotImpactForUndoDelete(expense: { user: User | string; amount: number }): number | null {
  return getMoneyPotImpactForAdd(expense);
}

/**
 * Calcule l'impact sur la cagnotte lors de l'annulation d'une modification.
 * Règle : Annule exactement l'opération créée par cette modification en inversant l'ancien et le nouvel état.
 */
export function getMoneyPotImpactForUndoUpdate(
  originalExpense: { user: User | string; amount: number },
  updatedExpense: { user: User | string; amount: number }
): number | null {
  return getMoneyPotImpactForUpdate(updatedExpense, originalExpense);
}
