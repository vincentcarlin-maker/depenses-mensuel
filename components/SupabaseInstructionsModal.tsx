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

  const sqlScript = `-- Étape A : Activer la sécurité au niveau des lignes (RLS)
alter table public.expenses enable row level security;
alter table public.reminders enable row level security;

-- Étape B : Supprimer les anciennes règles pour éviter les conflits
DROP POLICY IF EXISTS "Allow anonymous read access to expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow anonymous read access to reminders" ON public.reminders;
DROP POLICY IF EXISTS "Allow all access for anonymous users on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow all access for anonymous users on reminders" ON public.reminders;

-- Étape C : Créer la nouvelle règle qui autorise l'accès
CREATE POLICY "Allow all access for anonymous users on expenses"
ON public.expenses FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access for anonymous users on reminders"
ON public.reminders FOR ALL TO anon USING (true) WITH CHECK (true);`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl z-50 w-full max-w-2xl m-4 animate-slide-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-start mb-4">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-800/20 sm:mx-0 sm:h-10 sm:w-10">
                <div className="text-red-600 dark:text-red-400">
                    <WarningIcon />
                </div>
            </div>
            <div className="ml-4 flex-1">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Action requise : Corriger la configuration Supabase</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    La connexion en temps-réel a échoué. Ceci est dû à une configuration manquante dans votre projet Supabase. Veuillez suivre les étapes ci-dessous.
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
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-2">Étape 1 : Activer la diffusion des données (Publications)</h3>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Dans votre projet Supabase, allez dans <strong>Database → Publications</strong>.</li>
                    <li>Cliquez sur la ligne <strong>supabase_realtime</strong>.</li>
                    <li>Dans la section "Tables", cliquez sur le lien (ex: "0 tables").</li>
                    <li>Cochez les cases pour <strong>expenses</strong> et <strong>reminders</strong>, puis cliquez sur <strong>Save</strong>.</li>
                    <li>Vérifiez que le lien affiche bien "2 tables".</li>
                </ol>
            </div>

            <div>
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-2">Étape 2 : Autoriser la lecture des données (Policies RLS)</h3>
                 <ol className="list-decimal list-inside space-y-1 mb-2">
                    <li>Allez dans le <strong>SQL Editor</strong>.</li>
                    <li>Cliquez sur <strong>+ New query</strong>.</li>
                    <li>Copiez-collez l'intégralité du script ci-dessous, puis cliquez sur <strong>RUN</strong>.</li>
                </ol>
                <CodeBlock>{sqlScript}</CodeBlock>
                <p className="text-sm text-slate-500 dark:text-slate-400">Après avoir exécuté le script, vérifiez dans <strong>Authentication → Policies</strong> que les politiques sont bien créées pour les tables `expenses` et `reminders`.</p>
            </div>
            
            <p className="pt-4 border-t border-slate-200 dark:border-slate-700">
                Après avoir suivi ces deux étapes, rechargez l'application. La connexion en temps-réel devrait fonctionner.
            </p>
        </div>
        
        <div className="flex justify-end mt-6">
            <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-800"
            >
                J'ai compris
            </button>
        </div>
      </div>
    </div>
  );
};

export default SupabaseInstructionsModal;