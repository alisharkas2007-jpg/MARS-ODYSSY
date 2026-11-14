import React from 'react';
import { HelpCircle } from 'lucide-react';
import { PLANET_QUIZZES, SOLAR_BODIES } from '../data/catalog';
import { TranslationDict } from '../i18n/translations';
import { Language } from '../types/game';

interface QuizPilotModalProps {
  t: TranslationDict;
  language: Language;
  bodyId: string;
  onAnswer: (bodyId: string, optionIndex: number) => void;
}

export const QuizPilotModal: React.FC<QuizPilotModalProps> = ({
  t,
  language,
  bodyId,
  onAnswer,
}) => {
  const quiz = PLANET_QUIZZES.find((q) => q.bodyId === bodyId);
  const body = SOLAR_BODIES.find((b) => b.id === bodyId);
  if (!quiz || !body) return null;

  const bodyName = language === 'ar' ? body.nameAr : body.nameEn;
  const question = language === 'ar' ? quiz.questionAr : quiz.questionEn;
  const options = language === 'ar' ? quiz.optionsAr : quiz.optionsEn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#1b124d] border-2 border-yellow-400 p-6 text-white shadow-2xl">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-xl bg-yellow-400 text-slate-950">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              {t.quizPilot.badge}
            </div>
            <h2 className="font-display text-xl font-bold text-yellow-300">{bodyName}</h2>
          </div>
        </div>

        <p className="text-base font-bold text-white leading-snug mb-2">{question}</p>
        <p className="text-xs text-indigo-200 mb-4">{t.quizPilot.submitHint}</p>

        <div className="space-y-2.5">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onAnswer(bodyId, idx)}
              className="btn-chunky-sm w-full text-start rounded-2xl bg-[#271b66] hover:bg-cyan-400 hover:text-slate-950 border-indigo-950 px-4 py-3 font-display text-sm font-bold text-white transition-colors cursor-pointer"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
