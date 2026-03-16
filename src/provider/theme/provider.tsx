import { useEffect, useState } from 'react';
import { localStg } from '@/lib/storage';
import { DARK_MODE_MEDIA_QUERY, ThemeProviderContext } from './hook';

type Theme = StorageType.Local['themeMode'];

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: 'themeMode';
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'themeMode',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStg.getItem(storageKey)) || defaultTheme,
  );

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (themeToApply: 'light' | 'dark') => {
      root.setAttribute('data-theme', themeToApply);
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia(DARK_MODE_MEDIA_QUERY);
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      applyTheme(systemTheme);

      // 监听系统主题变化
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    applyTheme(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStg.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext {...props} value={value}>
      {children}
    </ThemeProviderContext>
  );
}
