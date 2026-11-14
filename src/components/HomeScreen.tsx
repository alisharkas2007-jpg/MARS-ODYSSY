import React from 'react';
import {
  Compass,
  FlaskConical,
  Globe,
  HelpCircle,
  Play,
  Rocket,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { TranslationDict } from '../i18n/translations';
import { GraphicsQuality, Language, RealmId } from '../types/game';
import { PipAvatar } from './PipAvatar';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeScreenProps {
  t: TranslationDict;
  language: Language;
  muted: boolean;
  quality: GraphicsQuality;
  fps: number;
  isSoftwareGl: boolean;
  onPlay: (realm: RealmId) => void;
  onOpenHowTo: () => void;
  onOpenNasaLab: () => void;
  onToggleLanguage: () => void;
  onToggleMute: () => void;
  onCycleQuality: () => void;
}

const REALM_ORDER: RealmId[] = ['space', 'mars', 'solar'];

const REALM_STYLES: Record<RealmId, { bg: string; border: string; icon: React.ReactNode }> = {
  space: {
    bg: 'bg-cyan-500 text-slate-950',
    border: 'border-cyan-700',
    icon: <Rocket className="w-5 h-5" />,
  },
  mars: {
    bg: 'bg-emerald-400 text-slate-950',
    border: 'border-emerald-700',
    icon: <Sparkles className="w-5 h-5" />,
  },
  solar: {
    bg: 'bg-pink-400 text-slate-950',
    border: 'border-pink-700',
    icon: <Compass className="w-5 h-5" />,
  },
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  t,
  language,
  muted,
  quality,
  fps,
  onPlay,
  onOpenHowTo,
  onOpenNasaLab,
  onToggleLanguage,
  onToggleMute,
  onCycleQuality,
}) => {
  const qualityLabel =
    quality === 'ultra'
      ? t.hud.qualityUltra
      : quality === 'high'
        ? t.hud.qualityHigh
        : t.hud.qualityBalanced;

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between pointer-events-none safe-screen-pad sm:p-6 overflow-y-auto space-scroll">
      {/* Decorative Twinkling Stars & Shooting Stars */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <span className="animate-twinkle absolute top-14 left-[12%] w-2 h-2 rounded-full bg-yellow-300" />
        <span className="animate-twinkle absolute top-28 right-[18%] w-2.5 h-2.5 rounded-full bg-cyan-300" style={{ animationDelay: '0.8s' }} />
        <span className="animate-twinkle absolute bottom-32 left-[22%] w-2 h-2 rounded-full bg-pink-300" style={{ animationDelay: '1.5s' }} />
        <span className="animate-shooting-star absolute top-12 left-0 w-24 h-0.5 bg-gradient-to-r from-transparent via-yellow-200 to-white rounded-full" />
      </div>

      {/* Top Controls Row */}
      <header className="relative z-10 flex items-center justify-between gap-2 sm:gap-4 pointer-events-auto flex-wrap">
        <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-[#1a114a]/90 border-2 border-indigo-400/35 px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg">
          <PipAvatar size={34} />
          <span className="font-display text-sm sm:text-lg font-bold tracking-wide text-cyan-300 whitespace-nowrap">
            {t.appTitle}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <PWAInstallButton t={t} compact />

          <button
            onClick={onCycleQuality}
            className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-2xl bg-[#271b66] border-indigo-900 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-bold text-indigo-100 cursor-pointer whitespace-nowrap tabular-nums"
          >
            <span>{t.hud.quality}: {qualityLabel} · {fps} Hz</span>
          </button>

          <button
            onClick={onToggleLanguage}
            className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-2xl bg-[#271b66] border-indigo-900 px-3.5 py-2 text-xs sm:text-sm font-bold text-cyan-200 cursor-pointer whitespace-nowrap"
          >
            <Globe className="w-4 h-4" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>

          <button
            onClick={onToggleMute}
            aria-label={muted ? t.hud.unmute : t.hud.mute}
            className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-2xl bg-[#271b66] border-indigo-900 px-3.5 py-2 text-xs sm:text-sm font-bold text-yellow-200 cursor-pointer whitespace-nowrap"
          >
            {muted ? <VolumeX className="w-4 h-4 text-pink-300" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
            <span className="hidden sm:inline">{muted ? t.hud.unmute : t.hud.mute}</span>
          </button>
        </div>
      </header>

      {/* Hero Center Title & Big PLAY CTA (kept compact so 3D diorama shines behind) */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-2">
        <div className="pointer-events-auto max-w-2xl px-4">
          <h1
            className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-[0_6px_0_rgba(18,11,54,0.95)]"
            style={{ textWrap: 'balance' }}
          >
            <span className="text-yellow-300">{t.appTitle}</span>
          </h1>
          <p className="mt-2 font-display text-lg sm:text-2xl font-semibold text-cyan-200 drop-shadow-[0_3px_0_rgba(18,11,54,0.9)]">
            {t.appTagline}
          </p>

          <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onPlay('space')}
              className="btn-chunky inline-flex items-center gap-3 rounded-3xl bg-emerald-400 border-emerald-700 px-8 sm:px-10 py-3.5 sm:py-4 font-display text-xl sm:text-2xl font-bold text-slate-950 shadow-2xl cursor-pointer whitespace-nowrap"
            >
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-slate-950" />
              <span>{t.playBtn}</span>
            </button>

            <button
              onClick={onOpenHowTo}
              className="btn-chunky inline-flex items-center gap-2 rounded-3xl bg-[#2c1f70] border-indigo-950 px-5 sm:px-6 py-3.5 sm:py-4 font-display text-base sm:text-lg font-bold text-white shadow-xl cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="w-5 h-5 text-yellow-300" />
              <span>{t.howToPlay}</span>
            </button>

            <button
              onClick={onOpenNasaLab}
              className="btn-chunky inline-flex items-center gap-2 rounded-3xl bg-cyan-400 border-cyan-700 px-5 sm:px-6 py-3.5 sm:py-4 font-display text-base sm:text-lg font-bold text-slate-950 shadow-xl cursor-pointer whitespace-nowrap"
            >
              <FlaskConical className="w-5 h-5" />
              <span>{t.nasaLab.btnLabel}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Choose Adventure Row of 3 World Chips */}
      <footer className="relative z-10 pointer-events-auto mx-auto w-full max-w-4xl rounded-3xl bg-[#191046]/92 border-2 border-indigo-400/35 p-3 sm:p-4 shadow-2xl">
        <div className="text-center font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-200 mb-2.5">
          {t.chooseAdventure}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {REALM_ORDER.map((rId) => {
            const st = REALM_STYLES[rId];
            const info = t.realms[rId];
            return (
              <button
                key={rId}
                onClick={() => onPlay(rId)}
                className={`btn-chunky flex flex-col items-start text-start rounded-2xl ${st.bg} ${st.border} px-4 py-3 cursor-pointer`}
              >
                <div className="flex items-center gap-2 font-display text-sm sm:text-base font-bold">
                  {st.icon}
                  <span className="whitespace-nowrap">{info.name}</span>
                </div>
                <span className="mt-1 text-xs font-bold opacity-85 line-clamp-2 leading-snug">
                  {info.desc}
                </span>
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
