import React from 'react';
import { CheckCircle2, Lock, Play, Trophy, X, XCircle } from 'lucide-react';
import { CHALLENGE_CATALOG } from '../data/catalog';
import { TranslationDict } from '../i18n/translations';
import { ChallengeId, GameProgress, Language } from '../types/game';

interface ChallengesModalProps {
  t: TranslationDict;
  language: Language;
  progress: GameProgress;
  onStartChallenge: (id: ChallengeId) => void;
  onCancelChallenge: () => void;
  onClose: () => void;
}

export const ChallengesModal: React.FC<ChallengesModalProps> = ({
  t,
  language,
  progress,
  onStartChallenge,
  onCancelChallenge,
  onClose,
}) => {
  const realmChallenges = CHALLENGE_CATALOG.filter((c) => c.realm === progress.realm);
  const realmName = t.realms[progress.realm].name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl bg-[#1b124d] border-2 border-yellow-400/55 p-5 sm:p-7 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-yellow-400 text-slate-950">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-yellow-300">
                {t.challenges.title}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-cyan-200">
                {realmName} · {t.challenges.subtitle}
              </p>
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

        <div className="overflow-y-auto space-scroll space-y-3 pr-1">
          {realmChallenges.map((spec) => {
            const isActive = progress.activeChallenge?.id === spec.id;
            const isCompleted = progress.completedChallengeIds.includes(spec.id);
            const otherActive = Boolean(progress.activeChallenge && !isActive);
            const title = language === 'ar' ? spec.titleAr : spec.titleEn;
            const desc = language === 'ar' ? spec.descAr : spec.descEn;

            return (
              <div
                key={spec.id}
                className={`rounded-2xl border-2 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-[#281b6e] border-cyan-400'
                    : isCompleted
                      ? 'bg-[#1a2b4c] border-emerald-400/50'
                      : 'bg-[#140d3b] border-indigo-400/25'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-display text-lg font-bold text-white">{title}</h3>
                    {isActive && (
                      <span className="rounded-lg bg-cyan-400 px-2 py-0.5 font-display text-[11px] font-bold text-slate-950">
                        {t.challenges.activeLabel} ({progress.activeChallenge?.progress}/{progress.activeChallenge?.target})
                      </span>
                    )}
                    {isCompleted && !isActive && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-400 px-2 py-0.5 font-display text-[11px] font-bold text-slate-950">
                        <CheckCircle2 className="w-3 h-3" />
                        {t.challenges.completedLabel}
                      </span>
                    )}
                    {otherActive && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                        <Lock className="w-3 h-3" />
                        {t.challenges.lockedLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-indigo-100 leading-snug">{desc}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold tabular-nums">
                    <span className="text-yellow-300">
                      +{spec.rewardScore} {t.hud.score}
                    </span>
                    <span className="text-amber-200">
                      +{spec.rewardCredits} {t.hud.credits}
                    </span>
                    {spec.timeLimitSec > 0 && (
                      <span className="text-cyan-200">
                        {t.challenges.timeLeft}: {spec.timeLimitSec}s
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {isActive ? (
                    <button
                      onClick={onCancelChallenge}
                      className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-pink-400 border-pink-700 px-4 py-2 font-display text-xs font-bold text-slate-950 cursor-pointer whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{t.challenges.cancelBtn}</span>
                    </button>
                  ) : otherActive ? (
                    <span className="text-[11px] font-bold text-slate-400">
                      {t.challenges.lockedBusy}
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        onStartChallenge(spec.id);
                        onClose();
                      }}
                      className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 border-emerald-700 px-4 py-2 font-display text-xs font-bold text-slate-950 cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>{t.challenges.startBtn}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
