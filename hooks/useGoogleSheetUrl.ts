import useLocalStorage from './useLocalStorage';
import { GOOGLE_SHEET_API_URL } from '../config';
import { useMemo } from 'react';

const isUrlConfigured = (url: string | null | undefined): boolean => {
    if (!url) return false;
    if (url.includes('YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE')) return false;
    if (url.trim() === '') return false;
    // A basic check to see if it looks like a Google Script URL.
    return url.startsWith('https://script.google.com/macros/s/');
};

export function useGoogleSheetUrl(): [string, (url: string) => void, boolean] {
  const [storedUrl, setStoredUrl] = useLocalStorage<string>('googleSheetApiUrl', GOOGLE_SHEET_API_URL);

  const isConfigured = useMemo(() => isUrlConfigured(storedUrl), [storedUrl]);

  return [storedUrl, setStoredUrl, isConfigured];
}
