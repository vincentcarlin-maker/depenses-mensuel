export enum User {
  Sophie = "Sophie",
  Vincent = "Vincent",
}

export enum Category {
  Mandatory = "Dépenses obligatoires",
  Fuel = "Carburant",
  Groceries = "Courses",
  Heating = "Chauffage",
  CarRepair = "Réparation voitures",
  Restaurant = "Restaurant",
  Misc = "Divers",
}

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

export interface HistoryLog {
  id: string;
  created_at: string;
  event_type: 'INSERT' | 'UPDATE' | 'DELETE';
  details: string;
}