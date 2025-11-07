import React, { useEffect, type ReactNode } from 'react';
import CloseIcon from './icons/CloseIcon';

interface VapidKeyInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CodeBlock = ({ children }: { children: ReactNode }) => (
  <pre className="bg-slate-800 text-slate-100 rounded-lg p-3 text-sm overflow-x-auto">
    <code>{children}</code>
  </pre>
);

const VapidKeyInstructionsModal = ({ isOpen, onClose }: VapidKeyInstructionsModalProps) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div className="bg-white p-6 rounded-2xl shadow-xl z-50 w-full max-w-2xl m-4 animate-slide-in-right max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Configuration des Notifications Requise</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Fermer"
            >
              <CloseIcon />
            </button>
        </div>
        
        <div className="space-y-6 text-slate-600">
            <p>
                Pour que les notifications push fonctionnent, vous devez générer et configurer vos propres clés de sécurité (clés VAPID). 
                La clé actuelle est un exemple et ne peut pas être utilisée.
            </p>

            <div>
                <h3 className="font-bold text-lg text-slate-700 mb-2">Étape 1 : Générer les clés</h3>
                <p className="mb-2">
                    Ouvrez votre terminal et exécutez la commande suivante. Cela créera une clé publique et une clé privée uniques.
                </p>
                <CodeBlock>npx web-push generate-vapid-keys</CodeBlock>
            </div>

            <div>
                <h3 className="font-bold text-lg text-slate-700 mb-2">Étape 2 : Configurer la clé publique (Frontend)</h3>
                <p className="mb-2">
                    Ouvrez le fichier <code className="bg-slate-200 text-sm p-1 rounded">config.ts</code> dans votre projet. Copiez la <strong className="text-slate-800">Clé Publique</strong> générée à l'étape 1 et collez-la pour remplacer la clé d'exemple dans la variable <code className="bg-slate-200 text-sm p-1 rounded">VAPID_PUBLIC_KEY</code>.
                </p>
                <CodeBlock>{`// Dans config.ts
export const VAPID_PUBLIC_KEY = "COPIEZ_VOTRE_CLÉ_PUBLIQUE_ICI";`}</CodeBlock>
            </div>

            <div>
                <h3 className="font-bold text-lg text-slate-700 mb-2">Étape 3 : Configurer les clés dans Supabase (Backend)</h3>
                <p className="mb-2">
                    Allez dans votre projet Supabase, puis dans <strong className="text-slate-800">Settings → Edge Functions</strong>.
                    Ajoutez les "secrets" (variables d'environnement) suivants :
                </p>
                <ul className="list-disc list-inside space-y-2 bg-slate-100 p-4 rounded-lg">
                    <li>
                        {/* FIX: Replaced <br/> with <div> wrappers to prevent a strange JSX parsing error. This improves semantic structure and resolves the build failure. */}
                        <div><strong>Nom du secret :</strong> <code className="bg-slate-200 text-sm p-1 rounded">VAPID_PUBLIC_KEY</code></div>
                        <div><strong>Valeur :</strong> Votre <strong className="text-slate-800">Clé Publique</strong> (la même que dans <code className="bg-slate-200 text-sm p-1 rounded">config.ts</code>).</div>
                    </li>
                    <li>
                        {/* FIX: Replaced <br/> with <div> wrappers to prevent a strange JSX parsing error. This improves semantic structure and resolves the build failure. */}
                        <div><strong>Nom du secret :</strong> <code className="bg-slate-200 text-sm p-1 rounded">VAPID_PRIVATE_KEY</code></div>
                        <div><strong>Valeur :</strong> Votre <strong className="text-slate-800">Clé Privée</strong> générée à l'étape 1.</div>
                    </li>
                </ul>
                 <p className="mt-2 text-sm">
                    (Assurez-vous que les autres secrets comme <code className="bg-slate-200 text-sm p-1 rounded">FUNCTION_SECRET</code>, <code className="bg-slate-200 text-sm p-1 rounded">SUPABASE_URL</code>, etc. sont également configurés comme indiqué dans les commentaires de la Edge Function.)
                </p>
            </div>
            
            <p className="pt-4 border-t border-slate-200">
                Après avoir suivi ces étapes, rechargez l'application. Vous devriez pouvoir activer les notifications.
            </p>
        </div>
        
        <div className="flex justify-end mt-6">
            <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
                J'ai compris
            </button>
        </div>
      </div>
    </div>
  );
};

export default VapidKeyInstructionsModal;