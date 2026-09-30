export interface ActionRecord {
  id: string;
  expenseId: string;
  description: string;
  amount: number;
  type: 'delete' | 'update';
  status: 'pending' | 'executed' | 'cancelled';
  timerId?: any;
}

/**
 * File d'actions et gestionnaire de verrou pour sécuriser les suppressions rapides,
 * empêcher les doubles clics et garantir qu'une seule écriture en base est effectuée par dépense.
 */
export class DeletionQueue {
  private pendingExpenseIds = new Set<string>();
  private pendingActionIds = new Set<string>();
  private actions = new Map<string, ActionRecord>();
  private executedDbWrites: string[] = [];

  /**
   * Vérifie si une suppression peut être démarrée pour une dépense donnée.
   * Retourne faux si la dépense est déjà en cours de suppression (anti-double-clic).
   */
  canInitiateDelete(expenseId: string): boolean {
    return !this.pendingExpenseIds.has(expenseId);
  }

  /**
   * Enregistre une intention de suppression et verrouille l'identifiant.
   * Retourne faux si l'identifiant était déjà verrouillé.
   */
  enqueueDelete(actionId: string, expense: { id: string; description: string; amount: number }, timerId?: any): boolean {
    if (!this.canInitiateDelete(expense.id)) {
      return false;
    }
    this.pendingExpenseIds.add(expense.id);
    this.pendingActionIds.add(actionId);
    this.actions.set(actionId, {
      id: actionId,
      expenseId: expense.id,
      description: expense.description,
      amount: expense.amount,
      type: 'delete',
      status: 'pending',
      timerId,
    });
    return true;
  }

  /**
   * Exécute la suppression en base si et seulement si l'action n'a pas été annulée.
   * Retourne vrai si l'écriture a été autorisée, faux sinon.
   */
  executeDelete(actionId: string): boolean {
    if (!this.pendingActionIds.has(actionId)) {
      return false;
    }
    const action = this.actions.get(actionId);
    if (!action || action.status !== 'pending') {
      return false;
    }
    this.pendingActionIds.delete(actionId);
    this.pendingExpenseIds.delete(action.expenseId);
    action.status = 'executed';
    this.executedDbWrites.push(action.expenseId);
    return true;
  }

  /**
   * Annule une action de suppression spécifique par son actionId.
   * Libère le verrou de la dépense et marque l'action comme annulée.
   */
  cancel(actionId: string): ActionRecord | null {
    if (!this.pendingActionIds.has(actionId)) {
      return null;
    }
    const action = this.actions.get(actionId);
    if (!action || action.status !== 'pending') {
      return null;
    }
    this.pendingActionIds.delete(actionId);
    this.pendingExpenseIds.delete(action.expenseId);
    action.status = 'cancelled';
    return action;
  }

  isActionPending(actionId: string): boolean {
    return this.pendingActionIds.has(actionId);
  }

  isExpensePending(expenseId: string): boolean {
    return this.pendingExpenseIds.has(expenseId);
  }

  getPendingActions(): ActionRecord[] {
    return Array.from(this.actions.values()).filter(a => a.status === 'pending');
  }

  getExecutedDbWrites(): string[] {
    return [...this.executedDbWrites];
  }
}
