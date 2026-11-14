import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const NASA_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.data as T;
}

function setCached<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 7000): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

function formatDateOffset(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // 1. NASA Astronomy Picture of the Day (APOD)
  app.get('/api/nasa/apod', async (_req, res) => {
    const cacheKey = 'apod';
    const cached = getCached(cacheKey);
    if (cached) {
      res.json({ ok: true, source: 'live', data: cached });
      return;
    }
    try {
      const url = `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(NASA_KEY)}`;
      const raw = (await fetchJsonWithTimeout(url)) as Record<string, unknown>;
      const payload = {
        title: String(raw.title || 'Astronomy Picture of the Day'),
        date: String(raw.date || formatDateOffset(0)),
        explanation: String(raw.explanation || ''),
        url: String(raw.url || ''),
        mediaType: String(raw.media_type || 'image'),
        copyright: raw.copyright ? String(raw.copyright) : 'NASA / Public Domain',
      };
      setCached(cacheKey, payload, 30 * 60 * 1000);
      res.json({ ok: true, source: 'live', data: payload });
    } catch {
      res.json({
        ok: true,
        source: 'fallback',
        data: {
          title: 'Jezero Crater Delta & Ancient Martian Riverbed',
          date: formatDateOffset(0),
          explanation:
            'NASA’s Perseverance rover explores Jezero Crater on Mars—an ancient lake basin where rivers once carved fan-shaped deltas rich in clay minerals.',
          url: '',
          mediaType: 'image',
          copyright: 'NASA / JPL-Caltech',
        },
      });
    }
  });

  // 2. NASA Mars Rover Photos (Perseverance / Curiosity)
  app.get('/api/nasa/mars-photos', async (req, res) => {
    const rover = req.query.rover === 'curiosity' ? 'curiosity' : 'perseverance';
    const cacheKey = `mars_photos_${rover}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.json({ ok: true, source: 'live', data: cached });
      return;
    }

    try {
      const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=${encodeURIComponent(NASA_KEY)}`;
      const raw = (await fetchJsonWithTimeout(url)) as {
        latest_photos?: Array<{
          id: number;
          sol: number;
          img_src: string;
          earth_date: string;
          camera?: { full_name?: string; name?: string };
          rover?: { name?: string; status?: string };
        }>;
      };
      const photos = (raw.latest_photos || []).slice(0, 6).map((p) => ({
        id: p.id,
        sol: p.sol,
        imgSrc: p.img_src,
        earthDate: p.earth_date,
        camera: p.camera?.full_name || p.camera?.name || 'Mastcam',
        rover: p.rover?.name || rover,
      }));
      if (photos.length > 0) {
        setCached(cacheKey, photos, 20 * 60 * 1000);
        res.json({ ok: true, source: 'live', data: photos });
        return;
      }
      throw new Error('No photos returned');
    } catch {
      res.json({
        ok: true,
        source: 'fallback',
        data: [
          {
            id: 1,
            sol: 1240,
            imgSrc: '',
            earthDate: formatDateOffset(2),
            camera: rover === 'perseverance' ? 'Mastcam-Z Left (Jezero Crater)' : 'Mast Camera (Gale Crater)',
            rover: rover === 'perseverance' ? 'Perseverance' : 'Curiosity',
          },
          {
            id: 2,
            sol: 1238,
            imgSrc: '',
            earthDate: formatDateOffset(4),
            camera: 'Navigation Camera (Navcam)',
            rover: rover === 'perseverance' ? 'Perseverance' : 'Curiosity',
          },
        ],
      });
    }
  });

  // 3. NASA DONKI Space Weather (Solar Flares & CMEs) + RadLab ISS Dosimetry Context
  app.get('/api/nasa/donki', async (_req, res) => {
    const cacheKey = 'donki';
    const cached = getCached(cacheKey);
    if (cached) {
      res.json({ ok: true, source: 'live', data: cached });
      return;
    }

    const startDate = formatDateOffset(14);
    const endDate = formatDateOffset(0);

    try {
      const [flrRaw, cmeRaw] = await Promise.all([
        fetchJsonWithTimeout(
          `https://api.nasa.gov/DONKI/FLR?startDate=${startDate}&endDate=${endDate}&api_key=${encodeURIComponent(NASA_KEY)}`
        ) as Promise<Array<Record<string, unknown>>>,
        fetchJsonWithTimeout(
          `https://api.nasa.gov/DONKI/CME?startDate=${startDate}&endDate=${endDate}&api_key=${encodeURIComponent(NASA_KEY)}`
        ) as Promise<Array<Record<string, unknown>>>,
      ]);

      const flares = (Array.isArray(flrRaw) ? flrRaw : []).slice(-6).reverse().map((f) => ({
        id: String(f.flrID || Math.random()),
        classType: String(f.classType || 'C1.0'),
        beginTime: String(f.beginTime || ''),
        sourceLocation: String(f.sourceLocation || 'Active Region'),
      }));

      const cmes = (Array.isArray(cmeRaw) ? cmeRaw : []).slice(-4).reverse().map((c) => ({
        id: String(c.activityID || Math.random()),
        startTime: String(c.startTime || ''),
        note: String(c.note || 'Coronal Mass Ejection observed').slice(0, 140),
      }));

      const hasStrongFlare = flares.some((f) => f.classType.startsWith('X') || f.classType.startsWith('M'));
      const alertLevel = hasStrongFlare ? 'storm' : flares.length > 0 || cmes.length > 0 ? 'watch' : 'calm';

      const payload = {
        alertLevel,
        flares,
        cmes,
        issDoseRateMgyDay: alertLevel === 'storm' ? 0.52 : alertLevel === 'watch' ? 0.36 : 0.28,
        deepSpaceDoseRateMgyDay: alertLevel === 'storm' ? 1.45 : alertLevel === 'watch' ? 0.85 : 0.62,
        updatedAt: new Date().toISOString(),
      };
      setCached(cacheKey, payload, 15 * 60 * 1000);
      res.json({ ok: true, source: 'live', data: payload });
    } catch {
      res.json({
        ok: true,
        source: 'fallback',
        data: {
          alertLevel: 'watch',
          flares: [
            {
              id: 'sample-flr-1',
              classType: 'M1.4',
              beginTime: `${formatDateOffset(1)}T11:20Z`,
              sourceLocation: 'N14W22',
            },
            {
              id: 'sample-flr-2',
              classType: 'C4.8',
              beginTime: `${formatDateOffset(2)}T06:45Z`,
              sourceLocation: 'S08E15',
            },
          ],
          cmes: [
            {
              id: 'sample-cme-1',
              startTime: `${formatDateOffset(1)}T12:00Z`,
              note: 'Moderate solar plasma wave tracked by SOHO/LASCO.',
            },
          ],
          issDoseRateMgyDay: 0.34,
          deepSpaceDoseRateMgyDay: 0.78,
          updatedAt: new Date().toISOString(),
        },
      });
    }
  });

  // 4. NASA OSDR Space Biology Search + RadLab Dosimetry Studies
  app.get('/api/nasa/osdr', async (req, res) => {
    const q = String(req.query.q || 'bone density').trim().slice(0, 80);
    const cacheKey = `osdr_${q.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.json({ ok: true, source: 'live', data: cached });
      return;
    }

    try {
      const url = `https://osdr.nasa.gov/osdr/data/search?term=${encodeURIComponent(q)}&size=6&type=cgene`;
      const raw = (await fetchJsonWithTimeout(url)) as {
        hits?: {
          hits?: Array<{
            _source?: {
              Accession?: string;
              'Study Title'?: string;
              'Study Description'?: string;
              organism?: string | string[];
              'Project Type'?: string;
            };
          }>;
        };
      };

      const hits = raw.hits?.hits || [];
      const studies = hits.map((h) => {
        const s = h._source || {};
        const org = Array.isArray(s.organism) ? s.organism.join(', ') : String(s.organism || 'Astronaut / Model Organism');
        return {
          accession: String(s.Accession || 'OSD-Study'),
          title: String(s['Study Title'] || 'NASA Space Biology Study'),
          description: String(s['Study Description'] || '').slice(0, 220),
          organism: org,
          projectType: String(s['Project Type'] || 'Spaceflight Study'),
        };
      });

      if (studies.length > 0) {
        setCached(cacheKey, studies, 15 * 60 * 1000);
        res.json({ ok: true, source: 'live', data: studies });
        return;
      }
      throw new Error('No OSDR hits');
    } catch {
      res.json({
        ok: true,
        source: 'fallback',
        data: [
          {
            accession: 'OSD-352',
            title: 'Microgravity Effects on Bone Density & Calcium Regulation in Spaceflight',
            description:
              'Investigates how weightlessness reduces mechanical load on bones and how exercise and nutrition help protect astronauts during Mars-length missions.',
            organism: 'Mus musculus / Human Analog',
            projectType: 'Spaceflight Study',
          },
          {
            accession: 'OSD-194',
            title: 'ISS RadLab & Cosmic Radiation Dosimetry Across Orbital Inclinations',
            description:
              'Compares absorbed radiation doses inside shielded ISS modules versus extravehicular activity (EVA) to guide Mars habitat shielding.',
            organism: 'ISS Dosimetry Network',
            projectType: 'Radiation Biology',
          },
          {
            accession: 'OSD-418',
            title: 'Hydroponic Leafy Greens & Immune Health in Closed Space Habitats',
            description:
              'Examines fresh crop cultivation under LED lighting to boost astronaut nutrition, vitamin intake, and psychological well-being.',
            organism: 'Lactuca sativa',
            projectType: 'Bio-Dome Agriculture',
          },
        ],
      });
    }
  });

  // 5. RadLab ISS Dosimetry Live/Curated Reference Endpoint
  app.get('/api/nasa/radlab', async (_req, res) => {
    const cacheKey = 'radlab';
    const cached = getCached(cacheKey);
    if (cached) {
      res.json({ ok: true, source: 'live', data: cached });
      return;
    }

    try {
      const url = `https://osdr.nasa.gov/osdr/data/search?term=${encodeURIComponent('radiation dosimetry ISS')}&size=4&type=cgene`;
      const raw = (await fetchJsonWithTimeout(url)) as {
        hits?: { hits?: Array<{ _source?: Record<string, unknown> }> };
      };
      const studies = (raw.hits?.hits || []).map((h) => ({
        accession: String(h._source?.Accession || 'RADLAB'),
        title: String(h._source?.['Study Title'] || 'ISS Radiation Dosimetry Record'),
      }));
      const payload = {
        issAvgDoseMgyDay: 0.31,
        earthSeaLevelMgyDay: 0.006,
        marsSurfaceMgyDay: 0.64,
        shieldsRecommendedMmAl: 45,
        instruments: ['DOSTEL (ESA)', 'REM (NASA)', 'Liulin-5 (Roscosmos/BAS)', 'RAD (Curiosity)'],
        studies,
      };
      setCached(cacheKey, payload, 20 * 60 * 1000);
      res.json({ ok: true, source: studies.length > 0 ? 'live' : 'fallback', data: payload });
    } catch {
      res.json({
        ok: true,
        source: 'fallback',
        data: {
          issAvgDoseMgyDay: 0.31,
          earthSeaLevelMgyDay: 0.006,
          marsSurfaceMgyDay: 0.64,
          shieldsRecommendedMmAl: 45,
          instruments: ['DOSTEL (ESA)', 'REM (NASA)', 'Liulin-5 (Roscosmos/BAS)', 'RAD (Curiosity)'],
          studies: [
            { accession: 'RADLAB-ISS', title: 'International Space Station Multi-Agency Dosimetry Dataset' },
          ],
        },
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Mars Odyssey server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
