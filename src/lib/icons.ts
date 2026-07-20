import {
  Siren as PhSiren,
  FirstAidKit as PhFirstAid,
  Heartbeat as PhHeartbeat,
  Brain as PhBrain,
  VideoCamera as PhVideo,
  Microscope as PhMicroscope,
  Smiley as PhSmiley,
  Pill as PhPill,
  Pulse as PhActivity,
  Building as PhBuilding,
  Phone as PhPhone,
  Lifebuoy as PhLifebuoy,
  Handshake as PhHandshake,
  ShieldCheck as PhShield,
  Users as PhUsers,
  AppleLogo as PhApple,
  Bus as PhBus,
  FileText as PhFileText,
  Baby as PhBaby,
  Medal as PhMedal,
  Scales as PhScale,
  CarProfile as PhCar,
  Building as PhBuilding2,
  type IconProps,
} from '@phosphor-icons/react';

export type IconComponent = React.ComponentType<IconProps & { weight?: 'regular' | 'bold' | 'fill' | 'thin' | 'light' | 'duotone' }>;

const ICON_MAP: Record<string, IconComponent> = {
  Siren: PhSiren,
  Biohazard: PhSiren,
  Stethoscope: PhFirstAid,
  HeartPulse: PhHeartbeat,
  Brain: PhBrain,
  Video: PhVideo,
  Microscope: PhMicroscope,
  Smile: PhSmiley,
  Pill: PhPill,
  Activity: PhActivity,
  Building: PhBuilding,
  Phone: PhPhone,
  PhoneCall: PhPhone,
  LifeBuoy: PhLifebuoy,
  HeartHandshake: PhHandshake,
  Shield: PhShield,
  Users: PhUsers,
  Apple: PhApple,
  Bus: PhBus,
  FileText: PhFileText,
  Baby: PhBaby,
  Medal: PhMedal,
  Scale: PhScale,
  Car: PhCar,
  Building2: PhBuilding2,
};

const DEFAULT_ICON = PhBuilding;

export function getCategoryIcon(iconName: string): IconComponent {
  return ICON_MAP[iconName] ?? DEFAULT_ICON;
}

const COLOR_MAP: Record<string, { bg: string; text: string; bgSoft: string; border: string; ring: string; pastelBg: string; pastelText: string; pastelAccent: string }> = {
  red: {
    bg: 'bg-danger-600', text: 'text-danger-700', bgSoft: 'bg-danger-50',
    border: 'border-danger-200', ring: 'ring-danger-500/30',
    pastelBg: 'from-[#fde8e8] to-[#fbd5d5]', pastelText: 'text-[#9b2222]', pastelAccent: 'text-[#c83a3a]',
  },
  orange: {
    bg: 'bg-accent-600', text: 'text-accent-700', bgSoft: 'bg-accent-50',
    border: 'border-accent-200', ring: 'ring-accent-500/30',
    pastelBg: 'from-[#fef3e7] to-[#fde5cd]', pastelText: 'text-[#9a4a0c]', pastelAccent: 'text-[#c2670c]',
  },
  amber: {
    bg: 'bg-warning-500', text: 'text-warning-700', bgSoft: 'bg-warning-50',
    border: 'border-warning-200', ring: 'ring-warning-500/30',
    pastelBg: 'from-[#fef6e4] to-[#fdebc8]', pastelText: 'text-[#92660c]', pastelAccent: 'text-[#b8860c]',
  },
  emerald: {
    bg: 'bg-sage-600', text: 'text-sage-700', bgSoft: 'bg-sage-50',
    border: 'border-sage-200', ring: 'ring-sage-500/30',
    pastelBg: 'from-[#e8f6ee] to-[#d0ebdd]', pastelText: 'text-[#1a6248]', pastelAccent: 'text-[#2d8659]',
  },
  violet: {
    bg: 'bg-secondary-600', text: 'text-secondary-700', bgSoft: 'bg-secondary-50',
    border: 'border-secondary-200', ring: 'ring-secondary-500/30',
    pastelBg: 'from-[#eef0f8] to-[#dce0f0]', pastelText: 'text-[#3d4a7a]', pastelAccent: 'text-[#5660a0]',
  },
  sky: {
    bg: 'bg-secondary-600', text: 'text-secondary-700', bgSoft: 'bg-secondary-50',
    border: 'border-secondary-200', ring: 'ring-secondary-500/30',
    pastelBg: 'from-[#e8f0f6] to-[#d0e0ec]', pastelText: 'text-[#3d6a92]', pastelAccent: 'text-[#5685ac]',
  },
  indigo: {
    bg: 'bg-primary-700', text: 'text-primary-700', bgSoft: 'bg-primary-50',
    border: 'border-primary-200', ring: 'ring-primary-500/30',
    pastelBg: 'from-[#e8eaf2] to-[#d4d8e8]', pastelText: 'text-[#334155]', pastelAccent: 'text-[#475569]',
  },
  teal: {
    bg: 'bg-sage-600', text: 'text-sage-700', bgSoft: 'bg-sage-50',
    border: 'border-sage-200', ring: 'ring-sage-500/30',
    pastelBg: 'from-[#e4f4f1] to-[#c9e8e2]', pastelText: 'text-[#1a6b5f]', pastelAccent: 'text-[#2d8a7a]',
  },
  cyan: {
    bg: 'bg-secondary-600', text: 'text-secondary-700', bgSoft: 'bg-secondary-50',
    border: 'border-secondary-200', ring: 'ring-secondary-500/30',
    pastelBg: 'from-[#e6f2f5] to-[#cce5ea]', pastelText: 'text-[#3d7a8a]', pastelAccent: 'text-[#569aab]',
  },
  pink: {
    bg: 'bg-accent-600', text: 'text-accent-700', bgSoft: 'bg-accent-50',
    border: 'border-accent-200', ring: 'ring-accent-500/30',
    pastelBg: 'from-[#fdeef0] to-[#fbd9de]', pastelText: 'text-[#9a3a5c]', pastelAccent: 'text-[#c25a7a]',
  },
  slate: {
    bg: 'bg-primary-600', text: 'text-primary-700', bgSoft: 'bg-primary-50',
    border: 'border-primary-200', ring: 'ring-primary-500/30',
    pastelBg: 'from-[#eef1f5] to-[#dde3eb]', pastelText: 'text-[#475569]', pastelAccent: 'text-[#64748b]',
  },
  blue: {
    bg: 'bg-secondary-600', text: 'text-secondary-700', bgSoft: 'bg-secondary-50',
    border: 'border-secondary-200', ring: 'ring-secondary-500/30',
    pastelBg: 'from-[#e8eef6] to-[#d0dcee]', pastelText: 'text-[#3d5a8a]', pastelAccent: 'text-[#5675a8]',
  },
  green: {
    bg: 'bg-sage-600', text: 'text-sage-700', bgSoft: 'bg-sage-50',
    border: 'border-sage-200', ring: 'ring-sage-500/30',
    pastelBg: 'from-[#e8f6ee] to-[#d0ebdd]', pastelText: 'text-[#1a6248]', pastelAccent: 'text-[#2d8659]',
  },
  success: {
    bg: 'bg-sage-600', text: 'text-sage-700', bgSoft: 'bg-sage-50',
    border: 'border-sage-200', ring: 'ring-sage-500/30',
    pastelBg: 'from-[#e8f6ee] to-[#d0ebdd]', pastelText: 'text-[#1a6248]', pastelAccent: 'text-[#2d8659]',
  },
  danger: {
    bg: 'bg-danger-600', text: 'text-danger-700', bgSoft: 'bg-danger-50',
    border: 'border-danger-200', ring: 'ring-danger-500/30',
    pastelBg: 'from-[#fde8e8] to-[#fbd5d5]', pastelText: 'text-[#9b2222]', pastelAccent: 'text-[#c83a3a]',
  },
  primary: {
    bg: 'bg-primary-700', text: 'text-primary-700', bgSoft: 'bg-primary-50',
    border: 'border-primary-200', ring: 'ring-primary-500/30',
    pastelBg: 'from-[#e8eaf2] to-[#d4d8e8]', pastelText: 'text-[#334155]', pastelAccent: 'text-[#475569]',
  },
  secondary: {
    bg: 'bg-secondary-600', text: 'text-secondary-700', bgSoft: 'bg-secondary-50',
    border: 'border-secondary-200', ring: 'ring-secondary-500/30',
    pastelBg: 'from-[#eef0f8] to-[#dce0f0]', pastelText: 'text-[#3d4a7a]', pastelAccent: 'text-[#5660a0]',
  },
  accent: {
    bg: 'bg-accent-600', text: 'text-accent-700', bgSoft: 'bg-accent-50',
    border: 'border-accent-200', ring: 'ring-accent-500/30',
    pastelBg: 'from-[#fef3e7] to-[#fde5cd]', pastelText: 'text-[#9a4a0c]', pastelAccent: 'text-[#c2670c]',
  },
};

export function getCategoryColor(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.teal;
}
