import React, { useState, useMemo } from 'react';
import { ContactMessage, ContactSubject } from '../types';
import { getContactSubjectBadge } from '../utils/contactService';

interface AdminContactMessagesSectionProps {
  messages: ContactMessage[];
  onSendReply: (messageId: string, replyText: string, asAdmin?: boolean) => Promise<{ success: boolean; error?: string }>;
  onUpdateStatus: (messageId: string, status: ContactMessage['status']) => Promise<boolean>;
  onDeleteMessage: (messageId: string) => Promise<boolean>;
  onMarkAsRead: (messageId: string, forAdmin?: boolean) => Promise<void>;
  onRefresh: () => Promise<void>;
  onBack?: () => void;
}

const QUICK_TEMPLATES = [
  {
    label: '✅ Bug corrigé',
    text: 'Bonjour ! Merci beaucoup pour votre signalement. Ce problème a été corrigé dans la dernière mise à jour. Pensez à rafraîchir la page ou relancer l\'application.',
  },
  {
    label: '💡 Suggestion notée',
    text: 'Bonjour ! Merci pour cette excellente idée d\'amélioration. Elle est bien notée et nous allons étudier son intégration dans une prochaine version.',
  },
  {
    label: '🔍 Précisions demandées',
    text: 'Bonjour, merci pour votre retour. Pourriez-vous nous apporter quelques précisions : sur quel écran cela se produit-il et quel était le résultat attendu ?',
  },
  {
    label: '👍 C\'est réglé',
    text: 'Bonjour ! Tout est rentré dans l\'ordre. N\'hésitez pas si vous avez d\'autres remarques ou questions.',
  },
];

export const AdminContactMessagesSection: React.FC<AdminContactMessagesSectionProps> = ({
  messages,
  onSendReply,
  onUpdateStatus,
  onDeleteMessage,
  onMarkAsRead,
  onRefresh,
  onBack,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'pending' | 'replied' | 'closed'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'all' | ContactSubject>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Active message details
  const activeMessage = useMemo(
    () => messages.find((m) => m.id === activeMessageId) || null,
    [messages, activeMessageId]
  );

  // Stats
  const stats = useMemo(() => {
    const total = messages.length;
    const pending = messages.filter((m) => m.status === 'pending' || !m.isReadByAdmin).length;
    const bugs = messages.filter((m) => m.subject === 'bug').length;
    const replied = messages.filter((m) => m.status === 'replied').length;
    const closed = messages.filter((m) => m.status === 'closed').length;
    return { total, pending, bugs, replied, closed };
  }, [messages]);

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      // Status filter
      if (selectedStatusFilter === 'pending' && m.status !== 'pending' && m.isReadByAdmin) return false;
      if (selectedStatusFilter === 'replied' && m.status !== 'replied') return false;
      if (selectedStatusFilter === 'closed' && m.status !== 'closed') return false;

      // Subject filter
      if (selectedSubjectFilter !== 'all' && m.subject !== selectedSubjectFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inUser = m.userName?.toLowerCase().includes(q) || m.userId?.toLowerCase().includes(q);
        const inFoyer = m.foyerName?.toLowerCase().includes(q);
        const inTitle = m.title?.toLowerCase().includes(q);
        const inMsg = m.message?.toLowerCase().includes(q);
        const inEmail = m.userEmail?.toLowerCase().includes(q);
        if (!inUser && !inFoyer && !inTitle && !inMsg && !inEmail) return false;
      }

      return true;
    });
  }, [messages, selectedStatusFilter, selectedSubjectFilter, searchQuery]);

  const handleOpenMessage = (msg: ContactMessage) => {
    setActiveMessageId(msg.id);
    setReplyText('');
    onMarkAsRead(msg.id, true);
  };

  const handleSendReply = async () => {
    if (!activeMessage || !replyText.trim()) return;

    setIsSubmittingReply(true);
    const res = await onSendReply(activeMessage.id, replyText.trim(), true);
    setIsSubmittingReply(false);

    if (res.success) {
      setReplyText('');
      setActionNotice('Réponse envoyée avec succès à l\'utilisateur ! Notification push transmise.');
      setTimeout(() => setActionNotice(null), 5000);
    } else {
      alert(res.error || 'Erreur lors de l\'envoi de la réponse');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    const d = new Date();
    setLastUpdatedTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    setIsRefreshing(false);
  };

  const handleResetFilters = () => {
    setSelectedStatusFilter('all');
    setSelectedSubjectFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* ========================================================= */}
      {/* 1. TOP CARD (Identical to screenshot IMG_3238)            */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#edf4ff] to-[#f4f8ff] dark:from-slate-800 dark:to-slate-850 border border-[#d6e5fa] dark:border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xs flex items-center justify-between gap-4">
        {/* Left section: Back button + 3D Mailbox + Title */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Retour"
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-2xs border border-slate-200/80 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* 3D Mailbox Asset */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
            <img
              src="/contact-mailbox-3d.jpg"
              alt="Boîte aux lettres support"
              className="w-full h-full object-contain drop-shadow-sm"
              loading="eager"
            />
          </div>

          {/* Titles */}
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-[#0b1f3b] dark:text-white tracking-tight leading-tight">
              Boîte de Réception
            </h2>
            <h3 className="text-xl sm:text-2xl font-black text-[#0b1f3b] dark:text-white tracking-tight leading-tight">
              Support & Contact
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 leading-snug">
              Tous les messages, signalements de bugs et suggestions envoyés par les utilisateurs.
            </p>
          </div>
        </div>

        {/* Right section: 3D Chat Heart Asset */}
        <div className="shrink-0 hidden xs:flex sm:flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20">
          <img
            src="/contact-chat-heart-3d.jpg"
            alt="Bulle contact"
            className="w-full h-full object-contain drop-shadow-sm"
            loading="eager"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. REFRESH & LAST UPDATED BAR (Card 2)                    */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100/90 dark:border-slate-700/60 rounded-2xl px-4 py-3 shadow-3xs flex items-center justify-between">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3.5 py-1.5 rounded-xl bg-[#e6f0ff] hover:bg-blue-100 active:scale-95 text-[#2563eb] font-extrabold text-xs sm:text-sm flex items-center gap-2 border border-blue-200/60 transition-all cursor-pointer shadow-3xs disabled:opacity-50"
        >
          <span className={isRefreshing ? 'animate-spin inline-block' : 'inline-block'}>🔄</span>
          <span>{isRefreshing ? 'Synchronisation...' : 'Rafraîchir'}</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold">
          <span>Dernière mise à jour : {lastUpdatedTime}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-xs" />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. THE 4 METRIC CARDS (KPI) (Card 3)                      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* TOTAL REÇUS */}
        <div
          onClick={() => {
            setSelectedStatusFilter('all');
            setSelectedSubjectFilter('all');
          }}
          className={`bg-[#eff6ff] dark:bg-blue-950/30 border border-[#dbeafe] dark:border-blue-900/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:shadow-2xs transition-all ${
            selectedStatusFilter === 'all' && selectedSubjectFilter === 'all' ? 'ring-2 ring-blue-500/30' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-sm shadow-xs">
            💬
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider mt-3">
              TOTAL REÇUS
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 leading-none">
              {stats.total}
            </p>
          </div>
        </div>

        {/* EN ATTENTE */}
        <div
          onClick={() => setSelectedStatusFilter('pending')}
          className={`bg-[#fffbeb] dark:bg-amber-950/30 border border-[#fef3c7] dark:border-amber-900/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:shadow-2xs transition-all ${
            selectedStatusFilter === 'pending' ? 'ring-2 ring-amber-500/30' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-[#f59e0b] text-white flex items-center justify-center text-sm shadow-xs">
            ⏱️
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider mt-3">
              EN ATTENTE
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 leading-none">
              {stats.pending}
            </p>
          </div>
        </div>

        {/* BUGS SIGNALÉS */}
        <div
          onClick={() => {
            setSelectedSubjectFilter('bug');
            setSelectedStatusFilter('all');
          }}
          className={`bg-[#fff1f2] dark:bg-rose-950/30 border border-[#ffe4e6] dark:border-rose-900/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:shadow-2xs transition-all ${
            selectedSubjectFilter === 'bug' ? 'ring-2 ring-rose-500/30' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-[#f43f5e] text-white flex items-center justify-center text-sm shadow-xs">
            🐞
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider mt-3">
              BUGS SIGNALÉS
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 leading-none">
              {stats.bugs}
            </p>
          </div>
        </div>

        {/* RÉSOLUS / CLÔTURÉS */}
        <div
          onClick={() => setSelectedStatusFilter('closed')}
          className={`bg-[#f0fdf4] dark:bg-emerald-950/30 border border-[#dcfce7] dark:border-emerald-900/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:shadow-2xs transition-all ${
            selectedStatusFilter === 'closed' ? 'ring-2 ring-emerald-500/30' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-[#10b981] text-white flex items-center justify-center text-sm shadow-xs">
            ✓
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider mt-3">
              RÉSOLUS / CLÔTURÉS
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 leading-none">
              {stats.closed}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. SEARCH AND FILTERS (Card 4)                            */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-100/90 dark:border-slate-700/60 shadow-3xs space-y-3">
        {/* Search bar */}
        <div className="relative flex items-center bg-[#f8fafc] dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-4 py-2.5 sm:py-3 focus-within:border-[#2563eb] transition-all">
          <svg className="w-5 h-5 text-slate-400 mr-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par utilisateur, sujet, mot-clé..."
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Subject dropdown */}
        <div className="relative">
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value as any)}
            className="w-full appearance-none bg-[#f8fafc] dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-4 py-2.5 sm:py-3 pr-10 text-slate-800 dark:text-white font-bold text-xs sm:text-sm cursor-pointer focus:outline-none focus:border-[#2563eb]"
          >
            <option value="all">Tous les sujets</option>
            <option value="bug">🐞 Bug technique</option>
            <option value="suggestion">💡 Suggestion d'amélioration</option>
            <option value="question">❓ Question & Assistance</option>
            <option value="other">💬 Autre demande</option>
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedStatusFilter === 'all'
                ? 'bg-[#0f274a] text-white shadow-xs'
                : 'bg-[#f1f5f9] dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>🪲</span>
            <span>Tous ({stats.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedStatusFilter === 'pending'
                ? 'bg-[#0f274a] text-white shadow-xs'
                : 'bg-[#f1f5f9] dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>⏳</span>
            <span>En attente ({stats.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('replied')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedStatusFilter === 'replied'
                ? 'bg-[#0f274a] text-white shadow-xs'
                : 'bg-[#f1f5f9] dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>💬</span>
            <span>Répondus ({stats.replied})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('closed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedStatusFilter === 'closed'
                ? 'bg-[#0f274a] text-white shadow-xs'
                : 'bg-[#f1f5f9] dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>✅</span>
            <span>Résolus ({stats.closed})</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. MESSAGES LIST OR EMPTY STATE (Card 5)                  */}
      {/* ========================================================= */}
      {filteredMessages.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-14 text-center border border-slate-100/90 dark:border-slate-700/60 shadow-3xs space-y-4">
          <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto flex items-center justify-center">
            <img
              src="/contact-mailbox-3d.jpg"
              alt="Boîte aux lettres vide"
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-[#0f274a] dark:text-white">
              Aucun message correspondant aux critères
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 font-medium">
              Modifiez vos filtres ou réinitialisez la recherche.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-full bg-[#eaf2ff] hover:bg-blue-100 active:scale-95 text-[#2563eb] font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 transition-all cursor-pointer border border-blue-200/60 shadow-3xs"
          >
            <span>🔄</span>
            <span>Réinitialiser les filtres</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((msg) => {
            const badge = getContactSubjectBadge(msg.subject);
            const isUnread = !msg.isReadByAdmin;
            const repliesCount = msg.replies?.length || 0;

            return (
              <div
                key={msg.id}
                onClick={() => handleOpenMessage(msg)}
                className={`bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[26px] p-4 sm:p-5 border transition-all cursor-pointer hover:shadow-md ${
                  isUnread
                    ? 'border-amber-400 dark:border-amber-500/80 bg-amber-50/20 dark:bg-amber-950/10 ring-2 ring-amber-400/20'
                    : 'border-slate-100/90 dark:border-slate-700/60 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Subject Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>

                      {/* Status */}
                      {msg.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          ⏳ À traiter
                        </span>
                      )}
                      {msg.status === 'replied' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                          💬 Répondu ({repliesCount})
                        </span>
                      )}
                      {msg.status === 'closed' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          ✅ Résolu
                        </span>
                      )}

                      {isUnread && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                          Nouveau
                        </span>
                      )}

                      {/* Timestamp */}
                      <span className="text-[11px] text-slate-400 font-medium ml-auto">
                        {new Date(msg.createdAt).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {msg.title}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                      {msg.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 font-medium">
                      <span>👤 {msg.userName} ({msg.userId})</span>
                      {msg.foyerName && <span>🏠 {msg.foyerName}</span>}
                      {msg.userEmail && <span>📧 {msg.userEmail}</span>}
                      {msg.deviceInfo && (
                        <span className="truncate max-w-[200px]" title={msg.deviceInfo}>
                          📱 {msg.deviceInfo.split('|')[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-3xs cursor-pointer"
                    >
                      Répondre 💬
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. CONVERSATION MODAL / DRAWER                            */}
      {/* ========================================================= */}
      {activeMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[30px] border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {(() => {
                    const badge = getContactSubjectBadge(activeMessage.subject);
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                    );
                  })()}
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(activeMessage.createdAt).toLocaleString('fr-FR')}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {activeMessage.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  De : <strong className="text-slate-700 dark:text-slate-200">{activeMessage.userName}</strong> ({activeMessage.userId})
                  {activeMessage.userEmail && ` • Email : ${activeMessage.userEmail}`}
                  {activeMessage.foyerName && ` • Foyer : ${activeMessage.foyerName}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveMessageId(null)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Notice banner */}
              {actionNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-fade-in">
                  ✅ {actionNotice}
                </div>
              )}

              {/* Status Selector Bar */}
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Statut du ticket :
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(activeMessage.id, 'pending')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeMessage.status === 'pending'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:opacity-80'
                    }`}
                  >
                    ⏳ En attente
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(activeMessage.id, 'in_progress')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeMessage.status === 'in_progress'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:opacity-80'
                    }`}
                  >
                    ⚙️ En cours
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(activeMessage.id, 'closed')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeMessage.status === 'closed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:opacity-80'
                    }`}
                  >
                    ✅ Résolu
                  </button>
                </div>
              </div>

              {/* Original user message */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>👤 Message original de {activeMessage.userName} :</span>
                </div>
                <div className="p-4 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed shadow-3xs">
                  {activeMessage.message}
                </div>
                {activeMessage.deviceInfo && (
                  <p className="text-[11px] text-slate-400 font-medium pl-1">
                    📱 Diagnostics : {activeMessage.deviceInfo}
                  </p>
                )}
              </div>

              {/* Replies History */}
              {activeMessage.replies && activeMessage.replies.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Historique des échanges :
                  </p>
                  {activeMessage.replies.map((r) => {
                    const isAdmin = r.authorRole === 'admin';
                    return (
                      <div key={r.id} className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          {isAdmin ? (
                            <span className="text-[#2563eb] dark:text-sky-400 flex items-center gap-1">
                              <span>🛠️ Vous (Vincent)</span>
                            </span>
                          ) : (
                            <span className="text-slate-700 dark:text-slate-300">
                              👤 {r.authorName}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(r.createdAt).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <div
                          className={`p-4 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-3xs ${
                            isAdmin
                              ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-100 rounded-tr-sm'
                              : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-sm'
                          }`}
                        >
                          {r.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick Template Buttons */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  Réponses rapides recommandées :
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyText(tmpl.text)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              <div className="space-y-2">
                <label htmlFor="admin-reply-textarea" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Votre réponse à {activeMessage.userName} :
                </label>
                <textarea
                  id="admin-reply-textarea"
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Rédigez votre réponse ici... L'utilisateur recevra directement cette réponse dans sa section Nous contacter, accompagnée d'une notification push."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-y"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Supprimer définitivement ce ticket de message ?')) {
                    await onDeleteMessage(activeMessage.id);
                    setActiveMessageId(null);
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>🗑️ Supprimer le ticket</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMessageId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReply || !replyText.trim()}
                  onClick={handleSendReply}
                  className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmittingReply ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Envoi...</span>
                    </>
                  ) : (
                    <>
                      <span>Envoyer & Notifier</span>
                      <span>🚀</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContactMessagesSection;
