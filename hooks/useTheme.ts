import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage';

type Theme = 'light' | 'dark';

// This function determines the initial value only if nothing is in localStorage
const getPreferredTheme = (): Theme => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    // `useLocalStorage` will handle reading from localStorage. We just provide the fallback.
    const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return userPrefersDark ? 'dark' : 'light';
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', getPreferredTheme());

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    
    root.classList.toggle('dark', isDark);

  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return [theme, toggleTheme];
}
