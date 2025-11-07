import React, { useState } from 'react';

const SQL_SCRIPT = `
-- 1. Création de la table pour stocker l'historique
CREATE TABLE public.history_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  event_type TEXT NOT NULL,
  details TEXT NOT NULL
);

-- 2. Activation de la Row Level Security (RLS) pour la sécurité
ALTER TABLE public.history_logs ENABLE ROW LEVEL SECURITY;

-- 3. Création d'une politique pour autoriser la lecture des logs par l'application
DROP POLICY IF EXISTS "Allow anon read access on history_logs" ON public.history_logs;
CREATE POLICY "Allow anon read access on history_logs"
ON public.history_logs
FOR SELECT TO anon
USING (true);

-- 4. Création de la fonction qui sera appelée par les triggers
CREATE OR REPLACE FUNCTION public.log_expense_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.history_logs (event_type, details)
    VALUES (
      'INSERT',
      CONCAT(
        NEW.user, 
        ' a ajouté : ', 
        NEW.description, 
        ' (', 
        to_char(NEW.amount, 'FM999999990.00'), 
        ' €)'
      )
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.history_logs (event_type, details)
    VALUES (
      'UPDATE',
      CONCAT(
        NEW.user, 
        ' a modifié la dépense "', 
        OLD.description, 
        '"'
      )
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.history_logs (event_type, details)
    VALUES (
      'DELETE',
      CONCAT(
        OLD.user, 
        ' a supprimé : ', 
        OLD.description, 
        ' (', 
        to_char(OLD.amount, 'FM999999990.00'), 
        ' €)'
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Création des triggers sur la table 'expenses'
DROP TRIGGER IF EXISTS on_expense_insert ON public.expenses;
CREATE TRIGGER on_expense_insert
AFTER INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.log_expense_change();

DROP TRIGGER IF EXISTS on_expense_update ON public.expenses;
CREATE TRIGGER on_expense_update
AFTER UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.log_expense_change();

DROP TRIGGER IF EXISTS on_expense_delete ON public.expenses;
CREATE TRIGGER on_expense_delete
AFTER DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.log_expense_change();
`.trim();

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);


const HistorySetupNotice: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(SQL_SCRIPT).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <div className="flex items-start gap-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Configuration de l'Historique Requise</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">
                        Pour activer la fonctionnalité d'historique, une mise à jour de votre base de données est nécessaire. Cela n'impactera pas vos données existantes.
                    </p>
                </div>
            </div>

            <div className="mt-6 space-y-4 text-sm">
                <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold">1</div>
                    <p className="text-slate-700 dark:text-slate-200">
                        Accédez à votre projet Supabase, puis allez dans la section <strong className="font-semibold">SQL Editor</strong>.
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold">2</div>
                    <p className="text-slate-700 dark:text-slate-200">
                        Cliquez sur <strong className="font-semibold">"+ New query"</strong> pour ouvrir une nouvelle feuille de requête.
                    </p>
                </div>
                <div className="flex gap-3">
                     <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold">3</div>
                    <p className="text-slate-700 dark:text-slate-200">
                        Copiez le script SQL ci-dessous, collez-le dans l'éditeur, puis cliquez sur <strong className="font-semibold">"RUN"</strong>.
                    </p>
                </div>
            </div>

            <div className="mt-4 relative">
                <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-2 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Copier le script"
                >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
                <pre className="bg-slate-900 text-slate-200 rounded-lg p-4 text-xs overflow-x-auto">
                    <code>
                        {SQL_SCRIPT}
                    </code>
                </pre>
            </div>
            
            <div className="mt-6 flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold">4</div>
                <p className="text-slate-700 dark:text-slate-200">
                    Une fois le script exécuté avec succès, revenez ici et <strong className="font-semibold">rafraîchissez l'application</strong>. L'historique sera activé.
                </p>
            </div>

        </div>
    );
};

export default HistorySetupNotice;
