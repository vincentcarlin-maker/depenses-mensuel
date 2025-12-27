
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
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
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
  user_name text not null, -- Renommé de 'user' à 'user_name' pour éviter les conflits
  date timestamptz default now(),
  created_at timestamptz default now()
);

-- 2b. MIGRATION : Si la table existe déjà avec la colonne 'user' (ancien format), on la renomme
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='money_pot' AND column_name='user') THEN
    ALTER TABLE public.money_pot RENAME COLUMN "user" TO user_name;
  END IF;
END $$;

-- 2c. AJOUT : Ajoute la colonne pour les articles déduits des courses
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='subtracted_items') THEN
    ALTER TABLE public.expenses ADD COLUMN subtracted_items jsonb;
  END IF;
END $$;


-- 3. Activer la sécurité au niveau des lignes (RLS)
alter table public.expenses enable row level security;
alter table public.reminders enable row level security;
alter table public.login_logs enable row level security;
alter table public.money_pot enable row level security;

-- 4. Supprimer les anciennes règles pour éviter les conflits
DROP POLICY IF EXISTS "Allow all access" ON public.expenses;
DROP POLICY IF EXISTS "Allow all access" ON public.reminders;
DROP POLICY IF EXISTS "Allow all access" ON public.login_logs;
DROP POLICY IF EXISTS "Allow all access" ON public.money_pot;
DROP POLICY IF EXISTS "Allow all access for anonymous users on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow all access for anonymous users on reminders" ON public.reminders;

-- 5. Créer les nouvelles règles qui autorisent l'accès
CREATE POLICY "Allow all access" ON public.expenses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.reminders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.login_logs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.money_pot FOR ALL TO anon USING (true) WITH CHECK (true);`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl z-50 w-full max-w-2xl m-4 animate-slide-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-start mb-4">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-cyan-100 dark:bg-cyan-800/20 sm:mx-0 sm:h-10 sm:w-10">
                <div className="text-cyan-600 dark:text-cyan-400">
                    <WarningIcon />
                </div>
            </div>
            <div className="ml-4 flex-1">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Configuration de la Base de Données</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Exécutez ce script dans Supabase pour créer la table "Cagnotte" et corriger les erreurs d'ajout.
                </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Fermer"
            >
              <CloseIcon />
            </button>
        </div>
        
        <div className="space-y-6 text-slate-600 dark:text-slate-300">
            <div>
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-2">Étape 1 : Activer la diffusion (Realtime)</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Dans Supabase, allez dans <strong>Database → Publications</strong>.</li>
                    <li>Cliquez sur <strong>supabase_realtime</strong>.</li>
                    <li>Assurez-vous que les tables <strong>login_logs</strong> et <strong>money_pot</strong> sont cochées.</li>
                    <li>Cliquez sur <strong>Save</strong>.</li>
                </ol>
            </div>

            <div>
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-2">Étape 2 : Créer ou Mettre à jour les tables</h3>
                 <ol className="list-decimal list-inside space-y-1 mb-2 text-sm">
                    <li>Allez dans le <strong>SQL Editor</strong>.</li>
                    <li>Cliquez sur <strong>+ New query</strong>.</li>
                    <li>Copiez-collez le script ci-dessous et cliquez sur <strong>RUN</strong>.</li>
                </ol>
                <CodeBlock>{sqlScript}</CodeBlock>
            </div>
        </div>
        
        <div className="flex justify-end mt-6">
            <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-800"
            >
                Terminé
            </button>
        </div>
      </div>
    </div>
  );
};

export default SupabaseInstructionsModal;