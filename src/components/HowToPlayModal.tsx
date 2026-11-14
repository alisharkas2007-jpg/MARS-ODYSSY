import React from 'react';
import { Gamepad2, Keyboard, Smartphone, X } from 'lucide-react';
import { TranslationDict } from '../i18n/translations';

interface HowToPlayModalProps {
  t: TranslationDict;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ t, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto space-scroll rounded-3xl bg-[#1b124d] border-2 border-cyan-400/50 p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-400 text-slate-950">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-yellow-300">
              {t.howTo.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn-chunky-sm rounded-xl bg-[#2c1f70] border-indigo-950 p-2 text-indigo-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl bg-[#251964] border border-cyan-400/30 p-4">
            <h3 className="font-display text-base font-bold text-cyan-300 mb-1.5">
              {t.howTo.step1Title}
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              {t.howTo.step1Desc}
            </p>
          </div>
          <div className="rounded-2xl bg-[#251964] border border-emerald-400/30 p-4">
            <h3 className="font-display text-base font-bold text-emerald-300 mb-1.5">
              {t.howTo.step2Title}
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              {t.howTo.step2Desc}
            </p>
          </div>
          <div className="rounded-2xl bg-[#251964] border border-pink-400/30 p-4">
            <h3 className="font-display text-base font-bold text-pink-300 mb-1.5">
              {t.howTo.step3Title}
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              {t.howTo.step3Desc}
            </p>
          </div>
        </div>

        {/* Desktop & Mobile Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl bg-[#140d3b] border border-indigo-400/25 p-4">
            <div className="flex items-center gap-2 font-display text-base font-bold text-yellow-300 mb-3">
              <Keyboard className="w-5 h-5" />
              <span>{t.howTo.desktopControls}</span>
            </div>
            <ul className="space-y-2">
              {t.howTo.controlsList.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <span className="font-bold text-cyan-200 bg-[#251964] px-2.5 py-1 rounded-lg">
                    {item.key}
                  </span>
                  <span className="text-indigo-100 text-end">{item.action}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-[#140d3b] border border-indigo-400/25 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-display text-base font-bold text-pink-300 mb-3">
                <Smartphone className="w-5 h-5" />
                <span>{t.howTo.mobileControls}</span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                {t.howTo.mobileDesc}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#251964] px-3 py-2 text-xs text-cyan-200 font-bold">
              <span>{t.hud.touchOn}</span>
              <span>UP · DOWN · BOOST · PICK UP · RADAR</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="btn-chunky rounded-2xl bg-emerald-400 border-emerald-700 px-8 py-3 font-display text-lg font-bold text-slate-950 cursor-pointer"
          >
            {t.howTo.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
};
