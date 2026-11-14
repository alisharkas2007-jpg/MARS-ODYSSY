import React from 'react';
import { Award, Compass, RotateCcw, Rocket, Star, Sun } from 'lucide-react';
import { TranslationDict } from '../i18n/translations';
import { GameProgress } from '../types/game';

interface VictoryModalProps {
  t: TranslationDict;
  progress: GameProgress;
  onPlayAgain: () => void;
  onKeepExploring: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  t,
  progress,
  onPlayAgain,
  onKeepExploring,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#1b124d] border-2 border-yellow-400 p-6 sm:p-8 text-center text-white shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-yellow-400 text-slate-950 flex items-center justify-center mb-4 shadow-lg">
          <Award className="w-9 h-9" />
        </div>

        <h2 className="font-display text-3xl sm:text-4xl font-bold text-yellow-300">
          {t.victory.title}
        </h2>
        <p className="text-sm sm:text-base text-indigo-100 mt-2 mb-6">{t.victory.subtitle}</p>

        <div className="grid grid-cols-2 gap-3 mb-7 text-start">
          <div className="rounded-2xl bg-[#251964] border border-cyan-400/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Rocket className="w-4 h-4" />
              <span>{t.victory.astronauts}</span>
            </div>
            <div className="font-display text-2xl font-bold text-white mt-1 tabular-nums">
              {progress.space.rescued}/{progress.space.totalAstronauts}
            </div>
          </div>

          <div className="rounded-2xl bg-[#251964] border border-emerald-400/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Sun className="w-4 h-4" />
              <span>{t.victory.marsStations}</span>
            </div>
            <div className="font-display text-2xl font-bold text-white mt-1 tabular-nums">
              {progress.mars.stationsRepaired}/{progress.mars.totalStations}
            </div>
          </div>

          <div className="rounded-2xl bg-[#251964] border border-pink-400/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-300">
              <Compass className="w-4 h-4" />
              <span>{t.victory.bodies}</span>
            </div>
            <div className="font-display text-2xl font-bold text-white mt-1 tabular-nums">
              {progress.solar.discoveredIds.length}/{progress.solar.totalBodies}
            </div>
          </div>

          <div className="rounded-2xl bg-[#251964] border border-yellow-400/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-yellow-300">
              <Star className="w-4 h-4" />
              <span>{t.victory.score}</span>
            </div>
            <div className="font-display text-2xl font-bold text-yellow-300 mt-1 tabular-nums">
              {progress.score}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onPlayAgain}
            className="btn-chunky inline-flex items-center gap-2 rounded-2xl bg-emerald-400 border-emerald-700 px-6 py-3 font-display text-base font-bold text-slate-950 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{t.victory.playAgain}</span>
          </button>

          <button
            onClick={onKeepExploring}
            className="btn-chunky inline-flex items-center gap-2 rounded-2xl bg-cyan-400 border-cyan-700 px-6 py-3 font-display text-base font-bold text-slate-950 cursor-pointer"
          >
            <span>{t.victory.keepExploring}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
