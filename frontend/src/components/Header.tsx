"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

interface DropdownItem {
  label: string;
  href: string;
  description?: string;
}

interface NavDropdownProps {
  label: string;
  items: DropdownItem[];
}

function NavDropdown({ label, items }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="flex items-center gap-1 py-2 transition-colors text-gray-700 hover:text-black dark:text-gray-200 dark:hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown container */}
      <div
        className={`absolute left-0 top-full w-64 z-50 transition-all duration-150 ${isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
          }`}
      >
        <div className="h-2" />
        <div className="rounded-xl shadow-lg border py-2 bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 transition-colors hover:bg-gray-50 text-gray-900 dark:hover:bg-gray-700 dark:text-white"
              onClick={() => setIsOpen(false)}
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {item.label}
              </span>
              {item.description && (
                <span className="block text-xs mt-0.5 text-gray-500 dark:text-gray-400">
                  {item.description}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const brasilIndicators: DropdownItem[] = [
    {
      label: "IPCA",
      href: "/indicators/ipca",
      description: "Inflação oficial — mensal",
    },
    {
      label: "IPCA-15",
      href: "/indicators/ipca15",
      description: "Prévia da inflação — quinzenal",
    },
    {
      label: "PIM (Indústria)",
      href: "/indicators/pim",
      description: "Produção Industrial",
    },
    {
      label: "PMC (Varejo)",
      href: "/indicators/pmc",
      description: "Vendas no Varejo",
    },
    {
      label: "PMS (Serviços)",
      href: "/indicators/pms",
      description: "Volume de Serviços",
    },
  ];

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 shadow-sm backdrop-blur sticky top-0 z-40 transition-colors duration-300">
      <div className="w-full px-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-px.svg"
              alt="Logo PX Economics"
              width={32}
              height={32}
              priority
            />
            <span className="text-lg font-bold tracking-tight md:text-xl text-gray-900 dark:text-white">
              PX Economics
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="text-gray-700 hover:text-black dark:text-gray-200 dark:hover:text-white transition-colors"
            >
              Home
            </Link>

            <NavDropdown label="Brasil" items={brasilIndicators} />

            <Link
              href="/news"
              className="text-gray-700 hover:text-black dark:text-gray-200 dark:hover:text-white transition-colors"
            >
              Notícias
            </Link>
          </nav>

          {/* Right side: Theme toggle + Mobile menu */}
          <div className="flex items-center gap-3 relative z-10">
            <ThemeToggle />
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-700 dark:text-gray-200"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              {isMobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-xl">
          <div className="flex flex-col p-4 space-y-4">
            <Link
              href="/"
              className="px-4 py-2 text-base font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsMobileOpen(false)}
            >
              Home
            </Link>

            <div className="space-y-2">
              <div className="px-4 py-1 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Brasil
              </div>
              {brasilIndicators.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-3 ml-2 text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</div>
                  )}
                </Link>
              ))}
            </div>

            <Link
              href="/news"
              className="px-4 py-2 text-base font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsMobileOpen(false)}
            >
              Notícias
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
