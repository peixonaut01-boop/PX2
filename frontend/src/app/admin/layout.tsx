// Layout específico para páginas admin - sem Header/Footer do site principal
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

