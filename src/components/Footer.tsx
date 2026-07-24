import { Activity, Phone, Heart, MapPin, MessageSquare, FileText, Mail } from './IconLib';
import type { Route } from '../lib/router';

interface FooterProps {
  onNavigate: (route: Route) => void;
  totalResources: number;
}

export function Footer({ onNavigate, totalResources }: FooterProps) {
  return (
    <footer className="bg-primary-700 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-white text-lg">FindCare</span>
            </div>
            <p className="mt-4 text-sm text-slate-300 max-w-md leading-relaxed font-serif-body">
              An AI-powered healthcare navigation platform connecting Washingtonians with
              affordable, accessible care and community resources. {totalResources.toLocaleString()}+ entries statewide.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              Serving 31 counties across Washington State
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-sage-300 mb-3 font-serif-body">Emergency Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="tel:911" className="hover:text-white transition-colors flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> 911 · Medical Emergency</a></li>
              <li><a href="tel:988" className="hover:text-white transition-colors flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> 988 · Crisis Lifeline</a></li>
              <li><a href="tel:12065262121" className="hover:text-white transition-colors flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Poison Center</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-sage-300 mb-3 font-serif-body">Get Involved</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => onNavigate({ name: 'request' })} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Request a Resource
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate({ name: 'feedback' })} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Leave Feedback
                </button>
              </li>
              <li>
                <a href="mailto:findcarewa@gmail.com" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Contact Us
                </a>
              </li>
              <li>
                <button onClick={() => onNavigate({ name: 'about' })} className="hover:text-white transition-colors">About FindCare</button>
              </li>
              <li>
                <button onClick={() => onNavigate({ name: 'how-it-works' })} className="hover:text-white transition-colors">How It Works</button>
              </li>
              <li>
                <button onClick={() => onNavigate({ name: 'symptoms' })} className="hover:text-white transition-colors">Symptom Guide</button>
              </li>
              <li>
                <button onClick={() => onNavigate({ name: 'locations' })} className="hover:text-white transition-colors">Browse by Location</button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            FindCare provides general guidance and is not a substitute for professional medical advice. In an emergency, call 911.
          </p>
          <p className="text-xs text-slate-400">Built for Washingtonians who deserve clear, compassionate care navigation.</p>
        </div>
      </div>
    </footer>
  );
}
