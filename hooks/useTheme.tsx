import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';
export type ThemeSetting = Theme | 'system';

export const useTheme = () => {
    const [themeSetting, setThemeSetting] = useState<ThemeSetting>(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
            return storedTheme;
        }
        return 'system';
    });

    const [effectiveTheme, setEffectiveTheme] = useState<Theme>(() => {
        if (themeSetting === 'light' || themeSetting === 'dark') {
            return themeSetting;
        }
        // For 'system', determine from media query
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            // Only update if the user has selected 'system'
            if (localStorage.getItem('theme') === null) {
                setEffectiveTheme(e.matches ? 'dark' : 'light');
            }
        };
        
        mediaQuery.addEventListener('change', handleSystemThemeChange);

        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, []);

    const changeThemeSetting = useCallback((setting: ThemeSetting) => {
        setThemeSetting(setting);
        if (setting === 'system') {
            localStorage.removeItem('theme');
            setEffectiveTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        } else {
            localStorage.setItem('theme', setting);
            setEffectiveTheme(setting);
        }
    }, []);
    
    useEffect(() => {
        if (effectiveTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [effectiveTheme]);

    // The toggleTheme function is replaced by changeThemeSetting
    return { theme: effectiveTheme, themeSetting, changeThemeSetting };
};
