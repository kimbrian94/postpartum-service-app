// Auto-detect API URL based on hostname
export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side: use local
    return process.env.NEXT_PUBLIC_API_URL_LOCAL || 'http://localhost:8000';
  }
  
  const hostname = window.location.hostname;
  
  // If accessing via localhost, use local API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_API_URL_LOCAL || 'http://localhost:8000';
  }
  
  // If accessing via network IP (from mobile), use network API
  return process.env.NEXT_PUBLIC_API_URL_NETWORK || 'http://10.0.0.218:8000';
};
