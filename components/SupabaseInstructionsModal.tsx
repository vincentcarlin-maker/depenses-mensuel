
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

  const sqlScript = `-- 1. Tables d'infrastructure, foyers et profils liés à Supabase Auth
CREATE TABLE IF NOT EXISTS public.foyers (
  id text PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  email text,
  color text DEFAULT '#0ea5e9',
  avatar_url text,
  is_superadmin boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.foyer_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  foyer_id text NOT NULL REFERENCES public.foyers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (foyer_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.legacy_account_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  foyer_id text NOT NULL REFERENCES public.foyers(id) ON DELETE CASCADE,
  registered_email text,
  initial_role text NOT NULL DEFAULT 'member' CHECK (initial_role IN ('admin', 'member')),
  activation_token text NOT NULL UNIQUE,
  claimed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'activated', 'revoked')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Sécurisation et non-nullabilité de foyer_id sur les tables métiers
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS foyer_id text DEFAULT 'foyer_vincent_sophie';
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS foyer_id text DEFAULT 'foyer_vincent_sophie';
ALTER TABLE public.money_pot ADD COLUMN IF NOT EXISTS foyer_id text DEFAULT 'foyer_vincent_sophie';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS foyer_id text DEFAULT 'foyer_vincent_sophie';

UPDATE public.expenses SET foyer_id = 'foyer_vincent_sophie' WHERE foyer_id IS NULL;
UPDATE public.reminders SET foyer_id = 'foyer_vincent_sophie' WHERE foyer_id IS NULL;
UPDATE public.money_pot SET foyer_id = 'foyer_vincent_sophie' WHERE foyer_id IS NULL;
UPDATE public.activities SET foyer_id = 'foyer_vincent_sophie' WHERE foyer_id IS NULL;

ALTER TABLE public.expenses ALTER COLUMN foyer_id SET NOT NULL;
ALTER TABLE public.reminders ALTER COLUMN foyer_id SET NOT NULL;
ALTER TABLE public.money_pot ALTER COLUMN foyer_id SET NOT NULL;
ALTER TABLE public.activities ALTER COLUMN foyer_id SET NOT NULL;

-- 3. Fonctions d'isolation de foyer et contrôle de rôle
CREATE OR REPLACE FUNCTION public.is_foyer_member(p_foyer_id text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.foyer_members
    WHERE foyer_id = p_foyer_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_foyer_admin(p_foyer_id text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.foyer_members
    WHERE foyer_id = p_foyer_id AND user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT is_superadmin FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Activation RLS et abrogation définitive des anciennes règles 'Allow all access'
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_pot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foyer_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.expenses;
DROP POLICY IF EXISTS "Allow all access" ON public.reminders;
DROP POLICY IF EXISTS "Allow all access" ON public.money_pot;
DROP POLICY IF EXISTS "Allow all access" ON public.activities;
DROP POLICY IF EXISTS "Allow all access" ON public.push_subscriptions;

CREATE POLICY "expenses_foyer_isolation" ON public.expenses
FOR ALL TO authenticated
USING (public.is_foyer_member(foyer_id) OR public.is_superadmin())
WITH CHECK (public.is_foyer_member(foyer_id));

CREATE POLICY "reminders_foyer_isolation" ON public.reminders
FOR ALL TO authenticated
USING (public.is_foyer_member(foyer_id) OR public.is_superadmin())
WITH CHECK (public.is_foyer_member(foyer_id));

CREATE POLICY "money_pot_foyer_isolation" ON public.money_pot
FOR ALL TO authenticated
USING (public.is_foyer_member(foyer_id) OR public.is_superadmin())
WITH CHECK (public.is_foyer_member(foyer_id));

CREATE POLICY "activities_foyer_isolation" ON public.activities
FOR ALL TO authenticated
USING (public.is_foyer_member(foyer_id) OR public.is_superadmin())
WITH CHECK (public.is_foyer_member(foyer_id));

CREATE POLICY "foyers_member_access" ON public.foyers
FOR SELECT TO authenticated
USING (public.is_foyer_member(id) OR public.is_superadmin());

CREATE POLICY "push_subs_authenticated" ON public.push_subscriptions
FOR ALL TO authenticated
USING (true) WITH CHECK (true);`;

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
