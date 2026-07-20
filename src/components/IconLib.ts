// Centralized icon library using Phosphor Icons (rounded, line-style).
// Provides named exports matching the names used by components,
// mapping each to the equivalent Phosphor icon.

import {
  List as PhList,
  X as PhX,
  Heart as PhHeart,
  ChatCircleDots as PhChatDots,
  User as PhUser,
  SignOut as PhSignOut,
  Bookmark as PhBookmark,
  MagnifyingGlass as PhSearch,
  Sparkle as PhSparkle,
  MapPin as PhMapPin,
  ShieldCheck as PhShield,
  ArrowRight as PhArrowRight,
  Warning as PhWarning,
  Phone as PhPhone,
  SlidersHorizontal as PhSliders,
  Star as PhStar,
  Clock as PhClock,
  Check as PhCheck,
  SmileySad as PhFrown,
  MapTrifold as PhMap,
  CurrencyDollar as PhDollar,
  Building as PhBuilding,
  Eye as PhEye,
  EyeSlash as PhEyeOff,
  SpinnerGap as PhSpinner,
  HeartStraight as PhHeartStraight,
  CaretDown as PhCaretDown,
  CaretUp as PhCaretUp,
  PaperPlaneTilt as PhSend,
  ThumbsUp as PhThumbsUp,
  WarningCircle as PhAlert,
  Question as PhQuestion,
  Tooth as PhTooth,
  Stethoscope as PhStethoscope,
  Brain as PhBrain,
  Pill as PhPill,
  Siren as PhSiren,
  FirstAidKit as PhFirstAid,
  Users as PhUsers,
  Bus as PhBus,
  Car as PhCar,
  VideoCamera as PhVideo,
  Microscope as PhMicroscope,
  Smiley as PhSmiley,
  Lifebuoy as PhLifebuoy,
  Handshake as PhHandshake,
  Scales as PhScale,
  Baby as PhBaby,
  Medal as PhMedal,
  FileText as PhFileText,
  Heartbeat as PhHeartbeat,
  Images as PhImages,
  EnvelopeSimple as PhMail,
} from '@phosphor-icons/react';

import type { IconProps } from '@phosphor-icons/react';
import { Funnel as PhFilter, Calendar as PhCalendar } from '@phosphor-icons/react';
import { Globe as PhGlobe, NavigationArrow as PhNavigation, Wheelchair as PhAccessibility, Translate as PhLanguages } from '@phosphor-icons/react';
type IconComp = React.ComponentType<IconProps & { weight?: 'regular' | 'bold' | 'fill' | 'thin' | 'light' | 'duotone' }>;

// Re-export all Phosphor icons we use with the names components expect
export const List: IconComp = PhList;
export const X: IconComp = PhX;
export const Heart: IconComp = PhHeart;
export const ChatCircleDots: IconComp = PhChatDots;
export const User: IconComp = PhUser;
export const SignOut: IconComp = PhSignOut;
export const Bookmark: IconComp = PhBookmark;
export const Search: IconComp = PhSearch;
export const Sparkles: IconComp = PhSparkle;
export const Sparkle: IconComp = PhSparkle;
export const MapPin: IconComp = PhMapPin;
export const ShieldCheck: IconComp = PhShield;
export const ArrowRight: IconComp = PhArrowRight;
export const Warning: IconComp = PhWarning;
export const Phone: IconComp = PhPhone;
export const PhoneCall: IconComp = PhPhone;
export const SlidersHorizontal: IconComp = PhSliders;
export const Star: IconComp = PhStar;
export const Clock: IconComp = PhClock;
export const Check: IconComp = PhCheck;
export const CheckCircle2: IconComp = PhCheck;
export const Frown: IconComp = PhFrown;
export const Map: IconComp = PhMap;
export const MapIcon = PhMap;
export const Mail: IconComp = PhMail;
export const ListIcon = PhList;
export const DollarSign: IconComp = PhDollar;
export const Building2: IconComp = PhBuilding;
export const Building: IconComp = PhBuilding;
export const Eye: IconComp = PhEye;
export const EyeOff: IconComp = PhEyeOff;
export const Loader2: IconComp = PhSpinner;
export const Activity: IconComp = PhHeartbeat;
export const HeartPulse: IconComp = PhHeartbeat;
export const BookmarkX: IconComp = PhHeartStraight;
export const ChevronDown: IconComp = PhCaretDown;
export const ChevronUp: IconComp = PhCaretUp;
export const Send: IconComp = PhSend;
export const ThumbsUp: IconComp = PhThumbsUp;
export const AlertCircle: IconComp = PhAlert;
export const HelpCircle: IconComp = PhQuestion;
export const Question: IconComp = PhQuestion;
export const MessageSquare: IconComp = PhChatDots;
export const Menu: IconComp = PhList;
export const Tooth: IconComp = PhTooth;
export const Stethoscope: IconComp = PhStethoscope;
export const Brain: IconComp = PhBrain;
export const Pill: IconComp = PhPill;
export const Siren: IconComp = PhSiren;
export const FirstAid: IconComp = PhFirstAid;
export const Users: IconComp = PhUsers;
export const Bus: IconComp = PhBus;
export const Car: IconComp = PhCar;
export const Video: IconComp = PhVideo;
export const Microscope: IconComp = PhMicroscope;
export const Smile: IconComp = PhSmiley;
export const LifeBuoy: IconComp = PhLifebuoy;
export const HandHeart: IconComp = PhHandshake;
export const HeartHandshake: IconComp = PhHandshake;
export const Scale: IconComp = PhScale;
export const Baby: IconComp = PhBaby;
export const Medal: IconComp = PhMedal;
export const FileText: IconComp = PhFileText;
export const Filter: IconComp = PhFilter;
export const Calendar: IconComp = PhCalendar;
export const Globe: IconComp = PhGlobe;
export const Navigation: IconComp = PhNavigation;
export const Accessibility: IconComp = PhAccessibility;
export const Languages: IconComp = PhLanguages;
export const Images: IconComp = PhImages;
