import type { FC, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };
export type LucideIcon = FC<IconProps>;

const createIcon = (): LucideIcon => ({ size = 20, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export const ArrowRight = createIcon();
export const Award = createIcon();
export const BriefcaseBusiness = createIcon();
export const Sparkles = createIcon();
export const Users = createIcon();
export const Box = createIcon();
export const Code = createIcon();
export const Megaphone = createIcon();
export const Palette = createIcon();
export const Video = createIcon();
export const Calendar = createIcon();
export const User = createIcon();
export const Clock = createIcon();
export const Tag = createIcon();
export const Search = createIcon();
export const ArrowLeft = createIcon();
export const Check = createIcon();
export const Quote = createIcon();
export const ExternalLink = createIcon();
export const Filter = createIcon();
export const ArrowDown = createIcon();
export const Facebook = createIcon();
export const Twitter = createIcon();
export const Instagram = createIcon();
export const Linkedin = createIcon();
export const Copy = createIcon();
export const Share2 = createIcon();
export const Mail = createIcon();
export const Phone = createIcon();
export const MapPin = createIcon();
export const Send = createIcon();
export const Lock = createIcon();
export const LogIn = createIcon();
export const UserCircle2 = createIcon();
export const ShieldCheck = createIcon();
export const BadgeCheck = createIcon();
export const AlertTriangle = createIcon();
export const RefreshCcw = createIcon();
export const AlertCircle = createIcon();
export const CheckCircle2 = createIcon();
export const CheckCircle = createIcon();
export const Pen = createIcon();
export const Layout = createIcon();
export const Smartphone = createIcon();
export const ShoppingCart = createIcon();
export const Zap = createIcon();
export const Layers = createIcon();
export const Home = createIcon();
export const Info = createIcon();
export const Briefcase = createIcon();
export const FolderOpen = createIcon();
export const BookOpen = createIcon();
export const LayoutDashboard = createIcon();
export const Clock3 = createIcon();
export const UserPlus = createIcon();
export const Youtube = createIcon();
export const Globe2 = createIcon();
export const MessageCircle = createIcon();
export const Music2 = createIcon();
export const Ghost = createIcon();
