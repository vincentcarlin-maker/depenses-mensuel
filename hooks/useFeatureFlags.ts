import { useState, useEffect } from 'react';

export interface FeatureFlags {
  newBalance: boolean;
  graphV2: boolean;
  richNotifications: boolean;
  turboOffline: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  newBalance: true,
  graphV2: true,
  richNotifications: false,
  turboOffline: false,
};

export const getFeatureFlags = (): FeatureFlags => {
  try {
    const saved = localStorage.getItem('duobudget_exp_flags');
    if (saved) return { ...DEFAULT_FLAGS, ...JSON.parse(saved) };
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_FLAGS;
};

export const useFeatureFlags = (): FeatureFlags => {
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags);

  useEffect(() => {
    const handleStorage = () => {
      setFlags(getFeatureFlags());
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('exp_flags_changed', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('exp_flags_changed', handleStorage);
    };
  }, []);

  return flags;
};
