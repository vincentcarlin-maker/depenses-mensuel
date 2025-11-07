import React from 'react';

const ConfigurationError = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-slate-900 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-red-200 dark:border-red-900 animate-fade-in">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Action requise : Configuration de Supabase</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          L'application ne peut pas se connecter à la base de données car les informations de votre projet Supabase ne sont pas configurées. Veuillez suivre les étapes ci-dessous.
        </p>
        
        <div className="space-y-4 text-sm">
          <p>
            Ouvrez le fichier <code className="bg-slate-200 dark:bg-slate-700 text-sm font-mono p-1 rounded">supabase/client.ts</code> dans votre éditeur de code.
          </p>
          <p>
            Vous devez y remplacer les valeurs d'exemple par vos propres informations d'identification Supabase :
          </p>
          <pre className="bg-slate-100 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 rounded-lg p-4 text-xs sm:text-sm overflow-x-auto">
            <code>
              {`// Remplacez ces deux lignes dans supabase/client.ts

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';`}
            </code>
          </pre>
          <p>
            Vous trouverez ces informations dans votre tableau de bord Supabase, sous <strong className="text-slate-700 dark:text-slate-200">Project Settings → API</strong>.
          </p>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-8">
          Une fois le fichier mis à jour et sauvegardé, l'application devrait se recharger et fonctionner.
        </p>
      </div>
    </div>
  );
};

export default ConfigurationError;