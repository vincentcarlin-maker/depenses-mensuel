
export enum User {
  Sophie = "Sophie",
  Vincent = "Vincent",
  Commun = "Commun",
}

export type Category = string;

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

export interface Deduction {
  id: string;
  name: string;
  price: number;
  user: User.Sophie | User.Vincent;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: Category;
  date: string;
  user: User;
  created_at: string;
  metadata?: string; // JSON stringified object: { totalTicket: number, deductions: Deduction[] }
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
  amount: number;
  description: string;
  user_name: string;
  date: string;
  created_at: string;
}

export type Activity = {
    id: string;
    type: 'add' | 'update' | 'delete';
    expense: Partial<Expense> & { id: string, user: User, date: string };
    oldExpense?: Partial<Expense>;
    timestamp: string;
};
