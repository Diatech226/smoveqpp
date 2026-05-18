import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function createIcon(glyph: string) {
  return function CmsIcon({ className, ...props }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
        {...props}
      >
        <circle cx="12" cy="12" r="9" />
        <path d={glyph} />
      </svg>
    );
  };
}

export const AlertCircle = createIcon('M12 8v5m0 3h.01');
export const AlertTriangle = createIcon('M12 9v4m0 3h.01');
export const Archive = createIcon('M5 8h14M6 8v10h12V8M10 12h4');
export const ArrowLeft = createIcon('M15 18l-6-6 6-6M9 12h10');
export const CheckCircle2 = createIcon('M8 12l3 3 5-6');
export const Eye = createIcon('M3 12s3-5 9-5 9 5 9 5-3 5-9 5-9-5-9-5zm9 0h.01');
export const FileText = createIcon('M8 6h6l3 3v9H8zM10 11h6M10 14h6');
export const FolderOpen = createIcon('M3 9h8l2-2h8v10H3z');
export const Image = createIcon('M5 7h14v10H5zM8 13l2-2 4 4 2-2 3 3');
export const Inbox = createIcon('M4 6h16v12h-5l-3 3-3-3H4z');
export const LayoutDashboard = createIcon('M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z');
export const Loader2 = createIcon('M12 3v4M12 17v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M3 12h4M17 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8');
export const Lock = createIcon('M8 11V8a4 4 0 118 0v3M7 11h10v9H7z');
export const LogIn = createIcon('M15 3h4v18h-4M10 8l-4 4 4 4M6 12h8');
export const LogOut = createIcon('M9 3H5v18h4M14 8l4 4-4 4M10 12h8');
export const Mail = createIcon('M4 7h16v10H4zM4 8l8 6 8-6');
export const Menu = createIcon('M5 8h14M5 12h14M5 16h14');
export const Pencil = createIcon('M4 20l4-1 9-9-3-3-9 9-1 4z');
export const Plus = createIcon('M12 7v10M7 12h10');
export const RotateCcw = createIcon('M7 7H3v4M4 10a8 8 0 101.5-4.5');
export const Save = createIcon('M6 4h10l4 4v12H4V4h2zm2 0v5h8V4M9 20v-6h6v6');
export const Settings = createIcon('M12 8a4 4 0 100 8 4 4 0 000-8zm0-5v3m0 12v3m9-9h-3M6 12H3m15.4 6.4l-2.1-2.1M7.7 7.7 5.6 5.6m12.8 0-2.1 2.1M7.7 16.3l-2.1 2.1');
export const ShieldCheck = createIcon('M12 3l7 3v6c0 4.5-3 7-7 9-4-2-7-4.5-7-9V6l7-3zm-3 9l2 2 4-4');
export const Trash2 = createIcon('M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12');
export const Upload = createIcon('M12 16V8M8 12l4-4 4 4M5 19h14');
export const UserCircle2 = createIcon('M12 12a3 3 0 100-6 3 3 0 000 6zm-6 8a6 6 0 0112 0');
export const UserRound = createIcon('M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0');
export const Users = createIcon('M16 11a3 3 0 100-6 3 3 0 000 6zM8 12a3 3 0 100-6 3 3 0 000 6zm-4 8a5 5 0 0110 0M13 20a5 5 0 018 0');
export const X = createIcon('M7 7l10 10M17 7 7 17');
