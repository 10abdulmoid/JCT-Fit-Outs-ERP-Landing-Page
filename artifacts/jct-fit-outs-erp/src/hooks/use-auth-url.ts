import { useEffect } from 'react';

let devWarned = false;

export function useAuthUrl() {
  const rawUrl = import.meta.env.VITE_APP_URL;
  const hasUrl = Boolean(rawUrl && rawUrl.trim() !== '');

  useEffect(() => {
    if (!hasUrl && import.meta.env.DEV && !devWarned) {
      devWarned = true;
      console.warn(
        'VITE_APP_URL is missing. Sign-in links are visually disabled.',
      );
    }
  }, [hasUrl]);

  return {
    url: hasUrl ? `${rawUrl.replace(/\/+$/, '')}/login` : undefined,
    isDisabled: !hasUrl,
  };
}
