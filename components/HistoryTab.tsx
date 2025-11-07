import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { type AuditLog } from '../types';
import PlusCircleIcon from './icons/PlusCircleIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';

const ActionIcon = ({ action }: { action: AuditLog['action'] }) => {
    switch (action) {
        case 'CREATE':
            return <div className="text-green-500"><PlusCircleIcon /></div>;
        case 'UPDATE':
            return <div className="text-yellow-500"><PencilIcon /></div>;
        case 'DELETE':
            return <div className="text-red-500"><TrashIcon /></div>;
        default:
            return null;
    }
};

const HistoryTab = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            const { data, error } = await supabase!
                .from('audit_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                console.error("Erreur lors de la récupération de l'historique:", error);
                setError("Impossible de charger l'historique. Assurez-vous que la table 'audit_log' et les triggers sont correctement configurés dans Supabase.");
            } else {
                setLogs(data as AuditLog[]);
            }
            setIsLoading(false);
        };

        fetchLogs();
    }, []);

    if (isLoading) {
        return <div className="text-center text-slate-500 dark:text-slate-400">Chargement de l'historique...</div>;
    }
    
    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg">
                <p className="font-bold">Erreur de configuration</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    if (logs.length === 0) {
        return <p className="text-center text-slate-500 dark:text-slate-400">Aucune activité enregistrée pour le moment.</p>;
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Historique des modifications</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {logs.map(log => (
                    <div key={log.id} className="flex items-start space-x-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex-shrink-0 pt-1">
                            <ActionIcon action={log.action} />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-slate-700 dark:text-slate-200">{log.description}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(log.created_at).toLocaleString('fr-FR', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                })}
                                 {' '}- via {log.user_agent || 'un appareil inconnu'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryTab;