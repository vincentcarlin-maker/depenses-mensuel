import React, { useState, useEffect } from 'react';
import { ContactMessage, ContactSubject } from '../types';
import { getContactSubjectBadge } from '../utils/contactService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface ContactTabProps {
  onBack: () => void;
  userMessages: ContactMessage[];
  unreadRepliesCount: number;
  onSendMessage: (data: {
    subject: ContactSubject;
    title: string;
    message: string;
    userEmail?: string;
    deviceInfo?: string;
  }) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  onSendReply: (messageId: string, replyText: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateStatus: (messageId: string, status: ContactMessage['status']) => Promise<boolean>;
  onMarkAsRead: (messageId: string) => Promise<void>;
  currentUserEmail?: string;
  currentUsername?: string;
}

const SUBJECT_OPTIONS: { id: ContactSubject; label: string; icon: string; desc: string; color: string }[] = [
  {
    id: 'bug',
    label: 'Bug technique',
    icon: '🐞',
    desc: 'Un problème, affichage anormal ou dysfonctionnement',
    color: 'hover:border-rose-300 dark:hover:border-rose-700 peer-checked:border-rose-500 peer-checked:bg-rose-50/50 dark:peer-checked:bg-rose-950/30',
  },
  {
    id: 'suggestion',
    label: 'Suggestion',
    icon: '💡',
    desc: 'Une idée de fonctionnalité ou d\'amélioration',
    color: 'hover:border-purple-300 dark:hover:border-purple-700 peer-checked:border-purple-500 peer-checked:bg-purple-50/50 dark:peer-checked:bg-purple-950/30',
  },
  {
    id: 'question',
    label: 'Question / Aide',
    icon: '❓',
    desc: 'Besoin d\'assistance pour utiliser DuoBudget',
    color: 'hover:border-sky-300 dark:hover:border-sky-700 peer-checked:border-sky-500 peer-checked:bg-sky-50/50 dark:peer-checked:bg-sky-950/30',
  },
  {
    id: 'other',
    label: 'Autre demande',
    icon: '💬',
    desc: 'Toute autre question ou mot pour le créateur',
    color: 'hover:border-emerald-300 dark:hover:border-emerald-700 peer-checked:border-emerald-500 peer-checked:bg-emerald-50/50 dark:peer-checked:bg-emerald-950/30',
  },
];

export const ContactTab: React.FC<ContactTabProps> = ({
  onBack,
  userMessages,
  unreadRepliesCount,
  onSendMessage,
  onSendReply,
  onUpdateStatus,
  onMarkAsRead,
  currentUserEmail = '',
  currentUsername: _currentUsername = '',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'new' | 'list'>(
    unreadRepliesCount > 0 || userMessages.length > 0 ? 'list' : 'new'
  );

  // Form State
  const [selectedSubject, setSelectedSubject] = useState<ContactSubject>('bug');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(currentUserEmail);
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Discussion state
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(
    userMessages.length > 0 ? userMessages[0].id : null
  );
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [isReplying, setIsReplying] = useState(false);

  // When expanding message, mark as read
  useEffect(() => {
    if (expandedMessageId) {
      onMarkAsRead(expandedMessageId);
    }
  }, [expandedMessageId, onMarkAsRead]);

  // Handle Send Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Veuillez indiquer l\'objet de votre message.');
      return;
    }
    if (!message.trim()) {
      setFormError('Veuillez rédiger votre message.');
      return;
    }

    setIsSubmitting(true);

    let deviceInfoStr = '';
    if (includeDeviceInfo) {
      deviceInfoStr = `${navigator.userAgent} | Écran: ${window.innerWidth}x${window.innerHeight}`;
    }

    const res = await onSendMessage({
      subject: selectedSubject,
      title: title.trim(),
      message: message.trim(),
      userEmail: email.trim() || undefined,
      deviceInfo: deviceInfoStr || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setTitle('');
      setMessage('');
      setSuccessNotice('Votre message a bien été envoyé à Vincent. Vous recevrez sa réponse directement ici !');
      setActiveSubTab('list');
      if (res.messageId) {
        setExpandedMessageId(res.messageId);
      }
    } else {
      setFormError(res.error || 'Une erreur est survenue lors de l\'envoi.');
    }
  };

  // Handle reply from user
  const handleReplySubmit = async (messageId: string) => {
    const text = replyTextMap[messageId] || '';
    if (!text.trim()) return;

    setIsReplying(true);
    const res = await onSendReply(messageId, text.trim());
    setIsReplying(false);

    if (res.success) {
      setReplyTextMap((prev) => ({ ...prev, [messageId]: '' }));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-10">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Retour aux réglages"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Nous contacter</span>
              <span className="text-base">💬</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
              Signalez un bug, posez une question ou proposez une idée à Vincent.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('new');
            setSuccessNotice(null);
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'new'
              ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>✏️</span>
          <span>Nouveau message</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('list')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
            activeSubTab === 'list'
              ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>📬</span>
          <span>Mes échanges ({userMessages.length})</span>
          {unreadRepliesCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white animate-pulse">
              {unreadRepliesCount} nouvelle{unreadRepliesCount > 1 ? 's' : ''}
            </span>
          )}
        </button>
      </div>

      {/* Success banner */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <span className="text-base">✅</span>
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:opacity-75 text-xs font-bold"
          >
            Fermer
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: NOUVEAU MESSAGE                                    */}
      {/* ========================================================= */}
      {activeSubTab === 'new' && (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 animate-fade-in">
          {/* Card: Choix du Sujet */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                Sujet de votre message <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Sélectionnez la catégorie qui correspond le mieux à votre demande.
              </p>
            </div>

            {/* Grid of Subject Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {SUBJECT_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="relative flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-750"
                >
                  <input
                    type="radio"
                    name="contactSubject"
                    value={opt.id}
                    checked={selectedSubject === opt.id}
                    onChange={() => setSelectedSubject(opt.id)}
                    className="sr-only peer"
                  />
                  <div
                    className={`absolute inset-0 rounded-2xl border-2 pointer-events-none transition-all ${
                      selectedSubject === opt.id
                        ? opt.id === 'bug'
                          ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
                          : opt.id === 'suggestion'
                          ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20'
                          : opt.id === 'question'
                          ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/20'
                          : 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-transparent'
                    }`}
                  />
                  <span className="text-xl sm:text-2xl shrink-0 mt-0.5">{opt.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {opt.label}
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium leading-snug">
                      {opt.desc}
                    </p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
                      selectedSubject === opt.id
                        ? 'border-sky-500 bg-sky-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {selectedSubject === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Card: Message Content */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[26px] p-5 sm:p-6 border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-4">
            <div>
              <label htmlFor="contact-title" className="block text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">
                Objet / Résumé court <span className="text-rose-500">*</span>
              </label>
              <input
                id="contact-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  selectedSubject === 'bug'
                    ? 'Ex: Erreur lors de l\'ajout d\'une dépense ou écran blanc'
                    : selectedSubject === 'suggestion'
                    ? 'Ex: Possibilité de filtrer par magasin dans les statistiques'
                    : selectedSubject === 'question'
                    ? 'Ex: Comment inviter un autre membre dans mon foyer ?'
                    : 'Ex: Question sur la synchronisation'
                }
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">
                Votre message détaillé <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="contact-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  selectedSubject === 'bug'
                    ? 'Décrivez ce qui s\'est passé : sur quel onglet étiez-vous ? que cherchiez-vous à faire ? avez-vous vu un message d\'erreur ?'
                    : selectedSubject === 'suggestion'
                    ? 'Décrivez votre idée : quel besoin cela résout-il pour vous dans votre gestion de budget ?'
                    : 'Expliquez votre demande ou votre question en quelques lignes...'
                }
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium resize-y"
              />
            </div>

            {/* Email contact optional */}
            <div>
              <label htmlFor="contact-email" className="block text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                Adresse e-mail (optionnelle)
              </label>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1.5">
                La réponse arrivera directement dans l'application, mais vous pouvez aussi laisser un e-mail de contact.
              </p>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            {/* Device Info toggle */}
            <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDeviceInfo}
                onChange={(e) => setIncludeDeviceInfo(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600 dark:bg-slate-900"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Transmettre les infos de diagnostic (modèle d'écran & navigateur pour aider à corriger le bug)
              </span>
            </label>

            {/* Error Message */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold">
                ⚠️ {formError}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Envoyer mon message</span>
                    <span>🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MES MESSAGES ET REPONSES                          */}
      {/* ========================================================= */}
      {activeSubTab === 'list' && (
        <div className="space-y-4 animate-fade-in">
          {userMessages.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[26px] p-8 text-center border border-slate-100/90 dark:border-slate-700/60 shadow-xs space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-3xl">
                📬
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white">
                Aucun message envoyé
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium max-w-md mx-auto">
                Vous n'avez pas encore envoyé de message au développeur. Une remarque, un bug ou une idée ? Écrivez-nous en un clic !
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('new')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
              >
                <span>✏️ Rédiger un message</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userMessages.map((msg) => {
                const badge = getContactSubjectBadge(msg.subject);
                const isExpanded = expandedMessageId === msg.id;
                const hasUnreadReply = !msg.isReadByUser && msg.replies?.length > 0;

                return (
                  <div
                    key={msg.id}
                    className={`bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[26px] border transition-all overflow-hidden ${
                      hasUnreadReply
                        ? 'border-emerald-400 dark:border-emerald-500 shadow-md ring-2 ring-emerald-400/20'
                        : 'border-slate-100/90 dark:border-slate-700/60 shadow-xs'
                    }`}
                  >
                    {/* Header bar of ticket */}
                    <div
                      onClick={() => setExpandedMessageId(isExpanded ? null : msg.id)}
                      className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>

                          {/* Status Badge */}
                          {msg.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              ⏳ En attente
                            </span>
                          )}
                          {msg.status === 'replied' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                              <span>💬 Réponse reçue</span>
                              {hasUnreadReply && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              )}
                            </span>
                          )}
                          {msg.status === 'in_progress' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                              ⚙️ En cours
                            </span>
                          )}
                          {msg.status === 'closed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              ✅ Résolu
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400 font-medium ml-auto">
                            {new Date(msg.createdAt).toLocaleDateString('fr-FR', {
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

                        {!isExpanded && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium line-clamp-2">
                            {msg.message}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-slate-400 pt-1">
                        <svg
                          className={`w-5 h-5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded Thread */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-700/60 p-4 sm:p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
                        {/* Initial message bubble */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            <span>👤 Vous ({msg.userName})</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(msg.createdAt).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl rounded-tl-sm border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-3xs">
                            {msg.message}
                          </div>
                        </div>

                        {/* Chronological replies */}
                        {msg.replies && msg.replies.length > 0 && (
                          <div className="space-y-3 pt-2">
                            {msg.replies.map((reply) => {
                              const isAdminReply = reply.authorRole === 'admin';
                              return (
                                <div key={reply.id} className="space-y-1.5">
                                  <div className="flex items-center gap-2 text-xs font-extrabold">
                                    {isAdminReply ? (
                                      <span className="text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                                        <span>🛠️ Vincent</span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-black">
                                          DÉVELOPPEUR
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-700 dark:text-slate-300">
                                        👤 Vous
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {new Date(reply.createdAt).toLocaleString('fr-FR')}
                                    </span>
                                  </div>
                                  <div
                                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-3xs ${
                                      isAdminReply
                                        ? 'bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 text-sky-950 dark:text-sky-100 rounded-tr-sm'
                                        : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                                    }`}
                                  >
                                    {reply.message}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Notice if waiting for first response */}
                        {(!msg.replies || msg.replies.length === 0) && msg.status === 'pending' && (
                          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs font-medium flex items-center gap-2">
                            <span>⏳</span>
                            <span>Votre message est entre les mains de Vincent. Dès qu'il aura répondu, vous recevrez une alerte directe.</span>
                          </div>
                        )}

                        {/* Reply Input Box */}
                        <div className="pt-2 space-y-2">
                          <label htmlFor={`reply-input-${msg.id}`} className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                            Répondre dans cette discussion :
                          </label>
                          <div className="flex gap-2">
                            <input
                              id={`reply-input-${msg.id}`}
                              type="text"
                              value={replyTextMap[msg.id] || ''}
                              onChange={(e) =>
                                setReplyTextMap((prev) => ({ ...prev, [msg.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleReplySubmit(msg.id);
                                }
                              }}
                              placeholder="Ajouter une précision ou répondre à Vincent..."
                              className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => handleReplySubmit(msg.id)}
                              disabled={isReplying || !(replyTextMap[msg.id] || '').trim()}
                              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                            >
                              <span>Envoyer</span>
                              <span>💬</span>
                            </button>
                          </div>

                          {/* Quick resolution button */}
                          {msg.status !== 'closed' && msg.replies && msg.replies.length > 0 && (
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(msg.id, 'closed')}
                                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <span>✅ Mon problème est résolu / Clôturer</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactTab;
