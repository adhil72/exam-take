import { ThemeContext, ThemeContextValue, Theme } from "@/contexts/theme.context";
import { useEffect, useMemo, useState } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as Theme) || 'light';
        }
        return 'light';
    });

    const toggleTheme = () => {
        setTheme((prevTheme) => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return newTheme;
        });
    }

    const setThemeValue = (themeValue: Theme) => {
        setTheme(themeValue);
        localStorage.setItem('theme', themeValue);
    }

    useEffect(() => {
        const body = document.body;
        const html = document.documentElement;
        if (theme === 'dark') {
            body?.classList.add('dark');
            html?.classList.add('dark');
        } else {
            body?.classList.remove('dark');
            html?.classList.remove('dark');
        }

        // Update meta theme-color for PWA
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.setAttribute('name', 'theme-color');
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
    }, [theme])

    const contextData = useMemo<ThemeContextValue>(() => ({
        theme,
        toggleTheme,
        setTheme: setThemeValue,
    }), [theme]);

    return (
        <ThemeContext.Provider value={contextData}>
            <div className="w-full h-screen flex flex-col">
                {children}
            </div>
        </ThemeContext.Provider>
    );
}
