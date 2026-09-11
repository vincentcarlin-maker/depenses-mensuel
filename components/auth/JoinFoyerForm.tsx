import React, { useState, useEffect, useCallback } from 'react';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import { USER_COLORS } from '../../utils/userColors';
import { fetchFoyerByCode, fetchJoinRequestStatus, cancelJoinRequest } from '../../utils/foyerService';
import { Foyer, FoyerJoinRequest } from '../../types';
import { supabase } from '../../supabase/client';

interface JoinFoyerFormProps {
  onRegisterJoinFoyer?: (params: {
    name: string;
    username: string;
    password: string;
    inviteCode: string;
    color?: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string; request?: FoyerJoinRequest; foyer?: Foyer }>;
  onSwitchToLogin: () => void;
  onSwitchToCreate: () => void;
}

export const JoinFoyerForm: React.FC<JoinFoyerFormProps> = ({
  onRegisterJoinFoyer,
  onSwitchToLogin,
  onSwitchToCreate,
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState('#ec4899');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Live lookup
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [foundFoyer, setFoundFoyer] = useState<Foyer | null>(null);
  const [codeError, setCodeError] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Submitted request state
  const [pendingRequestInfo, setPendingRequestInfo] = useState<{
    foyerId: string;
    foyerName: string;
    foyerCode: string;
    requestId: string;
    name: string;
    username: string;
    status: 'pending' | 'approved' | 'rejected';
  } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Live foyer lookup when typing invite code
  useEffect(() => {
    const clean = inviteCode.trim().toUpperCase();
    if (clean.length < 3) {
      setFoundFoyer(null);
      setCodeError('');
      return;
    }

    let isCancelled = false;
    setIsCheckingCode(true);
    setCodeError('');

    const timer = setTimeout(async () => {
      try {
        const foyer = await fetchFoyerByCode(clean);
        if (!isCancelled) {
          setIsCheckingCode(false);
          if (foyer) {
            setFoundFoyer(foyer);
            setCodeError('');
          } else {
            setFoundFoyer(null);
            if (clean.length >= 6) {
              setCodeError('Aucun foyer trouvé pour ce code.');
            }
          }
        }
      } catch {
        if (!isCancelled) {
          setIsCheckingCode(false);
        }
      }
    }, 400);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [inviteCode]);

  // Real-time listener when request is pending
  useEffect(() => {
    if (!pendingRequestInfo || pendingRequestInfo.status !== 'pending') return;

    const channel = supabase.channel(`join-req-${pendingRequestInfo.foyerId}`)
      .on('broadcast', { event: 'foyer_join_approved' }, (payload) => {
        if (payload?.payload?.username?.toLowerCase() === pendingRequestInfo.username.toLowerCase()) {
          setPendingRequestInfo(prev => prev ? { ...prev, status: 'approved' } : null);
        }
      })
      .on('broadcast', { event: 'foyer_join_rejected' }, (payload) => {
        if (payload?.payload?.username?.toLowerCase() === pendingRequestInfo.username.toLowerCase()) {
          setPendingRequestInfo(prev => prev ? { ...prev, status: 'rejected' } : null);
        }
      })
      .subscribe();

    // Poll periodically every 6 seconds as fallback
    const interval = setInterval(async () => {
      const statusRes = await fetchJoinRequestStatus(pendingRequestInfo.foyerCode, pendingRequestInfo.username);
      if (statusRes.status === 'approved' || statusRes.status === 'rejected' || statusRes.status === 'pending') {
        if (statusRes.status !== pendingRequestInfo.status) {
          setPendingRequestInfo(prev => prev ? { ...prev, status: statusRes.status as 'pending' | 'approved' | 'rejected' } : null);
        }
      }
    }, 6000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [pendingRequestInfo]);

  const handleManualCheckStatus = useCallback(async () => {
    if (!pendingRequestInfo) return;
    setIsCheckingStatus(true);
    try {
      const statusRes = await fetchJoinRequestStatus(pendingRequestInfo.foyerCode, pendingRequestInfo.username);
      if (statusRes.status === 'approved' || statusRes.status === 'rejected' || statusRes.status === 'pending') {
        setPendingRequestInfo(prev => prev ? { ...prev, status: statusRes.status as 'pending' | 'approved' | 'rejected' } : null);
      }
    } finally {
      setIsCheckingStatus(false);
    }
  }, [pendingRequestInfo]);

  const handleCancelRequest = useCallback(async () => {
    if (!pendingRequestInfo) return;
    setIsCancelling(true);
    try {
      await cancelJoinRequest(pendingRequestInfo.foyerId, pendingRequestInfo.requestId);
      setPendingRequestInfo(null);
      setError('');
    } catch {
      setError('Impossible d’annuler la demande pour le moment.');
    } finally {
      setIsCancelling(false);
    }
  }, [pendingRequestInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanCode = inviteCode.trim().toUpperCase();
    const cleanName = regName.trim();
    const cleanUsername = regUsername.trim().toLowerCase();
    const cleanPassword = regPassword.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanCode) {
      setError('Veuillez saisir le code d’invitation.');
      return;
    }

    if (!cleanName || !cleanUsername || !cleanPassword) {
      setError('Veuillez renseigner votre prénom, identifiant et mot de passe.');
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Veuillez renseigner une adresse email valide.');
      return;
    }

    if (!onRegisterJoinFoyer) {
      setError('Service de liaison indisponible.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onRegisterJoinFoyer({
        name: cleanName,
        username: cleanUsername,
        password: cleanPassword,
        inviteCode: cleanCode,
        color: selectedColor,
        email: cleanEmail || undefined,
      });

      if (!res.success) {
        setError(res.error || 'Code d’invitation introuvable ou invalide.');
      } else if (res.request && res.foyer) {
        setPendingRequestInfo({
          foyerId: res.foyer.id,
          foyerName: res.foyer.name,
          foyerCode: res.foyer.code,
          requestId: res.request.id,
          name: res.request.name,
          username: res.request.username,
          status: 'pending'
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la liaison au foyer.');
    } finally {
      setIsLoading(false);
    }
  };

  // If request has been submitted and is in pending/approved/rejected state
  if (pendingRequestInfo) {
    const isPending = pendingRequestInfo.status === 'pending';
    const isApproved = pendingRequestInfo.status === 'approved';
    const isRejected = pendingRequestInfo.status === 'rejected';

    return (
      <div className="space-y-5 animate-fade-in">
        {/* Status Card */}
        <div className={`p-5 rounded-3xl border text-center space-y-4 ${
          isApproved
            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
            : isRejected
            ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
            : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
        }`}>
          {/* Status Icon */}
          <div className="flex justify-center">
            {isApproved ? (
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-2xl shadow-sm animate-bounce">
                🎉
              </div>
            ) : isRejected ? (
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center text-2xl shadow-sm">
                ❌
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center text-2xl shadow-sm relative">
                <span className="animate-spin text-xl">⏳</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">
              {isApproved
                ? 'Demande validée par l’administrateur !'
                : isRejected
                ? 'Demande d’accès refusée'
                : 'Demande en attente de validation'}
            </h3>
            <p className="text-xs sm:text-sm opacity-90 max-w-sm mx-auto">
              {isApproved
                ? `Félicitations ${pendingRequestInfo.name} ! L’administrateur du foyer « ${pendingRequestInfo.foyerName} » a validé votre accès.`
                : isRejected
                ? `L’administrateur du foyer « ${pendingRequestInfo.foyerName} » n’a pas accepté cette demande d’adhésion.`
                : `Votre demande d’intégration au foyer « ${pendingRequestInfo.foyerName} » a bien été transmise à l’administrateur.`}
            </p>
          </div>

          {/* Details Pill */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-left space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Foyer ciblé :</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{pendingRequestInfo.foyerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Identifiant créé :</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">@{pendingRequestInfo.username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Statut :</span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                isApproved
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : isRejected
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1.5'
              }`}>
                {isPending && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                {isApproved ? 'Accès validé' : isRejected ? 'Refusée' : 'En attente de l’admin'}
              </span>
            </div>
          </div>

          {/* Info notice */}
          {isPending && (
            <div className="p-3 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 text-[11px] text-amber-800 dark:text-amber-200 font-medium text-left flex items-start gap-2">
              <span className="text-base shrink-0">🛡️</span>
              <span>
                L’administrateur du foyer a reçu votre demande. Dès qu’il clique sur « Valider », votre compte sera actif immédiatement.
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {isApproved ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Se connecter maintenant</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          ) : isRejected ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setPendingRequestInfo(null);
                  setError('');
                }}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Refaire une demande avec un autre code
              </button>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-center cursor-pointer"
              >
                Retour à la page de connexion
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleManualCheckStatus}
                disabled={isCheckingStatus}
                className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-60"
              >
                <span className={isCheckingStatus ? 'animate-spin' : ''}>🔄</span>
                <span>{isCheckingStatus ? 'Vérification en cours...' : 'Vérifier la validation'}</span>
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleCancelRequest}
                  disabled={isCancelling}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
                >
                  {isCancelling ? 'Annulation...' : 'Annuler ma demande'}
                </button>
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium cursor-pointer"
                >
                  Retour à la connexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="p-3.5 rounded-2xl bg-pink-50/70 dark:bg-pink-950/30 border border-pink-100/80 dark:border-pink-900/40 text-xs text-pink-900 dark:text-pink-200">
        <p className="font-semibold flex items-center gap-1.5">
          <span>💌</span>
          <span>Votre partenaire a déjà créé votre espace ?</span>
        </p>
        <p className="mt-0.5 text-[11px] opacity-90">
          Entrez le code d’invitation du foyer. Votre demande sera transmise à l’administrateur du foyer pour validation.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Code d'invitation box */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Code d’invitation du foyer <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
              maxLength={12}
              placeholder="Code du foyer"
              className="w-full px-4 py-3 bg-slate-50/90 dark:bg-slate-900/90 font-mono font-black text-base tracking-widest text-center text-slate-900 dark:text-white rounded-2xl border border-pink-200 dark:border-pink-900/60 uppercase focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all"
            />
            {isCheckingCode && (
              <div className="absolute right-3.5 top-3.5">
                <div className="w-5 h-5 border-2 border-pink-300 dark:border-pink-700 border-t-pink-500 rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Live Preview Badge if Found */}
          {foundFoyer && (
            <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2.5 animate-fade-in">
              <span className="text-base">🎉</span>
              <div>
                <p className="font-bold">Foyer trouvé : {foundFoyer.name}</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Admin : {foundFoyer.members?.find(m => m.role === 'admin')?.name || foundFoyer.members?.[0]?.name || 'Administrateur'}
                </p>
              </div>
            </div>
          )}

          {codeError && (
            <p className="mt-1.5 text-xs text-rose-500 font-semibold">{codeError}</p>
          )}
        </div>

        {/* Prénom & Identifiant */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Votre prénom <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              required
              placeholder="Votre prénom"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 font-medium transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Identifiant <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              required
              placeholder="identifiant"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 font-medium transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Adresse email <span className="text-slate-400 font-normal">(optionnelle)</span>
          </label>
          <input
            type="email"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            placeholder="email@exemple.com"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 font-medium transition-all"
          />
        </div>

        {/* Mot de passe */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Mot de passe <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-3.5 pr-11 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 font-medium transition-all"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              {isPasswordVisible ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Profil color */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Couleur de votre profil
          </label>
          <div className="flex flex-wrap gap-2">
            {USER_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                className={`w-7 h-7 rounded-full ${c.bgClass} flex items-center justify-center transition-all ${
                  selectedColor === c.value
                    ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110 shadow-sm'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                title={c.label}
              >
                {selectedColor === c.value && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="join-foyer-submit"
          disabled={isLoading}
          className="group relative w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-md hover:shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 overflow-hidden mt-3"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Envoi de la demande...</span>
            </div>
          ) : (
            <>
              <span>Envoyer la demande d’adhésion</span>
              <ChevronRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {/* Switcher links */}
      <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-medium cursor-pointer"
        >
          Déjà un compte ? <span className="font-semibold underline underline-offset-2 text-slate-700 dark:text-slate-300">Se connecter</span>
        </button>
        <button
          type="button"
          onClick={onSwitchToCreate}
          className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium cursor-pointer"
        >
          Pas encore de code ? <span className="font-semibold underline underline-offset-2 text-slate-700 dark:text-slate-300">Créer un foyer</span>
        </button>
      </div>
    </div>
  );
};
