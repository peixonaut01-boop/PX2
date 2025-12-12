"use client";

import { usePathname } from 'next/navigation';

// Layout para área do cliente
// A página de login ainda usa o layout normal
// O dashboard usa layout limpo sem Header/Footer
export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname?.includes('/dashboard');

  if (isDashboard) {
    // Dashboard: esconde Header/Footer via CSS inject
    return (
      <>
        <style jsx global>{`
          header:not([data-dashboard]) { display: none !important; }
          footer { display: none !important; }
          .construction-banner { display: none !important; }
        `}</style>
        {children}
      </>
    );
  }

  return <>{children}</>;
}

