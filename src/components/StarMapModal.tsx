import React from 'react';
import { Compass, Sparkles, Star, X } from 'lucide-react';
import { SOLAR_BODIES } from '../data/catalog';
import { TranslationDict } from '../i18n/translations';
import { Language } from '../types/game';

interface StarMapModalProps {
  t: TranslationDict;
  language: Language;
  discoveredIds: string[];
  onWarp: (bodyId: string) => void;
  onClose: () => void;
}

export const StarMapModal: React.FC<StarMapModalProps> = ({
  t,
  language,
  discoveredIds,
  onWarp,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#1b124d] border-2 border-pink-400/50 p-5 sm:p-7 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-pink-400 text-slate-950">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-yellow-300">
                {t.starMap.title}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200">{t.starMap.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn-chunky-sm rounded-xl bg-[#2c1f70] border-indigo-950 p-2 text-indigo-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-scroll pr-1 grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Interactive 2D Map Diagram */}
          <div className="lg:col-span-3 rounded-2xl bg-[#0e082b] border border-indigo-400/30 p-3 flex items-center justify-center">
            <svg viewBox="-300 -300 600 600" className="w-full max-w-[420px] aspect-square">
              {/* Orbit rings */}
              {SOLAR_BODIES.filter((b) => b.kind === 'planet').map((planet) => (
                <circle
                  key={`orbit_${planet.id}`}
                  cx={0}
                  cy={0}
                  r={planet.distance * 0.92}
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.22)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Bodies */}
              {SOLAR_BODIES.map((body) => {
                const scale = 0.92;
                const x = Math.cos(body.angle) * body.distance * scale;
                const y = Math.sin(body.angle) * body.distance * scale;
                const disc = discoveredIds.includes(body.id);
                const r =
                  body.kind === 'sun'
                    ? 18
                    : body.kind === 'star'
                      ? 11
                      : Math.max(6.5, body.radius * 1.5);

                return (
                  <g
                    key={body.id}
                    onClick={() => onWarp(body.id)}
                    className="cursor-pointer group"
                  >
                    {disc && (
                      <circle
                        cx={x}
                        cy={y}
                        r={r + 5}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2"
                      />
                    )}
                    {body.hasRings && (
                      <ellipse
                        cx={x}
                        cy={y}
                        rx={r * 1.9}
                        ry={r * 0.55}
                        fill="none"
                        stroke="#fef08a"
                        strokeWidth="2.5"
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={r}
                      fill={body.color}
                      stroke="#ffffff"
                      strokeWidth={disc ? 2 : 1}
                    />
                    <text
                      x={x}
                      y={y + r + 14}
                      textAnchor="middle"
                      fill={disc ? '#a7f3d0' : '#e0e7ff'}
                      fontSize="11"
                      fontWeight="700"
                    >
                      {language === 'ar' ? body.nameAr : body.nameEn}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Warp Directory List */}
          <div className="lg:col-span-2 flex flex-col gap-2 max-h-[420px] overflow-y-auto space-scroll pr-1">
            {SOLAR_BODIES.map((body) => {
              const disc = discoveredIds.includes(body.id);
              const kindLabel =
                body.kind === 'sun'
                  ? t.starMap.sun
                  : body.kind === 'star'
                    ? t.starMap.star
                    : t.starMap.planet;

              return (
                <button
                  key={body.id}
                  onClick={() => onWarp(body.id)}
                  className={`btn-chunky-sm flex items-center justify-between gap-3 rounded-2xl p-3 text-start cursor-pointer ${
                    disc
                      ? 'bg-[#281b6e] border-emerald-600'
                      : 'bg-[#211559] border-indigo-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-7 h-7 rounded-full shrink-0 border-2 border-white/50 flex items-center justify-center"
                      style={{ backgroundColor: body.color }}
                    >
                      {body.kind === 'star' ? (
                        <Star className="w-3.5 h-3.5 text-slate-950" />
                      ) : body.kind === 'sun' ? (
                        <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      ) : null}
                    </span>
                    <div className="min-w-0">
                      <div className="font-display text-sm font-bold text-white truncate">
                        {language === 'ar' ? body.nameAr : body.nameEn}
                      </div>
                      <div className="text-[11px] text-indigo-200 truncate">
                        {kindLabel} · {disc ? t.starMap.discovered : t.starMap.undiscovered}
                      </div>
                    </div>
                  </div>
                  <span className="rounded-xl bg-cyan-400 px-2.5 py-1 font-display text-xs font-bold text-slate-950 whitespace-nowrap shrink-0">
                    {t.starMap.warp}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
