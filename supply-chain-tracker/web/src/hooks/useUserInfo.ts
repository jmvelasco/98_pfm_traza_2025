import { useEffect, useState } from 'react';
import type { UserInfo } from '../lib/contract';
import { getUserInfo } from '../lib/contract';

export function useUserInfo(address: string | null) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setUserInfo(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getUserInfo(address)
      .then(setUserInfo)
      .catch(() => setError('Error loading user info'))
      .finally(() => setLoading(false));
  }, [address]);

  return { userInfo, loading, error };
}
