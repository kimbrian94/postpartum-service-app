// Auto-detect API URL based on hostname
export const getApiBaseUrl = () => {
  // FIRST: Always prioritize NEXT_PUBLIC_API_URL (for Railway/production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('[Config] Using NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // SECOND: Server-side rendering fallback
  if (typeof window === 'undefined') {
    console.log('[Config] SSR - Using local');
    return process.env.NEXT_PUBLIC_API_URL_LOCAL || 'http://localhost:8000';
  }
  
  const hostname = window.location.hostname;
  console.log('[Config] Client hostname:', hostname);
  
  // THIRD: If accessing via localhost, use local API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('[Config] Using local API');
    return process.env.NEXT_PUBLIC_API_URL_LOCAL || 'http://localhost:8000';
  }
  
  // FOURTH: If accessing via network IP (from mobile), use network API
  console.log('[Config] Using network API');
  return process.env.NEXT_PUBLIC_API_URL_NETWORK || 'http://10.0.0.218:8000';
};