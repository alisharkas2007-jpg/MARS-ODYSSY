import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArmoryShopModal } from './components/ArmoryShopModal';
import { ChallengesModal } from './components/ChallengesModal';
import { ControlCenterDrawer } from './components/ControlCenterDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GameHUD } from './components/GameHUD';
import { HomeScreen } from './components/HomeScreen';
import { HowToPlayModal } from './components/HowToPlayModal';
import { NasaResourcesModal } from './components/NasaResourcesModal';
import { PlanetInfoCard } from './components/PlanetInfoCard';
import { OfflineIndicator } from './components/PWAInstallButton';
import { QuizPilotModal } from './components/QuizPilotModal';
import { SpaceBookModal } from './components/SpaceBookModal';
import { StarMapModal } from './components/StarMapModal';
import { VictoryModal } from './components/VictoryModal';
import { MarsOdysseyEngine } from './engine/MarsOdysseyEngine';
import { TRANSLATIONS } from './i18n/translations';
import { GameProgress, GraphicsQuality, Language, RealmId, ToastPayload } from './types/game';

type ActiveModal = 'none' | 'howto' | 'shop' | 'spacebook' | 'starmap' | 'nasalab' | 'challenges';

function GameShell() {
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MarsOdysseyEngine | null>(null);
  const controlsTimerRef = useRef<number | null>(null);

  const [language, setLanguage] = useState<Language>('en');
  const [muted, setMuted] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [controlsHintVisible, setControlsHintVisible] = useState(false);
  const [touchEnabled, setTouchEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(pointer: coarse)').matches ?? false;
  });
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  const t = TRANSLATIONS[language];

  const triggerControlsHint = useCallback(() => {
    setControlsHintVisible(true);
    if (controlsTimerRef.current !== null) {
      window.clearTimeout(controlsTimerRef.current);
    }
    controlsTimerRef.current = window.setTimeout(() => {
      setControlsHintVisible(false);
      controlsTimerRef.current = null;
    }, 5000);
  }, []);

  // Sync RTL & document lang attribute
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    engineRef.current?.setLanguage(language);
  }, [language]);

  // Mount Three.js engine once
  useEffect(() => {
    if (!canvasHostRef.current) return;

    const engine = new MarsOdysseyEngine(canvasHostRef.current, {
      onProgress: (next) => {
        setProgress(next);
      },
      onFactUnlock: () => {
        // Toast already emitted by engine
      },
      onToast: (toast) => {
        setToasts((prev) => [...prev.slice(-4), toast]);
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== toast.id));
        }, 3800);
      },
    });
    engineRef.current = engine;

    // Fetch real NASA DONKI + RadLab conditions once on startup
    fetch('/api/nasa/donki')
      .then((r) => r.json())
      .then((res) => {
        const d = res?.data;
        if (d && engineRef.current) {
          engineRef.current.setSpaceWeather(
            d.alertLevel || 'calm',
            Number(d.issDoseRateMgyDay ?? 0.31),
            Number(d.deepSpaceDoseRateMgyDay ?? 0.64),
            d.flares?.[0]?.classType || 'C1.0',
            false
          );
        }
      })
      .catch(() => {});

    return () => {
      if (controlsTimerRef.current !== null) {
        window.clearTimeout(controlsTimerRef.current);
      }
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const openControlCenter = useCallback(() => {
    setControlCenterOpen(true);
    engineRef.current?.setPaused(true);
  }, []);

  const closeControlCenter = useCallback(() => {
    setControlCenterOpen(false);
    engineRef.current?.setPaused(false);
  }, []);

  // Pause when tab is hidden / window loses focus, and wire ESC + B
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        engineRef.current?.setPaused(true);
      } else if ((!progress || progress.screen === 'home') || (!controlCenterOpen && activeModal === 'none')) {
        engineRef.current?.setPaused(false);
      }
    };
    const onBlur = () => {
      engineRef.current?.setPaused(true);
    };
    const onFocus = () => {
      if ((!progress || progress.screen === 'home') || (!controlCenterOpen && activeModal === 'none')) {
        engineRef.current?.setPaused(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyB' && engineRef.current && progress?.screen === 'playing' && !progress?.pendingQuizBodyId) {
        setActiveModal((m) => (m === 'shop' ? 'none' : 'shop'));
      } else if (e.code === 'Escape') {
        if (activeModal !== 'none') {
          setActiveModal('none');
          if (!controlCenterOpen) {
            engineRef.current?.setPaused(false);
          }
        } else if (controlCenterOpen) {
          closeControlCenter();
        } else if (progress?.screen === 'playing' || progress?.screen === 'paused') {
          openControlCenter();
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeModal, controlCenterOpen, progress?.screen, progress?.pendingQuizBodyId, openControlCenter, closeControlCenter]);

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const handleToggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      engineRef.current?.setMuted(next);
      return next;
    });
  };

  const handleCycleQuality = () => {
    const order: GraphicsQuality[] = ['balanced', 'high', 'ultra'];
    const current = progress?.quality || 'high';
    const next = order[(order.indexOf(current) + 1) % order.length];
    engineRef.current?.setQuality(next);
  };

  const handlePlay = (realm: RealmId) => {
    setActiveModal('none');
    setControlCenterOpen(false);
    engineRef.current?.startGame(realm);
    triggerControlsHint();
  };

  const handleSwitchRealm = (realm: RealmId) => {
    setActiveModal('none');
    setControlCenterOpen(false);
    engineRef.current?.switchRealm(realm);
    triggerControlsHint();
  };

  return (
    <ErrorBoundary title={t.errorTitle} retryLabel={t.errorRetry}>
      <div
        className="relative w-full h-full overflow-hidden bg-[#0b0624]"
        onPointerDown={(e) => {
          if (e.pointerType === 'touch' && !touchEnabled) {
            setTouchEnabled(true);
          }
        }}
      >
        {/* Isolated WebGL Canvas Container */}
        <div ref={canvasHostRef} className="absolute inset-0 w-full h-full touch-none" />

        {/* WebGL Context Lost Overlay */}
        {progress?.contextLost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0624]/95 p-6 text-center">
            <div className="max-w-md rounded-3xl bg-[#1e1454] border-2 border-yellow-400/50 p-7">
              <h2 className="font-display text-2xl font-bold text-yellow-300 mb-2">
                {t.contextLostTitle}
              </h2>
              <p className="text-sm text-indigo-100">{t.contextLostDesc}</p>
            </div>
          </div>
        )}

        {/* Home Screen Showcase Menu */}
        {(!progress || progress.screen === 'home') && (
          <HomeScreen
            t={t}
            language={language}
            muted={muted}
            quality={progress?.quality || 'ultra'}
            fps={progress?.fps || 165}
            isSoftwareGl={progress?.isSoftwareGl || false}
            onPlay={handlePlay}
            onOpenHowTo={() => setActiveModal('howto')}
            onOpenNasaLab={() => setActiveModal('nasalab')}
            onToggleLanguage={handleToggleLanguage}
            onToggleMute={handleToggleMute}
            onCycleQuality={handleCycleQuality}
          />
        )}

        {/* Active Minimal Gameplay HUD */}
        {progress && progress.screen !== 'home' && (
          <GameHUD
            t={t}
            language={language}
            progress={progress}
            touchEnabled={touchEnabled}
            controlsHintVisible={controlsHintVisible}
            toasts={toasts}
            onToggleVehicle={() => engineRef.current?.toggleVehicleMode()}
            onTriggerAction={() => engineRef.current?.triggerAction()}
            onTriggerScanner={() => engineRef.current?.triggerScanner()}
            onUseConsumable={(id) => engineRef.current?.useConsumable(id)}
            onOpenChallenges={() => {
              setActiveModal('challenges');
            }}
            onOpenControlCenter={openControlCenter}
            onCancelChallenge={() => engineRef.current?.cancelChallenge()}
            onTouchInput={(mx, my, up, down, boost) =>
              engineRef.current?.setTouchInput(mx, my, up, down, boost)
            }
          />
        )}

        {/* Solar Map Planet Info Card */}
        {progress &&
          progress.screen === 'playing' &&
          progress.realm === 'solar' &&
          progress.solar.activeInfoBodyId &&
          !progress.pendingQuizBodyId &&
          !controlCenterOpen &&
          activeModal === 'none' && (
            <PlanetInfoCard
              t={t}
              language={language}
              bodyId={progress.solar.activeInfoBodyId}
              touchEnabled={touchEnabled}
              onDismiss={() => engineRef.current?.dismissPlanetInfo()}
            />
          )}

        {/* Slide-down ESC Control Center */}
        {controlCenterOpen && progress && progress.screen !== 'home' && (
          <ControlCenterDrawer
            t={t}
            language={language}
            progress={progress}
            muted={muted}
            touchEnabled={touchEnabled}
            onClose={closeControlCenter}
            onSwitchRealm={handleSwitchRealm}
            onOpenShop={() => setActiveModal('shop')}
            onOpenSpaceBook={() => setActiveModal('spacebook')}
            onOpenStarMap={() => setActiveModal('starmap')}
            onOpenChallenges={() => setActiveModal('challenges')}
            onOpenNasaLab={() => setActiveModal('nasalab')}
            onCycleQuality={handleCycleQuality}
            onToggleMute={handleToggleMute}
            onToggleLanguage={handleToggleLanguage}
            onToggleTouch={() => setTouchEnabled((v) => !v)}
            onShowControls={triggerControlsHint}
            onRestart={() => {
              setControlCenterOpen(false);
              engineRef.current?.restartGame();
              triggerControlsHint();
            }}
            onHome={() => {
              setControlCenterOpen(false);
              setActiveModal('none');
              engineRef.current?.goHome();
            }}
          />
        )}

        {/* Modals */}
        {activeModal === 'howto' && (
          <HowToPlayModal t={t} onClose={() => setActiveModal('none')} />
        )}

        {activeModal === 'shop' && progress && (
          <ArmoryShopModal
            t={t}
            language={language}
            progress={progress}
            onClose={() => setActiveModal('none')}
            onBuyOrEquipSuit={(id) => engineRef.current?.buyOrEquipSuit(id)}
            onBuyAbility={(id) => engineRef.current?.buyAbility(id)}
            onBuyConsumable={(id) => engineRef.current?.buyConsumable(id)}
            onUseConsumable={(id) => engineRef.current?.useConsumable(id)}
            onBuyOrEquipPet={(id) => engineRef.current?.buyOrEquipPet(id)}
          />
        )}

        {activeModal === 'spacebook' && progress && (
          <SpaceBookModal
            t={t}
            language={language}
            unlockedIds={progress.unlockedFactIds}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'starmap' && progress && (
          <StarMapModal
            t={t}
            language={language}
            discoveredIds={progress.solar.discoveredIds}
            onWarp={(bodyId) => {
              setActiveModal('none');
              setControlCenterOpen(false);
              engineRef.current?.warpToSolarBody(bodyId);
            }}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'challenges' && progress && (
          <ChallengesModal
            t={t}
            language={language}
            progress={progress}
            onStartChallenge={(id) => engineRef.current?.startChallenge(id)}
            onCancelChallenge={() => engineRef.current?.cancelChallenge()}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'nasalab' && (
          <NasaResourcesModal
            t={t}
            language={language}
            spaceWeather={
              progress?.spaceWeather || {
                alertLevel: 'calm',
                synced: false,
                issDoseRate: 0.31,
                deepSpaceDoseRate: 0.64,
                latestFlare: 'C1.0',
              }
            }
            onSyncWeather={(alertLevel, issDose, deepDose, flare) => {
              engineRef.current?.setSpaceWeather(alertLevel, issDose, deepDose, flare, true);
            }}
            onLaunchRealm={(realm) => {
              handleSwitchRealm(realm);
            }}
            onClose={() => setActiveModal('none')}
          />
        )}

        {progress?.pendingQuizBodyId && (
          <QuizPilotModal
            t={t}
            language={language}
            bodyId={progress.pendingQuizBodyId}
            onAnswer={(bodyId, idx) => engineRef.current?.submitQuizAnswer(bodyId, idx)}
          />
        )}

        {progress?.screen === 'victory' && (
          <VictoryModal
            t={t}
            progress={progress}
            onPlayAgain={() => {
              engineRef.current?.restartGame();
              triggerControlsHint();
            }}
            onKeepExploring={() => engineRef.current?.keepExploringAfterVictory()}
          />
        )}

        <OfflineIndicator t={t} />
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return <GameShell />;
}
