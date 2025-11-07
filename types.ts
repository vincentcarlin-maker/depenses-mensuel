export enum User {
  Sophie = "Sophie",
  Vincent = "Vincent",
}

export enum Category {
  Mandatory = "Dépenses obligatoires",
  Fuel = "Gasoil",
  Groceries = "Courses",
  Heating = "Chauffage",
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
  user_agent?: string;
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
  user_agent?: string;
}

export interface AuditLog {
    id: string;
    created_at: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    entity: 'expenses' | 'reminders';
    description: string;
    user_agent: string;
}