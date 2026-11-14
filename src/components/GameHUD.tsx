import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Coins,
  Flame,
  Menu,
  Radar,
  Shield,
  Star,
  Trophy,
  Wind,
  XCircle,
  Zap,
} from 'lucide-react';
import { CHALLENGE_CATALOG, CONSUMABLE_CATALOG, SOLAR_BODIES } from '../data/catalog';
import { formatMsg, TranslationDict } from '../i18n/translations';
import {
  ConsumableId,
  GameProgress,
  Language,
  ToastPayload,
} from '../types/game';
import { PipAvatar } from './PipAvatar';

interface GameHUDProps {
  t: TranslationDict;
  language: Language;
  progress: GameProgress;
  touchEnabled: boolean;
  controlsHintVisible: boolean;
  toasts: ToastPayload[];
  onToggleVehicle: () => void;
  onTriggerAction: () => void;
  onTriggerScanner: () => void;
  onUseConsumable: (id: ConsumableId) => void;
  onOpenChallenges: () => void;
  onOpenControlCenter: () => void;
  onCancelChallenge: () => void;
  onTouchInput: (moveX: number, moveY: number, up: boolean, down: boolean, boost: boolean) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  t,
  language,
  progress,
  touchEnabled,
  controlsHintVisible,
  toasts,
  onToggleVehicle,
  onTriggerAction,
  onTriggerScanner,
  onUseConsumable,
  onOpenChallenges,
  onOpenControlCenter,
  onCancelChallenge,
  onTouchInput,
}) => {
  const joyRef = useRef<HTMLDivElement | null>(null);
  const joyActiveRef = useRef(false);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const touchStateRef = useRef({ moveX: 0, moveY: 0, up: false, down: false, boost: false });

  const pushTouch = (partial: Partial<typeof touchStateRef.current>) => {
    touchStateRef.current = { ...touchStateRef.current, ...partial };
    const s = touchStateRef.current;
    onTouchInput(s.moveX, s.moveY, s.up, s.down, s.boost);
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joyRef.current) return;
    const rect = joyRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoyKnob({ x: dx, y: dy });
    pushTouch({ moveX: dx / maxR, moveY: dy / maxR });
  };

  const renderMissionStats = () => {
    const r = progress.realm;
    if (r === 'space') {
      return (
        <>
          <span>
            {t.missions.spaceCrystals}: <strong className="text-cyan-300">{progress.space.crystals}/{progress.space.totalCrystals}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t.missions.spaceRescued}: <strong className="text-emerald-300">{progress.space.rescued}/{progress.space.totalAstronauts}</strong>
          </span>
          {progress.space.carryingCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-yellow-300 font-bold">
                {t.hud.carrying}: {progress.space.carryingCount}
              </span>
            </>
          )}
        </>
      );
    }
    if (r === 'mars') {
      return (
        <>
          <span>
            {t.missions.marsIce}: <strong className="text-cyan-300">{progress.mars.ice}/{progress.mars.totalIce}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t.missions.marsOxygen}: <strong className="text-emerald-300">{progress.mars.oxygenTanks}/{progress.mars.totalOxygenTanks}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t.missions.marsStations}: <strong className="text-yellow-300">{progress.mars.stationsRepaired}/{progress.mars.totalStations}</strong>
          </span>
        </>
      );
    }
    return (
      <span>
        {t.missions.solarDiscovered}: <strong className="text-pink-300">{progress.solar.discoveredIds.length}/{progress.solar.totalBodies}</strong>
      </span>
    );
  };

  const getActionPrompt = (): { label: string; colorClass: string; onClick: () => void } | null => {
    if (progress.realm === 'space') {
      if (progress.space.nearDock && progress.space.carryingCount > 0) {
        return { label: t.hud.deliver, colorClass: 'bg-emerald-400 border-emerald-700 text-slate-950', onClick: onTriggerAction };
      }
      if (progress.space.nearAstronaut) {
        return { label: t.hud.pickup, colorClass: 'bg-yellow-400 border-amber-600 text-slate-950', onClick: onTriggerAction };
      }
    } else if (progress.realm === 'mars' && progress.mars.nearStation) {
      return { label: t.hud.repair, colorClass: 'bg-emerald-400 border-emerald-700 text-slate-950', onClick: onTriggerAction };
    }
    return null;
  };

  const contextAction = getActionPrompt();
  const pipHint = t.pipHints[progress.pipHintKey] || t.pipHints.space_default;

  const activeSpec = progress.activeChallenge
    ? CHALLENGE_CATALOG.find((c) => c.id === progress.activeChallenge?.id)
    : null;
  const nextPlanetSpec = progress.activeChallenge?.nextPlanetId
    ? SOLAR_BODIES.find((b) => b.id === progress.activeChallenge?.nextPlanetId)
    : null;

  const controlsHintText = touchEnabled
    ? t.controlsHints.touch
    : t.controlsHints[progress.realm];

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between safe-screen-pad sm:p-4">
      {/* TOP MINIMAL HUD ROW */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {/* Top-Start: Vital Bars + Objective Pill + Pip Hint */}
        <div className="flex flex-col gap-1.5 sm:gap-2 items-start min-w-0">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2 sm:gap-3 rounded-2xl bg-[#181047]/90 border-2 border-indigo-400/35 px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-14 sm:w-24">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-cyan-200 tabular-nums">
                  <span className="inline-flex items-center gap-0.5 sm:gap-1"><Wind className="w-3 h-3 shrink-0" /><span className="hidden sm:inline">{t.hud.oxygen}</span><span className="sm:hidden">O2</span></span>
                  <span>{Math.round(progress.oxygen)}%</span>
                </div>
                <div className="h-1.5 sm:h-2 rounded-full bg-[#0c0726] overflow-hidden mt-0.5">
                  <div className="h-full bg-cyan-400 transition-all duration-150" style={{ width: `${progress.oxygen}%` }} />
                </div>
              </div>

              <div className="w-14 sm:w-24">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-emerald-200 tabular-nums">
                  <span className="inline-flex items-center gap-0.5 sm:gap-1"><Shield className="w-3 h-3 shrink-0" /><span className="hidden sm:inline">{t.hud.shield}</span><span className="sm:hidden">SH</span></span>
                  <span>{Math.round(progress.shield)}%</span>
                </div>
                <div className="h-1.5 sm:h-2 rounded-full bg-[#0c0726] overflow-hidden mt-0.5">
                  <div className="h-full bg-emerald-400 transition-all duration-150" style={{ width: `${progress.shield}%` }} />
                </div>
              </div>

              <div className="w-14 sm:w-24">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-yellow-200 tabular-nums">
                  <span className="inline-flex items-center gap-0.5 sm:gap-1"><Flame className="w-3 h-3 shrink-0" /><span className="hidden sm:inline">{t.hud.fuel}</span><span className="sm:hidden">FL</span></span>
                  <span>{Math.round(progress.fuel)}%</span>
                </div>
                <div className="h-1.5 sm:h-2 rounded-full bg-[#0c0726] overflow-hidden mt-0.5">
                  <div className="h-full bg-yellow-400 transition-all duration-150" style={{ width: `${progress.fuel}%` }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-indigo-100 tabular-nums border-s border-indigo-400/25 ps-2 sm:ps-2.5">
              {renderMissionStats()}
            </div>
          </div>

          {/* Pip the Space Bot Compact Hint */}
          <div className="pointer-events-auto max-w-[210px] sm:max-w-xs rounded-2xl bg-[#1b124d]/90 border-2 border-cyan-400/45 p-1.5 sm:p-2 shadow-xl flex items-center gap-2">
            <PipAvatar size={32} />
            <div className="min-w-0">
              <div className="font-display text-[10px] sm:text-[11px] font-bold text-yellow-300 leading-none mb-0.5">{t.pipName}</div>
              <p className="text-[11px] sm:text-xs font-semibold text-white leading-snug line-clamp-2">{pipHint}</p>
            </div>
          </div>
        </div>

        {/* Top-End: Score & Credits Chip + Challenges + Menu(ESC) + Active Challenge + Toasts */}
        <div className="flex flex-col items-end gap-2">
          <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <div className="flex items-center gap-2.5 rounded-2xl bg-[#181047]/90 border-2 border-indigo-400/35 px-3 py-1.5 text-xs sm:text-sm font-bold tabular-nums shadow-xl">
              <span className="inline-flex items-center gap-1 text-yellow-300">
                <Star className="w-4 h-4 fill-yellow-300" />
                <span>{progress.score}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-amber-200">
                <Coins className="w-4 h-4" />
                <span>{progress.credits}</span>
              </span>
              {progress.amplifierCharges > 0 && (
                <span className="text-pink-300 font-display text-xs">
                  {t.hud.ampActive} ({progress.amplifierCharges})
                </span>
              )}
            </div>

            <button
              onClick={onOpenChallenges}
              className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-amber-300 border-amber-600 px-2.5 sm:px-3 py-1.5 font-display text-xs font-bold text-slate-950 cursor-pointer whitespace-nowrap shadow-xl"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.hud.challenges}</span>
            </button>

            <button
              onClick={onOpenControlCenter}
              className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-[#291d6b] border-indigo-950 px-3 py-1.5 font-display text-xs font-bold text-white cursor-pointer whitespace-nowrap shadow-xl"
            >
              <Menu className="w-4 h-4 text-cyan-300" />
              <span>{t.hud.menuBtn}</span>
              <span className="hidden sm:inline text-[10px] text-indigo-300">(ESC)</span>
            </button>
          </div>

          {/* Active Side Challenge Chip */}
          {progress.activeChallenge && activeSpec && (
            <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-[#1c1354]/95 border-2 border-yellow-400/70 px-3 py-1.5 text-xs font-bold text-white shadow-xl tabular-nums">
              <Trophy className="w-4 h-4 text-yellow-300 shrink-0" />
              <div>
                <div className="font-display text-yellow-300 leading-tight">
                  {language === 'ar' ? activeSpec.titleAr : activeSpec.titleEn}
                </div>
                <div className="text-[11px] text-cyan-200 flex items-center gap-2">
                  <span>
                    {progress.activeChallenge.progress}/{progress.activeChallenge.target}
                  </span>
                  {progress.activeChallenge.timeRemaining > 0 && (
                    <span className="text-pink-300">
                      · {Math.ceil(progress.activeChallenge.timeRemaining)}s
                    </span>
                  )}
                  {progress.activeChallenge.id === 'space_crystal_chain' && progress.activeChallenge.auxTimer > 0 && (
                    <span className="text-pink-300">
                      · {progress.activeChallenge.auxTimer.toFixed(1)}s
                    </span>
                  )}
                  {nextPlanetSpec && (
                    <span className="text-emerald-300">
                      · {t.challenges.nextTarget}: {language === 'ar' ? nextPlanetSpec.nameAr : nextPlanetSpec.nameEn}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onCancelChallenge}
                title={t.challenges.cancelBtn}
                className="text-pink-300 hover:text-pink-200 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Toast Messages */}
          <div className="flex flex-col items-end gap-1.5 max-w-xs">
            {toasts.slice(-3).map((toast) => {
              const msgTemplate = t.toasts[toast.textKey] || toast.textKey;
              const text = formatMsg(msgTemplate, toast.params);
              const toneStyle =
                toast.tone === 'success'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-700'
                  : toast.tone === 'warning'
                    ? 'bg-amber-400 text-slate-950 border-amber-600'
                    : toast.tone === 'fact'
                      ? 'bg-pink-400 text-slate-950 border-pink-700'
                      : 'bg-cyan-400 text-slate-950 border-cyan-700';

              return (
                <div
                  key={toast.id}
                  className={`rounded-2xl border-b-4 px-3.5 py-2 font-display text-xs sm:text-sm font-bold shadow-xl ${toneStyle}`}
                >
                  {text}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM LAYER: Touch Controls + Contextual Action Dock + 5s Fading Controls Bar */}
      <div className="flex flex-col gap-2">
        {touchEnabled && (
          <div className="flex items-end justify-between gap-4 px-1 pb-1">
            <div
              ref={joyRef}
              onPointerDown={(e) => {
                joyActiveRef.current = true;
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                updateJoystick(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (joyActiveRef.current) updateJoystick(e.clientX, e.clientY);
              }}
              onPointerUp={() => {
                joyActiveRef.current = false;
                setJoyKnob({ x: 0, y: 0 });
                pushTouch({ moveX: 0, moveY: 0 });
              }}
              onPointerCancel={() => {
                joyActiveRef.current = false;
                setJoyKnob({ x: 0, y: 0 });
                pushTouch({ moveX: 0, moveY: 0 });
              }}
              className="pointer-events-auto relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#1b124d]/85 border-2 border-cyan-400/60 flex items-center justify-center touch-none shadow-2xl"
            >
              <div
                className="w-12 h-12 rounded-full bg-cyan-400 border-b-4 border-cyan-700 shadow-lg"
                style={{ transform: `translate3d(${joyKnob.x}px, ${joyKnob.y}px, 0)` }}
              />
            </div>

            <div className="pointer-events-auto grid grid-cols-2 gap-2">
              <button
                onPointerDown={() => pushTouch({ up: true })}
                onPointerUp={() => pushTouch({ up: false })}
                onPointerCancel={() => pushTouch({ up: false })}
                className="btn-chunky-sm flex items-center justify-center gap-1 rounded-2xl bg-cyan-400 border-cyan-700 px-3.5 py-3 font-display text-xs font-bold text-slate-950"
              >
                <ArrowUp className="w-4 h-4" />
                <span>UP</span>
              </button>

              <button
                onPointerDown={() => pushTouch({ boost: true })}
                onPointerUp={() => pushTouch({ boost: false })}
                onPointerCancel={() => pushTouch({ boost: false })}
                className="btn-chunky-sm flex items-center justify-center gap-1 rounded-2xl bg-pink-400 border-pink-700 px-3.5 py-3 font-display text-xs font-bold text-slate-950"
              >
                <Zap className="w-4 h-4" />
                <span>BOOST</span>
              </button>

              <button
                onPointerDown={() => pushTouch({ down: true })}
                onPointerUp={() => pushTouch({ down: false })}
                onPointerCancel={() => pushTouch({ down: false })}
                className="btn-chunky-sm flex items-center justify-center gap-1 rounded-2xl bg-indigo-400 border-indigo-700 px-3.5 py-3 font-display text-xs font-bold text-slate-950"
              >
                <ArrowDown className="w-4 h-4" />
                <span>DOWN</span>
              </button>

              <button
                onClick={onTriggerScanner}
                className="btn-chunky-sm flex items-center justify-center gap-1 rounded-2xl bg-yellow-400 border-amber-600 px-3.5 py-3 font-display text-xs font-bold text-slate-950"
              >
                <Radar className="w-4 h-4" />
                <span>{t.hud.radar}</span>
              </button>
            </div>
          </div>
        )}

        {/* Compact Bottom Action & Supplies Dock */}
        <div className="pointer-events-auto mx-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#181047]/90 border-2 border-indigo-400/35 px-3 py-1.5 shadow-2xl">
          {contextAction && (
            <button
              onClick={contextAction.onClick}
              className={`btn-chunky rounded-xl px-5 py-1.5 font-display text-sm font-bold cursor-pointer whitespace-nowrap ${contextAction.colorClass}`}
            >
              {contextAction.label} (E)
            </button>
          )}

          {progress.realm === 'space' && (
            <button
              onClick={onToggleVehicle}
              className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-pink-400 border-pink-700 px-3 py-1.5 font-display text-xs font-bold text-slate-950 cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {progress.space.vehicleMode === 'jetpack' ? t.hud.starfighterMode : t.hud.jetpackMode} (V)
              </span>
            </button>
          )}

          <button
            onClick={onTriggerScanner}
            disabled={progress.scannerCooldown > 0}
            className={`btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-display text-xs font-bold cursor-pointer whitespace-nowrap tabular-nums ${
              progress.scannerCooldown > 0
                ? 'bg-slate-700 border-slate-900 text-slate-300 cursor-not-allowed'
                : 'bg-cyan-400 border-cyan-700 text-slate-950'
            }`}
          >
            <Radar className="w-4 h-4" />
            <span>
              {t.hud.radar} (F){progress.scannerCooldown > 0 ? ` ${Math.ceil(progress.scannerCooldown)}s` : ''}
            </span>
          </button>

          {CONSUMABLE_CATALOG.map((con) => {
            const qty = progress.consumables[con.id] || 0;
            return (
              <button
                key={con.id}
                onClick={() => onUseConsumable(con.id)}
                disabled={qty <= 0}
                className={`btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-display text-xs font-bold cursor-pointer whitespace-nowrap tabular-nums ${
                  qty > 0
                    ? 'bg-[#2a1d6e] border-indigo-950 text-white'
                    : 'bg-[#140d3b] border-slate-900 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold text-slate-950"
                  style={{ backgroundColor: con.accentColor }}
                >
                  {con.hotkey}
                </span>
                <span className="hidden sm:inline">{language === 'ar' ? con.nameAr : con.nameEn}</span>
                <span className="text-yellow-300">×{qty}</span>
              </button>
            );
          })}
        </div>

        {/* 5-Second Fading Realm Controls Hint Bar */}
        <div
          className={`mx-auto rounded-xl bg-[#100930]/90 border border-cyan-400/35 px-3.5 py-1 text-[11px] font-bold text-cyan-100 text-center transition-opacity duration-500 ${
            controlsHintVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {controlsHintText}
        </div>
      </div>
    </div>
  );
};
