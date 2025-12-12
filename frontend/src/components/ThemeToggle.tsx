"use client";

// Importa o hook useTheme do seu ThemeContext
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  // 1. Usa o hook para acessar o tema e a função de alternância
  const { theme, toggleTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  // 2. Simplifica a montagem: só precisamos saber se o componente está no cliente
  useEffect(() => {
    setMounted(true);
  }, []);


  // Handler simplificado
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
  };

  // Enquanto o cliente não estiver montado, mostra o estado de loading
  if (!mounted) {
    return (
      <button
        type="button"
        className="p-2 rounded-lg text-gray-600 dark:text-gray-300"
        disabled
        aria-label="Carregando tema..."
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  // Define se o tema atual é 'dark' para escolher o ícone
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      // 3. O 'onClick' chama a função do Contexto (e removemos o onMouseDown problemático)
      onClick={handleClick} 
      className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition-colors cursor-pointer z-[100] relative"
      style={{ 
        pointerEvents: "auto",
        touchAction: "manipulation",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        position: "relative",
        zIndex: 100
      }}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {isDark ? (
        // Quando estiver escuro, mostrar o sol (ação: voltar para claro)
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ pointerEvents: "none" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Quando estiver claro, mostrar a lua (ação: ir para escuro)
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ pointerEvents: "none" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}