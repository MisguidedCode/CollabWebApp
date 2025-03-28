import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../store';
import { fetchUserInfo } from '../store/slices/chatSlice';

export function useUserInfo(userId: string) {
  const dispatch = useAppDispatch();
  const userCache = useSelector((state: RootState) => state.chat.userCache);
  const loading = useSelector((state: RootState) => state.chat.loading.userInfo);
  
  const userData = useMemo(() => ({
    displayName: userCache[userId]?.displayName ?? 'Unknown User',
    photoURL: userCache[userId]?.photoURL ?? null,
    loading
  }), [userId, userCache, loading]);

  useEffect(() => {
    if (!userId) return;

    const cachedUser = userCache[userId];
    const now = Date.now();

    // Fetch if no cache or cache is older than 5 minutes
    if (!cachedUser || (now - cachedUser.lastFetched > 5 * 60 * 1000)) {
      dispatch(fetchUserInfo(userId));
    }
  }, [userId, userCache, dispatch]);

  return userData;
}
