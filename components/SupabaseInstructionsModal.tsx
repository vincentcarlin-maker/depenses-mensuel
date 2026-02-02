
import React, { useEffect } from 'react';
import CloseIcon from './icons/CloseIcon';
import WarningIcon from './icons/WarningIcon';

interface SupabaseInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <pre className="bg-slate-800 text-slate-100 rounded-lg p-3 text-sm overflow-x-auto my-2">
    <code>{children}</code>
  </pre>
);

const SupabaseInstructionsModal: React.FC<SupabaseInstructionsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    document.body.style.overflow = 'hidden';
    const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => { document.body.style.overflow = 'auto'; window.removeEventListener('keydown', handleEsc); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sqlScript = `-- 1. Créer la table pour l'historique des connexions
CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid default gen_random_uuid() primary key,
  user_name text not null,
  timestamp timestamptz default now()
);

-- 2. Créer la table pour la cagnotte (argent commun)
CREATE TABLE IF NOT EXISTS public.money_pot (
  id uuid default gen_random_uuid() primary key,
  amount float not null,
  description text not null,
  user_name text not null,
  date timestamptz default now(),
  created_at timestamptz default now()
);

-- 3. MIGRATION : Si la table 'money_pot' existe déjà avec la colonne 'user', on la renomme
DO $migration_user_to_username$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='money_pot' AND column_name='user') THEN
    ALTER TABLE public.money_pot RENAME COLUMN "user" TO user_name;
  END IF;
END $migration_user_to_username$;

-- 4. AJOUT : Ajoute la colonne pour les articles déduits des courses
DO $migration_add_subtracted_items$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='subtracted_items') THEN
    ALTER TABLE public.expenses ADD COLUMN subtracted_items jsonb;
  END IF;
END $migration_add_subtracted_items$;

-- 5. NOUVEAU : Créer la table pour l'historique des modifications (activités)
-- On inclut explicitement 'performedBy' pour tracer qui a fait l'action.
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid default gen_random_uuid() primary key,
  type text not null,
  expense jsonb not null,
  "oldExpense" jsonb,
  "performedBy" text, -- Nouveau champ pour l'auteur (Sophie ou Vincent)
  "timestamp" timestamptz default now() not null
);

-- MIGRATION : Ajouter performedBy si la table existe déjà sans lui
DO $migration_add_performed_by$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='performedBy') THEN
    ALTER TABLE public.activities ADD COLUMN "performedBy" text;
  END IF;
END $migration_add_performed_by$;

-- 6. Activer la sécurité (RLS)
alter table public.expenses enable row level security;
alter table public.reminders enable row level security;
alter table public.login_logs enable row level security;
alter table public.money_pot enable row level security;
alter table public.activities enable row level security;

-- 7. Créer les règles d'accès public (Anonyme)
DROP POLICY IF EXISTS "Allow all access" ON public.expenses;
DROP POLICY IF EXISTS "Allow all access" ON public.reminders;
DROP POLICY IF EXISTS "Allow all access" ON public.login_logs;
DROP POLICY IF EXISTS "Allow all access" ON public.money_pot;
DROP POLICY IF EXISTS "Allow all access" ON public.activities;

CREATE POLICY "Allow all access" ON public.expenses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.reminders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.login_logs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.money_pot FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.activities FOR ALL TO anon USING (true) WITH CHECK (true);`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="fixed inset-0" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl z-50 w-full max-w-2xl m-4 animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-start mb-4">
            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-cyan-100 dark:bg-cyan-800/20"><div className="text-cyan-600 dark:text-cyan-400"><WarningIcon /></div></div>
            <div className="ml-4 flex-1"><h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Action Requise : Base de Données</h2><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Copiez et exécutez ce script dans l'éditeur SQL de Supabase pour activer le traçage précis des modifications.</p></div>
            <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"><CloseIcon /></button>
        </div>
        <div className="space-y-4 text-slate-600 dark:text-slate-300">
            <CodeBlock>{sqlScript}</CodeBlock>
            <p className="text-xs bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30 text-amber-800 dark:text-amber-200 font-medium">
                Note : Si la table existait déjà, le script ajoutera la colonne "performedBy" automatiquement.
            </p>
        </div>
        <div className="flex justify-end mt-6"><button onClick={onClose} className="px-6 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700">C'est fait</button></div>
      </div>
    </div>
  );
};

export default SupabaseInstructionsModal;
