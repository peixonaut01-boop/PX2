"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ConstructionBanner } from "./ConstructionBanner";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Durante SSR, sempre renderiza tudo para evitar problemas
  if (!mounted) {
    return (
      <>
        <ConstructionBanner />
        <Header />
        {children}
        <Footer />
      </>
    );
  }

  const isAdminRoute = pathname?.startsWith("/admin");
  const isClienteRoute = pathname?.startsWith("/cliente/dashboard");

  // Não renderiza Header/Footer/Banner em rotas admin ou dashboard cliente
  if (isAdminRoute || isClienteRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <ConstructionBanner />
      <Header />
      {children}
      <Footer />
    </>
  );
}

