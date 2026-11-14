import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { SOLAR_BODIES, SOLAR_BODY_DETAILS } from '../data/catalog';
import { TranslationDict } from '../i18n/translations';
import { Language } from '../types/game';

interface PlanetInfoCardProps {
  t: TranslationDict;
  language: Language;
  bodyId: string;
  touchEnabled?: boolean;
  onDismiss: () => void;
}

export const PlanetInfoCard: React.FC<PlanetInfoCardProps> = ({
  t,
  language,
  bodyId,
  touchEnabled = false,
  onDismiss,
}) => {
  const spec = SOLAR_BODIES.find((b) => b.id === bodyId);
  const details = SOLAR_BODY_DETAILS[bodyId];
  if (!spec || !details) return null;

  const name = language === 'ar' ? spec.nameAr : spec.nameEn;
  const typeText = language === 'ar' ? details.typeAr : details.typeEn;
  const facts = language === 'ar' ? details.factsAr : details.factsEn;

  const stats = [
    { label: t.planetInfo.distanceLabel, value: language === 'ar' ? details.distanceAr : details.distanceEn },
    { label: t.planetInfo.diameterLabel, value: language === 'ar' ? details.diameterAr : details.diameterEn },
    { label: t.planetInfo.dayLabel, value: language === 'ar' ? details.dayLengthAr : details.dayLengthEn },
    { label: t.planetInfo.yearLabel, value: language === 'ar' ? details.yearLengthAr : details.yearLengthEn },
    { label: t.planetInfo.moonsLabel, value: language === 'ar' ? details.moonsAr : details.moonsEn },
    { label: t.planetInfo.tempLabel, value: language === 'ar' ? details.tempAr : details.tempEn },
  ];

  const posClass = touchEnabled
    ? `top-24 sm:top-28 max-h-[55dvh] overflow-y-auto space-scroll ${
        language === 'ar' ? 'left-3 sm:left-5' : 'right-3 sm:right-5'
      }`
    : `bottom-24 max-h-[68dvh] overflow-y-auto space-scroll ${
        language === 'ar' ? 'left-3 sm:left-5' : 'right-3 sm:right-5'
      }`;

  return (
    <aside
      className={`pointer-events-auto fixed z-30 w-[calc(100vw-1.5rem)] max-w-sm rounded-3xl bg-[#181047]/95 border-2 border-cyan-400/55 p-3.5 sm:p-4 text-white shadow-2xl transition-all duration-300 ${posClass}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Procedural Planet Swatch / Illustration */}
          <svg width="58" height="58" viewBox="0 0 64 64" className="shrink-0 drop-shadow-md">
            <defs>
              <radialGradient id={`grad-${spec.id}`} cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor={spec.accentColor} />
                <stop offset="70%" stopColor={spec.color} />
                <stop offset="100%" stopColor="#0f172a" />
              </radialGradient>
            </defs>
            {spec.kind !== 'planet' && (
              <circle cx="32" cy="32" r="28" fill={spec.color} opacity="0.28" />
            )}
            <circle cx="32" cy="32" r="20" fill={`url(#grad-${spec.id})`} />
            {spec.hasRings && (
              <ellipse
                cx="32"
                cy="32"
                rx="30"
                ry="8"
                transform="rotate(-18 32 32)"
                fill="none"
                stroke="#fde68a"
                strokeWidth="3.5"
                opacity="0.88"
              />
            )}
            {spec.hasMoon && (
              <circle cx="54" cy="18" r="5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            )}
          </svg>

          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              {typeText}
            </div>
            <h3 className="font-display text-xl font-bold text-yellow-300 leading-tight truncate">
              {name}
            </h3>
          </div>
        </div>

        <button
          onClick={onDismiss}
          aria-label="Close"
          className="btn-chunky-sm rounded-xl bg-[#291d6b] border-indigo-950 p-1.5 text-indigo-100 cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {stats.map((st) => (
          <div key={st.label} className="rounded-xl bg-[#110a33] border border-indigo-400/20 px-2.5 py-1.5">
            <div className="text-[10px] font-bold text-indigo-300">{st.label}</div>
            <div className="text-xs font-bold text-white leading-snug">{st.value}</div>
          </div>
        ))}
      </div>

      {/* Fun Facts */}
      <div className="rounded-2xl bg-[#22165c] border border-pink-400/30 p-3">
        <div className="flex items-center gap-1.5 font-display text-xs font-bold text-pink-300 mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.planetInfo.factsTitle}</span>
        </div>
        <ul className="space-y-1 text-xs text-indigo-100 leading-snug">
          {facts.slice(0, 3).map((fact, idx) => (
            <li key={idx} className="flex gap-1.5">
              <span className="text-yellow-300 font-bold">•</span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};
