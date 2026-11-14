import React, { useState } from 'react';
import { Download, PlusSquare, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { TranslationDict } from '../i18n/translations';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  t: TranslationDict;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ t, compact = false }) => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled) return null;

  if (!isInstallable && !isIOS) return null;

  const handleClick = () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      void promptInstall();
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`btn-chunky-sm inline-flex items-center gap-1.5 rounded-2xl bg-emerald-400 border-emerald-700 font-display font-bold text-slate-950 cursor-pointer whitespace-nowrap shadow-lg ${
          compact ? 'px-3 py-2 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm'
        }`}
      >
        {isIOS ? <Smartphone className="w-4 h-4 shrink-0" /> : <Download className="w-4 h-4 shrink-0" />}
        <span>{isIOS ? t.pwa.installIos : t.pwa.installApp}</span>
      </button>

      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#181047] border-2 border-cyan-400/60 p-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-indigo-400/25">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-300" />
                <h3 className="font-display text-lg font-bold text-yellow-300">
                  {t.pwa.iosTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                aria-label={t.pwa.close}
                className="btn-chunky-sm rounded-xl bg-[#291d6b] border-indigo-950 p-1.5 text-indigo-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-3 text-sm text-indigo-100 mb-5">
              <li className="flex items-start gap-3 rounded-2xl bg-[#110a33] border border-indigo-400/25 p-3">
                <Share className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
                <span>{t.pwa.iosStep1}</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl bg-[#110a33] border border-indigo-400/25 p-3">
                <PlusSquare className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                <span>{t.pwa.iosStep2}</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="btn-chunky w-full rounded-2xl bg-cyan-400 border-cyan-700 py-2.5 font-display text-sm font-bold text-slate-950 cursor-pointer"
            >
              {t.pwa.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC<{ t: TranslationDict }> = ({ t }) => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 pointer-events-none inline-flex items-center gap-2 rounded-2xl bg-amber-400 border-b-4 border-amber-700 px-3.5 py-1.5 font-display text-xs font-bold text-slate-950 shadow-2xl"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>{t.pwa.offlineBadge}</span>
    </div>
  );
};
