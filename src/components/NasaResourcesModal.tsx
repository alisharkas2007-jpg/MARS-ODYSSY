import React, { useEffect, useState } from 'react';
import {
  Activity,
  Camera,
  ExternalLink,
  FlaskConical,
  Globe2,
  MapPin,
  Radio,
  Rocket,
  Search,
  ShieldAlert,
  Sprout,
  Sun,
  X,
} from 'lucide-react';
import { CSA_RESOURCES, MARS_TREK_SITES } from '../data/catalog';
import { TranslationDict } from '../i18n/translations';
import { Language, RealmId, SpaceWeatherAlert, SpaceWeatherState } from '../types/game';

interface NasaResourcesModalProps {
  t: TranslationDict;
  language: Language;
  spaceWeather: SpaceWeatherState;
  onSyncWeather: (
    alertLevel: SpaceWeatherAlert,
    issDoseRate: number,
    deepSpaceDoseRate: number,
    latestFlare: string
  ) => void;
  onLaunchRealm: (realm: RealmId) => void;
  onClose: () => void;
}

type LabTab = 'weather' | 'imagery' | 'osdr' | 'marstrek' | 'csa';

interface DonkiPayload {
  alertLevel: SpaceWeatherAlert;
  flares: Array<{ id: string; classType: string; beginTime: string; sourceLocation: string }>;
  cmes: Array<{ id: string; startTime: string; note: string }>;
  issDoseRateMgyDay: number;
  deepSpaceDoseRateMgyDay: number;
}

interface RadlabPayload {
  issAvgDoseMgyDay: number;
  earthSeaLevelMgyDay: number;
  marsSurfaceMgyDay: number;
  shieldsRecommendedMmAl: number;
  instruments: string[];
  studies: Array<{ accession: string; title: string }>;
}

interface ApodPayload {
  title: string;
  date: string;
  explanation: string;
  url: string;
  mediaType: string;
  copyright: string;
}

interface RoverPhoto {
  id: number;
  sol: number;
  imgSrc: string;
  earthDate: string;
  camera: string;
  rover: string;
}

interface OsdrStudy {
  accession: string;
  title: string;
  description: string;
  organism: string;
  projectType: string;
}

export const NasaResourcesModal: React.FC<NasaResourcesModalProps> = ({
  t,
  language,
  spaceWeather,
  onSyncWeather,
  onLaunchRealm,
  onClose,
}) => {
  const [tab, setTab] = useState<LabTab>('weather');

  // DONKI + RadLab
  const [donki, setDonki] = useState<DonkiPayload | null>(null);
  const [radlab, setRadlab] = useState<RadlabPayload | null>(null);
  const [weatherSource, setWeatherSource] = useState<'live' | 'fallback'>('live');
  const [weatherLoading, setWeatherLoading] = useState(false);

  // APOD + Rover Photos
  const [apod, setApod] = useState<ApodPayload | null>(null);
  const [apodFailed, setApodFailed] = useState(false);
  const [roverName, setRoverName] = useState<'perseverance' | 'curiosity'>('perseverance');
  const [roverPhotos, setRoverPhotos] = useState<RoverPhoto[]>([]);
  const [brokenPhotoIds, setBrokenPhotoIds] = useState<Record<number, boolean>>({});
  const [imageryLoading, setImageryLoading] = useState(false);

  // OSDR
  const [osdrQuery, setOsdrQuery] = useState('bone density');
  const [osdrStudies, setOsdrStudies] = useState<OsdrStudy[]>([]);
  const [osdrSource, setOsdrSource] = useState<'live' | 'fallback'>('live');
  const [osdrLoading, setOsdrLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setWeatherLoading(true);
    Promise.all([
      fetch('/api/nasa/donki').then((r) => r.json()),
      fetch('/api/nasa/radlab').then((r) => r.json()),
    ])
      .then(([donkiRes, radRes]) => {
        if (!active) return;
        if (donkiRes?.data) {
          setDonki(donkiRes.data);
          setWeatherSource(donkiRes.source === 'live' ? 'live' : 'fallback');
        }
        if (radRes?.data) {
          setRadlab(radRes.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setWeatherLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (tab !== 'imagery') return;
    let active = true;
    setImageryLoading(true);
    setApodFailed(false);
    Promise.all([
      apod ? Promise.resolve({ data: apod }) : fetch('/api/nasa/apod').then((r) => r.json()),
      fetch(`/api/nasa/mars-photos?rover=${roverName}`).then((r) => r.json()),
    ])
      .then(([apodRes, photoRes]) => {
        if (!active) return;
        if (apodRes?.data) setApod(apodRes.data);
        if (photoRes?.data) setRoverPhotos(photoRes.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setImageryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab, roverName]);

  const runOsdrSearch = (term: string) => {
    setOsdrQuery(term);
    setOsdrLoading(true);
    fetch(`/api/nasa/osdr?q=${encodeURIComponent(term)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.data) {
          setOsdrStudies(res.data);
          setOsdrSource(res.source === 'live' ? 'live' : 'fallback');
        }
      })
      .catch(() => {})
      .finally(() => setOsdrLoading(false));
  };

  useEffect(() => {
    if (tab === 'osdr' && osdrStudies.length === 0) {
      runOsdrSearch('bone density');
    }
  }, [tab]);

  const tabs: Array<{ id: LabTab; label: string; icon: React.ReactNode }> = [
    { id: 'weather', label: t.nasaLab.tabs.weather, icon: <Sun className="w-4 h-4" /> },
    { id: 'imagery', label: t.nasaLab.tabs.imagery, icon: <Camera className="w-4 h-4" /> },
    { id: 'osdr', label: t.nasaLab.tabs.osdr, icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'marstrek', label: t.nasaLab.tabs.marstrek, icon: <MapPin className="w-4 h-4" /> },
    { id: 'csa', label: t.nasaLab.tabs.csa, icon: <Sprout className="w-4 h-4" /> },
  ];

  const osdrTopics = ['bone density', 'muscle mass', 'immune', 'sleep', 'radiation', 'plants'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#1b124d] border-2 border-cyan-400/55 p-5 sm:p-7 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-yellow-300">
              {t.nasaLab.title}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 mt-0.5">{t.nasaLab.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn-chunky-sm rounded-xl bg-[#2c1f70] border-indigo-950 p-2 text-indigo-100 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`btn-chunky-sm flex items-center justify-center gap-1.5 rounded-2xl px-2.5 py-2.5 font-display text-xs font-bold cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-cyan-400 border-cyan-700 text-slate-950'
                    : 'bg-[#261a63] border-indigo-950 text-indigo-100'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="overflow-y-auto space-scroll pr-1 flex-1">
          {/* TAB 1: DONKI & RadLab */}
          {tab === 'weather' && (
            <div className="space-y-4">
              {weatherLoading && (
                <div className="text-center py-6 font-display text-cyan-300">{t.nasaLab.loading}</div>
              )}

              {donki && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* DONKI Card */}
                  <div className="rounded-2xl bg-[#23175f] border-2 border-amber-400/35 p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-display text-lg font-bold text-yellow-300 flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-amber-300" />
                          <span>{t.nasaLab.donkiTitle}</span>
                        </span>
                        <span className="text-[11px] font-bold text-cyan-200">
                          {weatherSource === 'live' ? t.nasaLab.liveBadge : t.nasaLab.cachedFallbackBadge}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200 leading-relaxed mb-3">{t.nasaLab.donkiDesc}</p>

                      <div className="space-y-2">
                        <div className="text-xs font-bold text-cyan-300">{t.nasaLab.flaresLabel}</div>
                        {donki.flares.length === 0 ? (
                          <div className="text-xs text-indigo-200">No major flares in past 14 days</div>
                        ) : (
                          donki.flares.slice(0, 3).map((flr) => (
                            <div
                              key={flr.id}
                              className="flex items-center justify-between rounded-xl bg-[#160e40] px-3 py-2 text-xs tabular-nums"
                            >
                              <span className="font-bold text-yellow-300">{flr.classType}</span>
                              <span className="text-indigo-200">{flr.sourceLocation}</span>
                              <span className="text-indigo-300">{flr.beginTime.slice(0, 10)}</span>
                            </div>
                          ))
                        )}
                      </div>

                      {donki.cmes.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <div className="text-xs font-bold text-pink-300">{t.nasaLab.cmesLabel}</div>
                          {donki.cmes.slice(0, 2).map((c) => (
                            <div key={c.id} className="rounded-xl bg-[#160e40] px-3 py-2 text-xs text-indigo-100">
                              <span className="font-bold text-pink-200">{c.startTime.slice(0, 10)}: </span>
                              {c.note}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        onSyncWeather(
                          donki.alertLevel,
                          donki.issDoseRateMgyDay,
                          donki.deepSpaceDoseRateMgyDay,
                          donki.flares[0]?.classType || 'C1.0'
                        )
                      }
                      className={`btn-chunky w-full rounded-2xl px-4 py-2.5 font-display text-sm font-bold cursor-pointer ${
                        spaceWeather.synced
                          ? 'bg-emerald-400 border-emerald-700 text-slate-950'
                          : 'bg-yellow-400 border-amber-600 text-slate-950'
                      }`}
                    >
                      {spaceWeather.synced ? t.nasaLab.syncedActive : t.nasaLab.syncWeatherBtn}
                    </button>
                  </div>

                  {/* RadLab Card */}
                  <div className="rounded-2xl bg-[#23175f] border-2 border-cyan-400/35 p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 font-display text-lg font-bold text-cyan-300 mb-1">
                        <Activity className="w-5 h-5" />
                        <span>{t.nasaLab.radlabTitle}</span>
                      </div>
                      <p className="text-xs text-indigo-200 leading-relaxed mb-3">{t.nasaLab.radlabDesc}</p>

                      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                        <div className="rounded-xl bg-[#160e40] p-2.5">
                          <div className="text-[11px] text-indigo-200">{t.nasaLab.earthDoseLabel}</div>
                          <div className="font-display text-base font-bold text-emerald-300 tabular-nums mt-0.5">
                            {radlab?.earthSeaLevelMgyDay ?? 0.006} mGy/d
                          </div>
                        </div>
                        <div className="rounded-xl bg-[#160e40] p-2.5">
                          <div className="text-[11px] text-indigo-200">{t.nasaLab.issDoseLabel}</div>
                          <div className="font-display text-base font-bold text-yellow-300 tabular-nums mt-0.5">
                            {donki.issDoseRateMgyDay} mGy/d
                          </div>
                        </div>
                        <div className="rounded-xl bg-[#160e40] p-2.5">
                          <div className="text-[11px] text-indigo-200">{t.nasaLab.marsDoseLabel}</div>
                          <div className="font-display text-base font-bold text-pink-300 tabular-nums mt-0.5">
                            {radlab?.marsSurfaceMgyDay ?? 0.64} mGy/d
                          </div>
                        </div>
                      </div>

                      {radlab && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-bold text-emerald-300">
                            Instruments: {radlab.instruments.join(' · ')}
                          </div>
                          {radlab.studies.slice(0, 2).map((s) => (
                            <div key={s.accession} className="rounded-xl bg-[#160e40] px-3 py-2 text-xs text-indigo-100">
                              <strong className="text-cyan-300">{s.accession}: </strong>
                              {s.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <a
                      href="https://osdr.nasa.gov/bio/repo/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-chunky-sm inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2d1e78] border-indigo-950 px-4 py-2 text-xs font-bold text-cyan-200"
                    >
                      <span>{t.nasaLab.openPortal}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APOD & Mars Rover Photos */}
          {tab === 'imagery' && (
            <div className="space-y-4">
              {imageryLoading && (
                <div className="text-center py-4 font-display text-cyan-300">{t.nasaLab.loading}</div>
              )}

              {/* APOD */}
              {apod && (
                <div className="rounded-2xl bg-[#23175f] border border-indigo-400/35 p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div className="md:col-span-2 rounded-2xl overflow-hidden bg-[#130c38] aspect-video flex items-center justify-center">
                    {apod.url && apod.mediaType === 'image' && !apodFailed ? (
                      <img
                        src={apod.url}
                        alt={apod.title}
                        referrerPolicy="no-referrer"
                        onError={() => setApodFailed(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-4 text-center">
                        <Globe2 className="w-10 h-10 text-cyan-300 mx-auto mb-2" />
                        <div className="font-display text-sm font-bold text-yellow-300">{apod.title}</div>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-3">
                    <div className="text-xs font-bold text-cyan-300">
                      {t.nasaLab.apodTitle} · {apod.date}
                    </div>
                    <h3 className="font-display text-lg font-bold text-white mt-0.5">{apod.title}</h3>
                    <p className="text-xs text-indigo-100 leading-relaxed mt-1.5 line-clamp-4">
                      {apod.explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* Rover Photos */}
              <div className="rounded-2xl bg-[#23175f] border border-indigo-400/35 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h3 className="font-display text-lg font-bold text-yellow-300">
                    {t.nasaLab.roverPhotosTitle}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRoverName('perseverance')}
                      className={`btn-chunky-sm rounded-xl px-3 py-1.5 font-display text-xs font-bold cursor-pointer ${
                        roverName === 'perseverance'
                          ? 'bg-emerald-400 border-emerald-700 text-slate-950'
                          : 'bg-[#170f42] border-indigo-950 text-indigo-100'
                      }`}
                    >
                      Perseverance (Jezero)
                    </button>
                    <button
                      onClick={() => setRoverName('curiosity')}
                      className={`btn-chunky-sm rounded-xl px-3 py-1.5 font-display text-xs font-bold cursor-pointer ${
                        roverName === 'curiosity'
                          ? 'bg-emerald-400 border-emerald-700 text-slate-950'
                          : 'bg-[#170f42] border-indigo-950 text-indigo-100'
                      }`}
                    >
                      Curiosity (Gale)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {roverPhotos.slice(0, 3).map((photo) => (
                    <div key={photo.id} className="rounded-2xl bg-[#140d3b] overflow-hidden border border-white/10">
                      <div className="aspect-video bg-[#0d0829] flex items-center justify-center">
                        {photo.imgSrc && !brokenPhotoIds[photo.id] ? (
                          <img
                            src={photo.imgSrc}
                            alt={`${photo.rover} ${photo.camera}`}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setBrokenPhotoIds((prev) => ({ ...prev, [photo.id]: true }))
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="p-3 text-center">
                            <Radio className="w-8 h-8 text-amber-300 mx-auto mb-1" />
                            <div className="text-xs font-bold text-indigo-100">{photo.rover}</div>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 text-xs">
                        <div className="font-bold text-cyan-200 truncate">{photo.camera}</div>
                        <div className="text-indigo-300 tabular-nums mt-0.5">
                          Sol {photo.sol} · {photo.earthDate}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OSDR Space Biology */}
          {tab === 'osdr' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#23175f] border border-emerald-400/35 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="font-display text-lg font-bold text-emerald-300">
                    {t.nasaLab.osdrTitle}
                  </h3>
                  <span className="text-xs font-bold text-cyan-200">
                    {osdrSource === 'live' ? t.nasaLab.liveBadge : t.nasaLab.cachedFallbackBadge}
                  </span>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    runOsdrSearch(osdrQuery);
                  }}
                  className="flex gap-2 mb-3"
                >
                  <input
                    type="text"
                    value={osdrQuery}
                    onChange={(e) => setOsdrQuery(e.target.value)}
                    placeholder={t.nasaLab.osdrPlaceholder}
                    className="flex-1 rounded-xl bg-[#130c38] border border-indigo-400/40 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 border-cyan-700 px-4 py-2 font-display text-xs font-bold text-slate-950 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>{t.nasaLab.osdrSearchBtn}</span>
                  </button>
                </form>

                <div className="flex flex-wrap gap-1.5">
                  {osdrTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => runOsdrSearch(topic)}
                      className="rounded-xl bg-[#170f42] hover:bg-[#2d1e78] border border-indigo-400/30 px-3 py-1 text-xs font-bold text-indigo-100 cursor-pointer"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {osdrLoading ? (
                <div className="text-center py-6 font-display text-cyan-300">{t.nasaLab.loading}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {osdrStudies.map((st) => (
                    <div
                      key={st.accession}
                      className="rounded-2xl bg-[#211559] border border-indigo-300/30 p-4 flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-1">
                          <span>{st.accession}</span>
                          <span className="text-indigo-200 truncate max-w-[60%]">{st.organism}</span>
                        </div>
                        <h4 className="font-display text-base font-bold text-white leading-snug">
                          {st.title}
                        </h4>
                        <p className="text-xs text-indigo-100 leading-relaxed mt-1.5 line-clamp-3">
                          {st.description}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-white/10 text-[11px] font-bold text-yellow-300">
                        {st.projectType}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Mars Trek Sites */}
          {tab === 'marstrek' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#23175f] border border-amber-400/35 p-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-yellow-300">
                    {t.nasaLab.marsTrekTitle}
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">{t.nasaLab.marsTrekDesc}</p>
                </div>
                <a
                  href="https://trek.nasa.gov/mars/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 border-cyan-700 px-3.5 py-2 font-display text-xs font-bold text-slate-950"
                >
                  <span>{t.nasaLab.openPortal}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {MARS_TREK_SITES.map((site) => (
                  <div
                    key={site.id}
                    className="rounded-2xl bg-[#211559] border-2 border-indigo-400/30 p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs font-bold mb-1">
                        <span style={{ color: site.accent }}>{site.coords}</span>
                        <span className="text-indigo-200 tabular-nums">{site.elevation}</span>
                      </div>
                      <h4 className="font-display text-lg font-bold text-white">
                        {language === 'ar' ? site.nameAr : site.nameEn}
                      </h4>
                      <div className="text-xs font-bold text-cyan-200 mt-0.5">
                        {language === 'ar' ? site.missionAr : site.missionEn}
                      </div>
                      <p className="text-xs text-indigo-100 leading-relaxed mt-2">
                        {language === 'ar' ? site.descAr : site.descEn}
                      </p>
                    </div>

                    <button
                      onClick={() => onLaunchRealm(site.realmTarget)}
                      className="btn-chunky-sm inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 border-emerald-700 px-4 py-2 font-display text-xs font-bold text-slate-950 cursor-pointer"
                    >
                      <Rocket className="w-4 h-4" />
                      <span>{t.nasaLab.launchRealm}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: CSA Youth & Food Production */}
          {tab === 'csa' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#23175f] border border-emerald-400/35 p-4">
                <h3 className="font-display text-lg font-bold text-emerald-300">
                  {t.nasaLab.csaTitle}
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">{t.nasaLab.csaDesc}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CSA_RESOURCES.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-[#211559] border-2 border-indigo-400/30 p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold mb-1" style={{ color: item.accent }}>
                        {language === 'ar' ? item.badgeAr : item.badgeEn}
                      </div>
                      <h4 className="font-display text-lg font-bold text-white">
                        {language === 'ar' ? item.titleAr : item.titleEn}
                      </h4>
                      <p className="text-xs text-indigo-100 leading-relaxed mt-2">
                        {language === 'ar' ? item.descAr : item.descEn}
                      </p>
                      <div className="mt-3 rounded-xl bg-[#140d3b] p-3 text-xs font-semibold text-emerald-200">
                        {language === 'ar' ? item.connectionAr : item.connectionEn}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => onLaunchRealm('mars')}
                        className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 border-emerald-700 px-3.5 py-2 font-display text-xs font-bold text-slate-950 cursor-pointer"
                      >
                        <Sprout className="w-4 h-4" />
                        <span>{t.nasaLab.launchRealm}</span>
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-chunky-sm inline-flex items-center gap-1.5 rounded-xl bg-[#2d1e78] border-indigo-950 px-3.5 py-2 font-display text-xs font-bold text-cyan-200"
                      >
                        <span>{t.nasaLab.openPortal}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
