import React, { useState, useEffect, useCallback } from 'react';
import GoogleIcon from '../icons/GoogleIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import { USER_COLORS } from '../../utils/userColors';
import { fetchFoyerByCode, fetchJoinRequestStatus, cancelJoinRequest } from '../../utils/foyerService';
import { Foyer, FoyerJoinRequest } from '../../types';
import { PendingOAuthUser } from '../../hooks/useAuth';
import { supabase } from '../../supabase/client';

interface OAuthOnboardingFormProps {
  pendingOAuthUser: PendingOAuthUser;
  onCompleteOAuthRegisterNewFoyer?: (params: {
    foyerName: string;
    name: string;
    username: string;
    color?: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string; foyer?: Foyer }>;
  onCompleteOAuthJoinFoyer?: (params: {
    inviteCode: string;
    name: string;
    username: string;
    color?: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string; request?: FoyerJoinRequest; foyer?: Foyer }>;
  onCancelOAuthPending?: () => void;
}

export const OAuthOnboardingForm: React.FC<OAuthOnboardingFormProps> = ({
  pendingOAuthUser,
  onCompleteOAuthRegisterNewFoyer,
  onCompleteOAuthJoinFoyer,
  onCancelOAuthPending,
}) => {
  const [oauthTab, setOauthTab] = useState<'create' | 'join'>('create');
  const [oauthFoyerName, setOauthFoyerName] = useState('');
  const [oauthName, setOauthName] = useState('');
  const [oauthUsername, setOauthUsername] = useState('');
  const [oauthInviteCode, setOauthInviteCode] = useState('');
  const [oauthColor, setOauthColor] = useState('#0ea5e9');
  const [oauthCheckingCode, setOauthCheckingCode] = useState(false);
  const [oauthFoundFoyer, setOauthFoundFoyer] = useState<Foyer | null>(null);
  const [oauthCodeError, setOauthCodeError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Pending request info state
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

  useEffect(() => {
    if (pendingOAuthUser) {
      setOauthName(pendingOAuthUser.fullName || '');
      setOauthUsername(pendingOAuthUser.suggestedUsername || '');
      setOauthFoyerName(pendingOAuthUser.fullName ? `Foyer de ${pendingOAuthUser.fullName}` : 'Mon foyer');
      setError('');
    }
  }, [pendingOAuthUser]);

  // Live foyer lookup
  useEffect(() => {
    const clean = oauthInviteCode.trim().toUpperCase();
    if (clean.length < 3) {
      setOauthFoundFoyer(null);
      setOauthCodeError('');
      return;
    }

    let isCancelled = false;
    setOauthCheckingCode(true);
    setOauthCodeError('');

    const timer = setTimeout(async () => {
      try {
        const foyer = await fetchFoyerByCode(clean);
        if (!isCancelled) {
          setOauthCheckingCode(false);
          if (foyer) {
            setOauthFoundFoyer(foyer);
            setOauthCodeError('');
          } else {
            setOauthFoundFoyer(null);
            if (clean.length >= 6) {
              setOauthCodeError('Aucun foyer trouvé pour ce code.');
            }
          }
        }
      } catch {
        if (!isCancelled) setOauthCheckingCode(false);
      }
    }, 400);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [oauthInviteCode]);

  // Real-time listener for pending request
  useEffect(() => {
    if (!pendingRequestInfo || pendingRequestInfo.status !== 'pending') return;

    const channel = supabase.channel(`oauth_join_req_${pendingRequestInfo.requestId}`, {
      config: { broadcast: { ack: false, self: true } }
    });

    channel
      .on('broadcast', { event: 'foyer_join_approved' }, (payload: any) => {
        const data = payload?.payload || payload;
        if (data?.requestId === pendingRequestInfo.requestId || data?.username === pendingRequestInfo.username) {
          setPendingRequestInfo(prev => prev ? { ...prev, status: 'approved' } : null);
        }
      })
      .on('broadcast', { event: 'foyer_join_rejected' }, (payload: any) => {
        const data = payload?.payload || payload;
        if (data?.requestId === pendingRequestInfo.requestId || data?.username === pendingRequestInfo.username) {
          setPendingRequestInfo(prev => prev ? { ...prev, status: 'rejected' } : null);
        }
      })
      .subscribe();

    const interval = setInterval(async () => {
      try {
        const statusRes = await fetchJoinRequestStatus(pendingRequestInfo.foyerId, pendingRequestInfo.requestId);
        if (statusRes.status === 'approved') {
          setPendingRequestInfo(prev => prev ? { ...prev, status: 'approved' } : null);
        } else if (statusRes.status === 'rejected') {
          setPendingRequestInfo(prev => prev ? { ...prev, status: 'rejected' } : null);
        }
      } catch {}
    }, 5000);

    return () => {
      clearInterval(interval);
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [pendingRequestInfo]);

  const handleManualCheckStatus = useCallback(async () => {
    if (!pendingRequestInfo) return;
    setIsCheckingStatus(true);
    try {
      const statusRes = await fetchJoinRequestStatus(pendingRequestInfo.foyerId, pendingRequestInfo.requestId);
      if (statusRes.status === 'approved' || statusRes.status === 'rejected' || statusRes.status === 'pending') {
        setPendingRequestInfo(prev => prev ? { ...prev, status: statusRes.status as 'pending' | 'approved' | 'rejected' } : null);
      }
    } catch {}
    finally {
      setIsCheckingStatus(false);
    }
  }, [pendingRequestInfo]);

  const handleCancelRequest = useCallback(async () => {
    if (!pendingRequestInfo) return;
    setIsCancelling(true);
    try {
      await cancelJoinRequest(pendingRequestInfo.foyerId, pendingRequestInfo.requestId);
      setPendingRequestInfo(null);
    } catch {
      setPendingRequestInfo(null);
    } finally {
      setIsCancelling(false);
    }
  }, [pendingRequestInfo]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!oauthName.trim() || !oauthUsername.trim() || !oauthFoyerName.trim()) {
      setError('Veuillez renseigner tous les champs obligatoires.');
      return;
    }
    if (!onCompleteOAuthRegisterNewFoyer) return;
    setIsLoading(true);
    try {
      const res = await onCompleteOAuthRegisterNewFoyer({
        foyerName: oauthFoyerName.trim(),
        name: oauthName.trim(),
        username: oauthUsername.trim(),
        color: oauthColor,
      });
      if (!res.success) {
        setError(res.error || 'Erreur lors de la création du foyer.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la création du foyer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!oauthInviteCode.trim()) {
      setError('Veuillez saisir le code d’invitation du foyer.');
      return;
    }
    if (!oauthName.trim() || !oauthUsername.trim()) {
      setError('Veuillez renseigner votre prénom et identifiant.');
      return;
    }
    if (!onCompleteOAuthJoinFoyer) return;
    setIsLoading(true);
    try {
      const res = await onCompleteOAuthJoinFoyer({
        inviteCode: oauthInviteCode.trim(),
        name: oauthName.trim(),
        username: oauthUsername.trim(),
        color: oauthColor,
      });
      if (res.success && res.request) {
        setPendingRequestInfo({
          foyerId: res.request.foyer_id,
          foyerName: oauthFoundFoyer?.name || 'Foyer partagé',
          foyerCode: oauthInviteCode.trim().toUpperCase(),
          requestId: res.request.id,
          name: res.request.name,
          username: res.request.username,
          status: 'pending'
        });
      } else if (!res.success) {
        setError(res.error || 'Code d’invitation introuvable ou incorrect.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la liaison au foyer.');
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingRequestInfo) {
    const isApproved = pendingRequestInfo.status === 'approved';
    const isRejected = pendingRequestInfo.status === 'rejected';

    return (
      <div className="space-y-5 animate-fade-in text-center">
        <div className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center text-3xl shadow-md transition-all duration-300">
          {isApproved ? '🎉' : isRejected ? '❌' : '⏳'}
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isApproved
              ? 'Demande validée !'
              : isRejected
              ? 'Demande refusée'
              : 'Demande envoyée à l’administrateur'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isApproved
              ? `L’administrateur du foyer « ${pendingRequestInfo.foyerName} » a validé votre accès !`
              : isRejected
              ? `L’administrateur du foyer n’a pas validé votre demande.`
              : `Votre demande pour rejoindre « ${pendingRequestInfo.foyerName} » est en attente d'approbation par l'administrateur.`}
          </p>
        </div>

        {!isApproved && !isRejected && (
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-left space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                En attente de confirmation en direct...
              </span>
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
              Dès que l’administrateur valide votre demande dans ses paramètres, vous serez automatiquement connecté.
            </p>
          </div>
        )}

        {isApproved && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Accéder à mon foyer
            </button>
          </div>
        )}

        {!isApproved && (
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleManualCheckStatus}
              disabled={isCheckingStatus}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>🔄</span>
              <span>{isCheckingStatus ? 'Vérification...' : 'Actualiser le statut'}</span>
            </button>
            <button
              type="button"
              onClick={handleCancelRequest}
              disabled={isCancelling}
              className="text-xs text-rose-500 hover:text-rose-600 underline underline-offset-2 py-1 cursor-pointer"
            >
              {isCancelling ? 'Annulation...' : 'Annuler la demande'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center space-y-1.5 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <GoogleIcon className="w-3.5 h-3.5" />
          <span>Connecté avec Google</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Finaliser votre inscription
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Compte : <strong className="text-slate-700 dark:text-slate-200">{pendingOAuthUser.email || pendingOAuthUser.fullName}</strong>
        </p>
      </div>

      {/* Segmented Choice : Nouveau Foyer ou Rejoindre */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => { setError(''); setOauthTab('create'); }}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            oauthTab === 'create'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🏠</span>
          <span>Créer mon foyer</span>
        </button>
        <button
          type="button"
          onClick={() => { setError(''); setOauthTab('join'); }}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            oauthTab === 'join'
              ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🔗</span>
          <span>Rejoindre un foyer</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-semibold">
          {error}
        </div>
      )}

      {oauthTab === 'create' ? (
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nom de votre foyer <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={oauthFoyerName}
              onChange={(e) => setOauthFoyerName(e.target.value)}
              placeholder="Ex: Foyer Martin, Duo Vacances..."
              required
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Votre prénom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={oauthName}
                onChange={(e) => setOauthName(e.target.value)}
                placeholder="Votre prénom"
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Identifiant DuoBudget <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={oauthUsername}
                onChange={(e) => setOauthUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                placeholder="identifiant"
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 font-medium font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Couleur de votre profil
            </label>
            <div className="flex flex-wrap gap-2">
              {USER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setOauthColor(c.value)}
                  className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                    oauthColor === c.value ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Créer mon foyer & commencer</span>
                <ChevronRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Code d’invitation du foyer <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={oauthInviteCode}
              onChange={(e) => setOauthInviteCode(e.target.value.toUpperCase())}
              placeholder="Ex: FOY-123456"
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 font-mono font-black tracking-wider text-center"
            />
            {oauthCheckingCode && (
              <p className="text-[11px] text-slate-500 mt-1">Vérification en cours...</p>
            )}
            {oauthFoundFoyer && (
              <div className="mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                ✅ Foyer trouvé : {oauthFoundFoyer.name} ({oauthFoundFoyer.members?.length || 0} membres)
              </div>
            )}
            {oauthCodeError && (
              <p className="text-[11px] text-rose-500 mt-1 font-semibold">{oauthCodeError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Votre prénom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={oauthName}
                onChange={(e) => setOauthName(e.target.value)}
                placeholder="Votre prénom"
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Identifiant DuoBudget <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={oauthUsername}
                onChange={(e) => setOauthUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                placeholder="identifiant"
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 font-medium font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Couleur de votre profil
            </label>
            <div className="flex flex-wrap gap-2">
              {USER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setOauthColor(c.value)}
                  className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                    oauthColor === c.value ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Rejoindre ce foyer partagé</span>
                <ChevronRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => {
            if (onCancelOAuthPending) onCancelOAuthPending();
          }}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline underline-offset-2 cursor-pointer"
        >
          Changer de compte ou annuler
        </button>
      </div>
    </div>
  );
};
