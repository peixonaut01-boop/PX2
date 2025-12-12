import React from "react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full mt-12 py-6 text-center text-slate-600 dark:text-slate-300 text-sm bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <p>&copy; {currentYear} PX Economics. Todos os direitos reservados.</p>
    </footer>
  );
};
