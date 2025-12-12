"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Inicializa com 'light' para evitar mismatch de hidratação
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const themeRef = useRef<Theme>("light");

  useEffect(() => {
    // Função para obter o tema inicial
    const getInitialTheme = (): Theme => {
      if (typeof window === "undefined") return "light";
      
      // Primeiro, verifica o localStorage
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme === "dark" || savedTheme === "light") {
        // Garante que o DOM está sincronizado
        const root = document.documentElement;
        if (savedTheme === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
        themeRef.current = savedTheme;
        return savedTheme;
      }
      
      // Se não houver tema salvo, sempre default para light
      const root = document.documentElement;
      root.classList.remove("dark");
      themeRef.current = "light";
      return "light";
    };

    // Carrega e sincroniza o tema
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    setMounted(true);
  }, []);

  // Atualiza a ref sempre que o tema muda
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // Escuta mudanças de tema do botão
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail.theme as Theme;
      themeRef.current = newTheme;
      setTheme(newTheme);
    };
    
    window.addEventListener("themechange", handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener("themechange", handleThemeChange as EventListener);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const currentTheme = themeRef.current;
    const newTheme = currentTheme === "light" ? "dark" : "light";

    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("theme", newTheme);
      } catch (e) {
        console.error("Erro ao salvar tema no localStorage:", e);
      }
    }

    themeRef.current = newTheme;
    setTheme(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
