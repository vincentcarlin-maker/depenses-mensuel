
export enum User {
  Sophie = "Sophie",
  Vincent = "Vincent",
}

// Les catégories sont maintenant dynamiques.
// Ceci est juste un type pour la clarté, la vraie liste est gérée dans l'état de l'application.
export type Category = string;

// Liste initiale des catégories lors du premier chargement de l'application.
export const DEFAULT_CATEGORIES: Category[] = [
  "Dépenses obligatoires",
  "Carburant",
  "Chauffage",
  "Courses",
  "Restaurant",
  "Réparation voitures",
  "Vêtements",
  "Cadeau",
  "Divers",
];

export interface Expense {
  id: string; // Correspond à l'UUID de Supabase
  description: string;
  amount: number;
  category: Category;
  date: string; // ISO 8601 format (TIMESTAMPTZ)
  user: User;
  created_at: string;
}

export interface Reminder {
  id: string;
  description: string;
  amount: number;
  category: Category;
  user: User;
  day_of_month: number;
  is_active: boolean;
  created_at: string;
}

export interface MoneyPotTransaction {
  id: string;
  amount: number; // Positif pour ajout, Négatif pour retrait
  description: string;
  user: User;
  date: string;
  created_at: string;
}

export type Activity = {
    id: string; // unique id for the activity
    type: 'add' | 'update' | 'delete';
    expense: Partial<Expense> & { id: string, user: User, date: string };
    oldExpense?: Partial<Expense>; // Used to show diff on updates
    timestamp: string;
};