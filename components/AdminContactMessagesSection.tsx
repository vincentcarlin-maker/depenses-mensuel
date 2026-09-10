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
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'pending' | 'replied' | 'closed'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'all' | ContactSubject>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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
    const suggestions = messages.filter((m) => m.subject === 'suggestion').length;
    const closed = messages.filter((m) => m.status === 'closed').length;
    return { total, pending, bugs, suggestions, closed };
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
        const inUser = m.userName.toLowerCase().includes(q) || m.userId.toLowerCase().includes(q);
        const inFoyer = m.foyerName?.toLowerCase().includes(q);
        const inTitle = m.title.toLowerCase().includes(q);
        const inMsg = m.message.toLowerCase().includes(q);
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
      setActionNotice('Réponse envoyée avec succès à l\'utilisateur ! Une notification push lui a été transmise.');
      setTimeout(() => setActionNotice(null), 5000);
    } else {
      alert(res.error || 'Erreur lors de l\'envoi de la réponse');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Top Banner / Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-5 rounded-2xl sm:rounded-[26px] text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📬</span>
            <h3 className="text-lg sm:text-xl font-black tracking-tight">
              Boîte de Réception Support & Contact
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
            Tous les messages, signalements de bugs et suggestions envoyés par les utilisateurs.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer"
        >
          <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
          <span>{isRefreshing ? 'Synchronisation...' : 'Rafraîchir'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div
          onClick={() => setSelectedStatusFilter('all')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatusFilter === 'all'
              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 ring-2 ring-sky-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 hover:bg-slate-50'
          }`}
        >
          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Total Reçus
          </p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.total}
          </p>
        </div>

        <div
          onClick={() => setSelectedStatusFilter('pending')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatusFilter === 'pending'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              En attente
            </p>
            {stats.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
            {stats.pending}
          </p>
        </div>

        <div
          onClick={() => {
            setSelectedSubjectFilter('bug');
            setSelectedStatusFilter('all');
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedSubjectFilter === 'bug'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 hover:bg-slate-50'
          }`}
        >
          <p className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Bugs signalés
          </p>
          <p className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
            {stats.bugs}
          </p>
        </div>

        <div
          onClick={() => setSelectedStatusFilter('closed')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatusFilter === 'closed'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 hover:bg-slate-50'
          }`}
        >
          <p className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Résolus / Clôturés
          </p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {stats.closed}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[24px] p-4 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par utilisateur, foyer, sujet, mot-clé..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          {/* Subject Filter Dropdown */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Tous les sujets</option>
            <option value="bug">🐞 Bugs uniquement</option>
            <option value="suggestion">💡 Suggestions uniquement</option>
            <option value="question">❓ Questions uniquement</option>
            <option value="other">💬 Autre demande</option>
          </select>
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              selectedStatusFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tous ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              selectedStatusFilter === 'pending'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            ⏳ En attente ({stats.pending})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('replied')}
            className={`px-3 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              selectedStatusFilter === 'replied'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            💬 Répondus
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('closed')}
            className={`px-3 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              selectedStatusFilter === 'closed'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            ✅ Résolus ({stats.closed})
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-700/60 shadow-xs space-y-2">
            <span className="text-3xl">📭</span>
            <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
              Aucun message correspondant aux critères
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Modifiez vos filtres ou réinitialisez la recherche.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const badge = getContactSubjectBadge(msg.subject);
            const isUnread = !msg.isReadByAdmin;
            const repliesCount = msg.replies?.length || 0;

            return (
              <div
                key={msg.id}
                onClick={() => handleOpenMessage(msg)}
                className={`bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[24px] p-4 sm:p-5 border transition-all cursor-pointer hover:shadow-md ${
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

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all"
                    >
                      Répondre 💬
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL / CONVERSATION DRAWER */}
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

            {/* Modal Body / Scrollable Content */}
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

              {/* Initial message bubble */}
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

              {/* Thread of replies */}
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
                            <span className="text-sky-600 dark:text-sky-400 flex items-center gap-1">
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
                              ? 'bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-950 dark:text-sky-100 rounded-tr-sm'
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
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium resize-y"
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
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
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
