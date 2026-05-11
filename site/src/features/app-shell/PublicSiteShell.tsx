import type { ReactNode } from 'react';

interface PublicSiteShellProps {
  children: ReactNode;
}

export default function PublicSiteShell({ children }: PublicSiteShellProps) {
  return (
    <div data-app-boundary="public-site" className="min-h-screen bg-white">
      {children}
    </div>
  );
}
