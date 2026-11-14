import React from 'react';
import { BookOpen, HelpCircle, X } from 'lucide-react';
import { SCIENCE_FACTS } from '../data/catalog';
import { TranslationDict } from '../i18n/translations';
import { Language } from '../types/game';

interface SpaceBookModalProps {
  t: TranslationDict;
  language: Language;
  unlockedIds: string[];
  onClose: () => void;
}

export const SpaceBookModal: React.FC<SpaceBookModalProps> = ({
  t,
  language,
  unlockedIds,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#1b124d] border-2 border-emerald-400/50 p-5 sm:p-7 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-400 text-slate-950">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-yellow-300">
                {t.spaceBook.title}
              </h2>
              <p className="font-display text-sm font-bold text-emerald-300 tabular-nums">
                {t.spaceBook.unlockedCounter} {unlockedIds.length}/{SCIENCE_FACTS.length}
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

        <div className="overflow-y-auto space-scroll pr-1 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {SCIENCE_FACTS.map((fact, idx) => {
            const unlocked = unlockedIds.includes(fact.id);
            if (!unlocked) {
              return (
                <div
                  key={fact.id}
                  className="rounded-2xl bg-[#140d3b] border-2 border-dashed border-indigo-400/30 p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#251964] flex items-center justify-center shrink-0 text-indigo-300 font-display text-2xl font-bold">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-300 tabular-nums">
                      #{idx + 1} · {language === 'ar' ? fact.categoryAr : fact.categoryEn}
                    </div>
                    <h3 className="font-display text-base font-bold text-indigo-200">
                      {t.spaceBook.lockedTitle}
                    </h3>
                    <p className="text-xs text-indigo-300/80 mt-0.5">{t.spaceBook.lockedHint}</p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={fact.id}
                className="rounded-2xl bg-[#251964] border-2 border-indigo-300/35 p-4 flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs font-bold mb-1">
                    <span style={{ color: fact.accent }}>
                      {language === 'ar' ? fact.categoryAr : fact.categoryEn}
                    </span>
                    <span className="text-indigo-200 tabular-nums">#{idx + 1}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">
                    {language === 'ar' ? fact.titleAr : fact.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed mt-1">
                    {language === 'ar' ? fact.summaryAr : fact.summaryEn}
                  </p>
                </div>
                <div className="pt-2 border-t border-white/10 text-xs font-bold text-yellow-300 tabular-nums">
                  {language === 'ar' ? fact.metricAr : fact.metricEn}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
