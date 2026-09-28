import { createContext, useContext } from "react";

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
    theme: Theme,
    toggleTheme: () => void,
    setTheme: (theme: Theme) => void,
}

const initialThemeContextValue: ThemeContextValue = {
    theme: 'light',
    toggleTheme: () => { },
    setTheme: (theme: Theme) => { alert(theme) },
}

export const ThemeContext = createContext<ThemeContextValue>(initialThemeContextValue);

export const useTheme = () => useContext(ThemeContext);
