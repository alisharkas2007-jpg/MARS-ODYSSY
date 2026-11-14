import React from 'react';
import {
  BookOpen,
  Compass,
  FlaskConical,
  Gamepad,
  Globe,
  Home,
  Keyboard,
  Play,
  Rocket,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { SCIENCE_FACTS } from '../data/catalog';
import { TranslationDict } from '../i18n/translations';
import { GameProgress, Language, RealmId } from '../types/game';
import { PWAInstallButton } from './PWAInstallButton';

interface ControlCenterDrawerProps {
  t: TranslationDict;
  language: Language;
  progress: GameProgress;
  muted: boolean;
  touchEnabled: boolean;
  onClose: () => void;
  onSwitchRealm: (realm: RealmId) => void;
  onOpenShop: () => void;
  onOpenSpaceBook: () => void;
  onOpenStarMap: () => void;
  onOpenChallenges: () => void;
  onOpenNasaLab: () => void;
  onCycleQuality: () => void;
  onToggleMute: () => void;
  onToggleLanguage: () => void;
  onToggleTouch: () => void;
  onShowControls: () => void;
  onRestart: () => void;
  onHome: () => void;
}

const REALMS: RealmId[] = ['space', 'mars', 'solar'];

export const ControlCenterDrawer: React.FC<ControlCenterDrawerProps> = ({
  t,
  language,
  progress,
  muted,
  touchEnabled,
  onClose,
  onSwitchRealm,
  onOpenShop,
  onOpenSpaceBook,
  onOpenStarMap,
  onOpenChallenges,
  onOpenNasaLab,
  onCycleQuality,
  onToggleMute,
  onToggleLanguage,
  onToggleTouch,
  onShowControls,
  onRestart,
  onHome,
}) => {
  const qualityLabel =
    progress.quality === 'ultra'
      ? t.hud.qualityUltra
      : progress.quality === 'high'
        ? t.hud.qualityHigh
        : t.hud.qualityBalanced;

  const renderMissionSummary = () => {
    if (progress.realm === 'space') {
      return `${t.missions.spaceCrystals}: ${progress.space.crystals}/${progress.space.totalCrystals} · ${t.missions.spaceRescued}: ${progress.space.rescued}/${progress.space.totalAstronauts}`;
    }
    if (progress.realm === 'mars') {
      return `${t.missions.marsIce}: ${progress.mars.ice}/${progress.mars.totalIce} · ${t.missions.marsOxygen}: ${progress.mars.oxygenTanks}/${progress.mars.totalOxygenTanks} · ${t.missions.marsStations}: ${progress.mars.stationsRepaired}/${progress.mars.totalStations}`;
    }
    return `${t.missions.solarDiscovered}: ${progress.solar.discoveredIds.length}/${progress.solar.totalBodies}`;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/65 p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-[#181047] border-2 border-cyan-400/55 p-4 sm:p-6 text-white shadow-2xl animate-[slideDown_180ms_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-indigo-400/25 mb-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-yellow-300">
              {t.controlCenter.title}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200">{t.controlCenter.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 border-emerald-700 px-4 py-2 font-display text-xs sm:text-sm font-bold text-slate-950 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{t.hud.resume}</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="btn-chunky-sm rounded-xl bg-[#291d6b] border-indigo-950 p-2 text-indigo-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Realms + Mission Summary */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
              {t.controlCenter.realmsLabel}
            </span>
            <span className="text-xs font-bold text-indigo-100 tabular-nums">
              {t.controlCenter.missionProgress}: <strong className="text-yellow-300">{renderMissionSummary()}</strong>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
            {REALMS.map((rId) => {
              const active = progress.realm === rId;
              const done = progress[rId].completed;
              return (
                <button
                  key={rId}
                  onClick={() => {
                    onSwitchRealm(rId);
                    onClose();
                  }}
                  className={`btn-chunky-sm flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 font-display text-xs sm:text-sm font-bold cursor-pointer ${
                    active
                      ? 'bg-cyan-400 border-cyan-700 text-slate-950'
                      : 'bg-[#261a66] border-indigo-950 text-white'
                  }`}
                >
                  {rId === 'space' && <Rocket className="w-4 h-4" />}
                  {rId === 'mars' && <Sparkles className="w-4 h-4" />}
                  {rId === 'solar' && <Compass className="w-4 h-4" />}
                  <span>{t.realms[rId].name}</span>
                  {done && <span className="text-emerald-600 font-black">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Explorer Tools */}
        <div className="mb-4">
          <div className="font-display text-xs font-bold uppercase tracking-wider text-pink-300 mb-2">
            {t.controlCenter.toolsLabel}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenShop();
              }}
              className="btn-chunky-sm flex items-center justify-center gap-1.5 rounded-xl bg-yellow-400 border-amber-600 px-3 py-2.5 font-display text-xs font-bold text-slate-950 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.hud.shop}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenSpaceBook();
              }}
              className="btn-chunky-sm flex items-center justify-center gap-1.5 rounded-xl bg-emerald-400 border-emerald-700 px-3 py-2.5 font-display text-xs font-bold text-slate-950 cursor-pointer tabular-nums"
            >
              <BookOpen className="w-4 h-4" />
              <span>{t.hud.spaceBook} {progress.unlockedFactIds.length}/{SCIENCE_FACTS.length}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenStarMap();
              }}
              className="btn-chunky-sm flex items-center justify-center gap-1.5 rounded-xl bg-pink-400 border-pink-700 px-3 py-2.5 font-display text-xs font-bold text-slate-950 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>{t.hud.starMap}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenChallenges();
              }}
              className="btn-chunky-sm flex items-center justify-center gap-1.5 rounded-xl bg-amber-300 border-amber-600 px-3 py-2.5 font-display text-xs font-bold text-slate-950 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>{t.hud.challenges}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenNasaLab();
              }}
              className="btn-chunky-sm col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 rounded-xl bg-cyan-400 border-cyan-700 px-3 py-2.5 font-display text-xs font-bold text-slate-950 cursor-pointer"
            >
              <FlaskConical className="w-4 h-4" />
              <span>{t.nasaLab.btnLabel}</span>
            </button>
          </div>
        </div>

        {/* Settings & Actions */}
        <div>
          <div className="font-display text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
            {t.controlCenter.settingsLabel}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onCycleQuality}
              className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-[#271b66] border-indigo-950 px-3 py-2 text-xs font-bold text-emerald-200 cursor-pointer tabular-nums"
            >
              <span>{t.hud.quality}: {qualityLabel} · {progress.fps} Hz</span>
            </button>

            <button
              onClick={onToggleMute}
              className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-[#271b66] border-indigo-950 px-3 py-2 text-xs font-bold text-white cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4 text-pink-300" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
              <span>{muted ? t.hud.unmute : t.hud.mute}</span>
            </button>

            <button
              onClick={onToggleLanguage}
              className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-[#271b66] border-indigo-950 px-3 py-2 text-xs font-bold text-cyan-200 cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <button
              onClick={onToggleTouch}
              className={`btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer ${
                touchEnabled ? 'bg-cyan-400 border-cyan-700 text-slate-950' : 'bg-[#271b66] border-indigo-950 text-indigo-100'
              }`}
            >
              <Gamepad className="w-4 h-4" />
              <span>{touchEnabled ? t.hud.touchOn : t.hud.touchOff}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onShowControls();
              }}
              className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-[#271b66] border-indigo-950 px-3 py-2 text-xs font-bold text-yellow-200 cursor-pointer"
            >
              <Keyboard className="w-4 h-4" />
              <span>{t.hud.showControls}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onRestart();
              }}
              className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-[#271b66] border-indigo-950 px-3 py-2 text-xs font-bold text-amber-300 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.hud.restart}</span>
            </button>

            <button
              onClick={onHome}
              className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-[#271b66] border-indigo-950 px-3 py-2 text-xs font-bold text-pink-200 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>{t.hud.home}</span>
            </button>

            <PWAInstallButton t={t} compact />
          </div>
        </div>

        <div className="mt-4 pt-2.5 border-t border-indigo-400/20 text-center text-[11px] font-bold text-indigo-300">
          {t.controlCenter.escHint}
        </div>
      </div>
    </div>
  );
};
