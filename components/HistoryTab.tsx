import React, { useMemo } from 'react';
import { type AuditLog } from '../types';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

const getRelativeDateLabel = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) => 
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    if (isSameDay(date, today)) return "Aujourd'hui";
    if (isSameDay(date, yesterday)) return 'Hier';

    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
};

const EventIcon: React.FC<{ action: AuditLog['action'] }> = ({ action }) => {
    const baseClasses = "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-800";
    
    switch (action) {
        case 'INSERT':
            return (
                <div className={`${baseClasses} bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400`}>
                    <PlusIcon />
                </div>
            );
        case 'UPDATE':
            return (
                <div className={`${baseClasses} bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400`}>
                    <EditIcon />
                </div>
            );
        case 'DELETE':
             return (
                <div className={`${baseClasses} bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400`}>
                    <TrashIcon />
                </div>
            );
        default:
            return null;
    }
};

const HistoryTab: React.FC<{ logs: AuditLog[] }> = ({ logs }) => {
    const groupedLogs = useMemo(() => {
        return logs.reduce((acc, log) => {
            const dateLabel = getRelativeDateLabel(log.created_at);
            if (!acc[dateLabel]) {
                acc[dateLabel] = [];
            }
            acc[dateLabel].push(log);
            return acc;
        }, {} as Record<string, AuditLog[]>);
    }, [logs]);

    if (logs.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-4xl mb-2">📜</p>
                <p className="text-slate-500 dark:text-slate-400">Aucun historique d'activité à afficher pour le moment.</p>
            </div>
        );
    }
    
    return (
        <div>
            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100">Historique des modifications</h2>
            <div className="space-y-8">
                {/* FIX: Cast the result of Object.entries to the correct type to prevent TypeScript from inferring 'unknown' for the array of logs. */}
                {(Object.entries(groupedLogs) as [string, AuditLog[]][]).map(([dateLabel, logsForDate]) => (
                    <div key={dateLabel}>
                        <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-4 capitalize">{dateLabel}</h3>
                        <ol className="relative border-l border-slate-200 dark:border-slate-700 ml-5">
                            {logsForDate.map(log => (
                                <li key={log.id} className="mb-6 ml-10">
                                    <span className="absolute -left-5">
                                        <EventIcon action={log.action} />
                                    </span>
                                    <div className="items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm sm:flex">
                                        <time className="mb-1 text-xs font-normal text-slate-400 sm:order-last sm:mb-0">
                                            {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </time>
                                        <div className="text-sm font-normal text-slate-600 dark:text-slate-300">{log.details}</div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryTab;