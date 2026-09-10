
export enum User {
  Sophie = "Sophie",
  Vincent = "Vincent",
  Commun = "Commun",
}

export type UserName = User | string;

export interface FoyerMember {
  id: string;
  name: string;
  username: string;
  email?: string;
  color?: string;
  role?: 'admin' | 'member';
  joined_at?: string;
}

export interface Foyer {
  id: string;
  name: string;
  code: string;
  created_at: string;
  members: FoyerMember[];
}

// Les catégories sont maintenant dynamiques.
// Ceci est juste un type pour la cléarité, la vraie liste est gérée dans l'état de l'application.
export type Category = string;

// Liste initiale des catégories lors du premier chargement de l'application.
export const DEFAULT_CATEGORIES: Category[] = [
  "Dép. recurentes",
  "Carburant",
  "Chauffage",
  "Courses",
  "Restaurant",
  "Vacances",
  "Réparation voitures",
  "Vêtements",
  "Cadeau",
  "Complément alimentaire",
  "Divers",
];

export const PRODUCT_CATEGORIES = [
  "Fruits & Légumes",
  "Crémerie",
  "Charcuterie",
  "Épicerie",
  "Boissons",
  "Surgelés",
  "Hygiène",
  "Entretien",
  "Bricolage",
  "Loisirs",
  "Autre"
];

export interface SubtractedItem {
  description: string;
  amount: number;
  is_subtracted?: boolean;
  category?: string;
  target_category?: Category;
  create_expense?: boolean;
  expense_created?: boolean;
}

export interface Expense {
  id: string; // Correspond à l'UUID de Supabase
  description: string;
  amount: number;
  category: Category;
  date: string; // ISO 8601 format (TIMESTAMPTZ)
  user: User | string;
  created_at: string;
  user_agent?: string;
  foyer_id?: string;
  subtracted_items?: SubtractedItem[];
}

export interface Reminder {
  id: string;
  description: string;
  amount: number;
  category: Category;
  user: User | string;
  day_of_month: number;
  is_active: boolean;
  created_at: string;
  user_agent?: string;
  foyer_id?: string;
}

export interface MoneyPotTransaction {
  id: string;
  amount: number; // Positif pour ajout, Négatif pour retrait
  description: string;
  user_name: string; // Renamed from 'user' to avoid reserved keyword conflicts
  date: string;
  created_at: string;
  foyer_id?: string;
}

export interface CustomCategoryIcon {
  id: string;
  name: string;
  category: string;
  type: 'svg' | 'image';
  svgContent?: string;
  imageUrl?: string;
  color?: string;
  createdAt: string;
}

export type Activity = {
    id: string; // unique id for the activity
    type: 'add' | 'update' | 'delete';
    performedBy: User | string; // The logged-in user who did the action
    expense: Partial<Expense> & { id: string, user: User | string, date: string, foyer_id?: string };
    oldExpense?: Partial<Expense>; // Used to show diff on updates
    timestamp: string;
};

export type ContactSubject = 'bug' | 'suggestion' | 'question' | 'other';

export interface ContactReply {
  id: string;
  authorName: string;
  authorUsername: string;
  authorRole: 'admin' | 'user';
  message: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  userId: string; // username
  userName: string; // display name
  userEmail?: string;
  foyerId?: string;
  foyerName?: string;
  subject: ContactSubject;
  title: string;
  message: string;
  status: 'pending' | 'in_progress' | 'replied' | 'closed';
  createdAt: string;
  updatedAt: string;
  replies: ContactReply[];
  isReadByAdmin: boolean;
  isReadByUser: boolean;
  deviceInfo?: string;
}
