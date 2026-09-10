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

interface SubjectOption {
  id: ContactSubject;
  label: string;
  desc: string;
  image3D: string;
}

const SUBJECT_OPTIONS: SubjectOption[] = [
  {
    id: 'bug',
    label: 'Bug technique',
    desc: 'Signaler un problème',
    image3D: '/contact-bug-3d.jpg',
  },
  {
    id: 'suggestion',
    label: 'Suggestion',
    desc: 'Proposer une amélioration',
    image3D: '/contact-suggestion-3d.jpg',
  },
  {
    id: 'question',
    label: 'Question / Aide',
    desc: 'Besoin d\'assistance',
    image3D: '/contact-question-3d.jpg',
  },
  {
    id: 'other',
    label: 'Autre demande',
    desc: 'Contacter le créateur',
    image3D: '/contact-chat-3d.jpg',
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
    unreadRepliesCount > 0 ? 'list' : 'new'
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

  // Compute Device Summary
  const getDeviceSummary = () => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const ua = navigator.userAgent;
    let os = 'Appareil';
    if (/iPhone|iPad|iPod/.test(ua)) os = 'iPhone / iOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Macintosh|Mac OS X/.test(ua)) os = 'Mac';
    else if (/Windows/.test(ua)) os = 'Windows';

    let browser = '';
    if (/Chrome/.test(ua) && !/Edge|Edg|OPR/.test(ua)) browser = 'Chrome';
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
    else if (/Firefox/.test(ua)) browser = 'Firefox';
    else if (/Edg/.test(ua)) browser = 'Edge';

    return `${os} • ${browser || 'Web'}${isPWA ? ' • PWA' : ''} (${window.innerWidth}x${window.innerHeight})`;
  };

  // Handle Send Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Veuillez indiquer l\'objet de votre demande.');
      return;
    }
    if (!message.trim()) {
      setFormError('Veuillez rédiger votre message détaillé.');
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
      setSuccessNotice('Votre message a bien été envoyé ! Vincent vous répondra directement ici.');
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
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto w-full pb-10">
      {/* Top Header matching screenshot */}
      <div className="flex items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Round Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shrink-0 cursor-pointer"
            title="Retour aux réglages"
          >
            <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>

          {/* Squircle with blue chat bubble matching screenshot */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#e3eeff] dark:bg-sky-950/70 border border-blue-100/90 dark:border-sky-800/40 flex items-center justify-center text-[#2563eb] dark:text-sky-400 shrink-0 shadow-3xs">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3.5C6.753 3.5 2.5 7.306 2.5 12c0 2.016.793 3.868 2.128 5.305-.308 1.57-1.077 3.16-2.052 4.298-.186.217-.037.552.251.529 2.456-.2 4.793-1.127 6.305-2.22.89.262 1.86.405 2.868.405 5.247 0 9.5-3.806 9.5-8.5s-4.253-8.5-9.5-8.5z" />
              <circle cx="8" cy="12" r="1.3" fill="white" />
              <circle cx="12" cy="12" r="1.3" fill="white" />
              <circle cx="16" cy="12" r="1.3" fill="white" />
            </svg>
          </div>

          {/* Title & Subtitle */}
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Nous contacter
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-sm font-medium leading-tight pt-1">
              Une question, un problème ou une idée ?<br />
              Nous sommes à votre écoute.
            </p>
          </div>
        </div>

        {/* 3D Customer Support Headset Illustration */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center">
            <img
              src="/contact-headset-bubble.jpg"
              alt="Support DuoBudget"
              className="w-full h-full object-contain rounded-2xl drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Tabs Switcher if user has tickets or wants to see previous discussions */}
      {userMessages.length > 0 && (
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('new');
              setSuccessNotice(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'new'
                ? 'bg-white dark:bg-slate-700 text-[#2563eb] dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>✏️ Nouveau message</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('list')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
              activeSubTab === 'list'
                ? 'bg-white dark:bg-slate-700 text-[#2563eb] dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📬 Mes échanges ({userMessages.length})</span>
            {unreadRepliesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white animate-pulse">
                {unreadRepliesCount} rép.
              </span>
            )}
          </button>
        </div>
      )}

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
            className="text-emerald-600 dark:text-emerald-400 hover:opacity-75 text-xs font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: FORMULAIRE EXACT SCREENSHOT                         */}
      {/* ========================================================= */}
      {activeSubTab === 'new' && (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 animate-fade-in">
          {/* Section 1: Choisissez le sujet de votre demande */}
          <div className="space-y-2.5">
            <label className="block text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Choisissez le sujet de votre demande
            </label>

            {/* 2 per line Grid matching screenshot */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {SUBJECT_OPTIONS.map((opt) => {
                const isSelected = selectedSubject === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedSubject(opt.id)}
                    className={`w-full text-left p-2.5 sm:p-3.5 rounded-2xl flex items-center justify-between gap-2 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-2 border-[#2563eb] bg-[#f0f6ff] dark:bg-sky-950/40 shadow-xs'
                        : 'border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750/70 shadow-3xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {/* 3D Icon Box */}
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-slate-900 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-3xs border border-slate-100 dark:border-slate-800">
                        <img
                          src={opt.image3D}
                          alt={opt.label}
                          className="w-full h-full object-contain rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                          {opt.label}
                        </p>
                        <p className="text-[9.5px] sm:text-xs text-slate-400 dark:text-slate-400 font-medium pt-0.5 leading-tight truncate">
                          {opt.desc}
                        </p>
                      </div>
                    </div>

                    {/* Right indicator: checkmark circle or chevron */}
                    <div className="shrink-0 ml-0.5">
                      {isSelected ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-xs">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Objet de votre demande */}
          <div className="space-y-1.5">
            <label htmlFor="contact-title" className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Objet de votre demande <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="flex items-center gap-3 px-4 py-3 sm:py-3.5 bg-[#f8fafc] dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
              <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <input
                id="contact-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="En quelques mots, votre demande..."
                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Section 3: Votre message détaillé */}
          <div className="space-y-1.5">
            <label htmlFor="contact-message" className="block text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Votre message détaillé <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="p-3.5 sm:p-4 bg-[#f8fafc] dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <textarea
                  id="contact-message"
                  rows={4}
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre problème ou votre idée en détail..."
                  className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium resize-none min-h-[90px]"
                />
              </div>
              <div className="text-right text-[11px] text-slate-400 dark:text-slate-500 font-medium pt-1">
                {message.length}/1000
              </div>
            </div>
          </div>

          {/* Section 4: Informations techniques (optionnel) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-3xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      Informations techniques
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      (optionnel)
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 font-medium leading-relaxed pt-0.5">
                    Autoriser l'envoi du modèle de votre appareil et de votre navigateur pour nous aider à résoudre le problème.
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={includeDeviceInfo}
                onClick={() => setIncludeDeviceInfo(!includeDeviceInfo)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  includeDeviceInfo ? 'bg-[#2563eb]' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    includeDeviceInfo ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Device summary badge */}
            <div className="bg-[#f1f5f9] dark:bg-slate-750/70 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="5" y="2" width="14" height="20" rx="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="truncate">
                {includeDeviceInfo ? getDeviceSummary() : 'Joindre les informations techniques'}
              </span>
            </div>
          </div>

          {/* Section 5: E-mail de réponse (facultatif) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-3xs space-y-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    E-mail de réponse
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    (facultatif)
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 font-medium leading-relaxed pt-0.5">
                  Recevez également notre réponse par e-mail.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 py-2.5 sm:py-3 bg-[#f8fafc] dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-700/80 rounded-xl focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Form Error notice */}
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
              className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#2563eb] hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 -rotate-45 fill-current" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                  <span>Envoyer le message</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MES ÉCHANGES & FIL DE DISCUSSION                   */}
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
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
                                      <span className="text-[#2563eb] dark:text-sky-400 flex items-center gap-1.5">
                                        <span>🛠️ Vincent</span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black">
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
                                        ? 'bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-950 dark:text-blue-100 rounded-tr-sm'
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
                            <span>Votre message est entre les mains de Vincent. Dès qu'il aura répondu, vous recevrez une notification directe.</span>
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
                              className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => handleReplySubmit(msg.id)}
                              disabled={isReplying || !(replyTextMap[msg.id] || '').trim()}
                              className="px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shrink-0"
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
