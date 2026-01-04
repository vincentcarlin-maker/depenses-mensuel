
import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';
export type ThemeSetting = Theme | 'system';
export type Vibe = 'cyan' | 'rose' | 'emerald' | 'violet' | 'amber' | 'slate' | 'indigo' | 'orange' | 'teal' | 'fuchsia';

export const useTheme = () => {
    const [themeSetting, setThemeSetting] = useState<ThemeSetting>(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
            return storedTheme;
        }
        return 'system';
    });

    const [vibe, setVibe] = useState<Vibe>(() => {
        const storedVibe = localStorage.getItem('app-vibe');
        return (storedVibe as Vibe) || 'cyan';
    });

    const [effectiveTheme, setEffectiveTheme] = useState<Theme>(() => {
        if (themeSetting === 'light' || themeSetting === 'dark') {
            return themeSetting;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            if (localStorage.getItem('theme') === null) {
                setEffectiveTheme(e.matches ? 'dark' : 'light');
            }
        };
        
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
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

    const changeVibe = useCallback((newVibe: Vibe) => {
        setVibe(newVibe);
        localStorage.setItem('app-vibe', newVibe);
    }, []);
    
    useEffect(() => {
        if (effectiveTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [effectiveTheme]);

    useEffect(() => {
        // Remove all previous vibe classes
        const vibes: Vibe[] = ['cyan', 'rose', 'emerald', 'violet', 'amber', 'slate', 'indigo', 'orange', 'teal', 'fuchsia'];
        vibes.forEach(v => document.documentElement.classList.remove(`vibe-${v}`));
        
        // Add current vibe class
        if (vibe !== 'cyan') {
            document.documentElement.classList.add(`vibe-${vibe}`);
        }
    }, [vibe]);

    return { 
        theme: effectiveTheme, 
        themeSetting, 
        vibe,
        changeThemeSetting, 
        changeVibe 
    };
};
