import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const ADMIN = process.env.ADMIN_PASSWORD;
if (!ADMIN) throw new Error('ADMIN_PASSWORD must be configured');
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || __dirname);
const FRONTEND_DIST = path.resolve(__dirname, '../frontend/dist');
const dir = (n) => { const p = path.join(STORAGE_DIR, n); fs.mkdirSync(p, { recursive: true }); return p; };
const DATA = dir('data'), UPLOADS = dir('uploads'), MUSIC = dir('music'), TMP = dir('tmp'), VIDEOS = dir('videos');
const DB = path.join(DATA, 'db.json');

/* ---------- persistent storage (JSON file) ---------- */
const sec = (title, theme, text) => ({ id: crypto.randomUUID(), title, theme, text, photos: [] });
const seed = () => ({
  site: { welcomeTitle: 'A Little World Made Just For You ❤️', welcomeSubtitle: 'Every moment with you is a memory I want to keep forever.', bgMusic: '' },
  sections: [
    sec('Our First Meeting', 0, 'It was an ordinary day that became extraordinary the moment I saw you. (Replace this with where and how we met.)'),
    sec('The Beginning of Love', 1, 'Somewhere between the laughter and the late-night talks, I realised I was falling for you.'),
    sec('Our First Conversation', 2, 'I still remember how nervous I was, and how easy it became to talk to you.'),
    sec('Our Special Moments', 3, 'The little walks, the shared snacks, the inside jokes — each one a treasure.'),
    sec('My Favourite Memory', 4, 'There is one moment I will never forget… (write it here).'),
    sec('Things I Love About You', 5, 'Your smile.\nYour kindness.\nThe way you make ordinary days feel magical.'),
    sec('Our Future Together', 6, 'I promise to hold your hand through every sunrise and every storm.')
  ],
  photos: [],
  letter: { title: 'Words From My Heart', text: 'My dearest love,\n\nI have so many feelings that words can never hold them all. You are my peace, my joy and my favourite person in the world.\n\nThank you for being you. I love you, today and always.\n\nForever yours ❤️' },
  countdown: { title: 'Our Special Day', date: new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 16) },
  reasons: ['Because your smile makes my whole world brighter ✨', 'Because you understand me without words 💞', 'Because with you, home is a person 🏡', 'Because you are my best friend and my greatest love 💖'],
  secret: { hint: 'Try the day we first met (DDMMYYYY)', password: '1234', message: 'I knew from the very first day that you were my forever. 💍' }
});
const readDb = () => { if (!fs.existsSync(DB)) writeDb(seed()); return JSON.parse(fs.readFileSync(DB, 'utf8')); };
const writeDb = (d) => { const t = DB + '.tmp'; fs.writeFileSync(t, JSON.stringify(d, null, 2)); fs.renameSync(t, DB); };
const publicView = (d) => ({ ...d, secret: { hint: d.secret?.hint || '' } });

/* ---------- app ---------- */
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(UPLOADS));
app.use('/music', express.static(MUSIC));
app.use('/videos', express.static(VIDEOS));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api', (req, res) => res.json({ ok: true, health: '/api/health' }));

const isAdmin = (req) => req.get('x-admin') === ADMIN;
const needAdmin = (req, res, next) => (isAdmin(req) ? next() : res.status(401).json({ error: 'Admin password required' }));

app.post('/api/login', (req, res) => (req.body.password === ADMIN ? res.json({ ok: true }) : res.status(401).json({ error: 'Wrong password' })));
app.get('/api/data', (req, res) => { const d = readDb(); res.json(isAdmin(req) ? d : publicView(d)); });
app.put('/api/data', needAdmin, (req, res) => {
  const d = req.body;
  if (!d || !Array.isArray(d.sections) || !Array.isArray(d.photos)) return res.status(400).json({ error: 'Invalid data' });
  writeDb(d); res.json({ ok: true });
});
app.post('/api/secret', (req, res) => {
  const s = readDb().secret;
  if (s.password && req.body.password === s.password) return res.json({ message: s.message });
  res.status(403).json({ error: 'That is not the secret word 💔' });
});
app.get('/api/music', (req, res) =>
  res.json(fs.readdirSync(MUSIC).filter((f) => /\.(mp3|wav|m4a|ogg)$/i.test(f)).map((f) => ({ name: f.replace(/\.[^.]+$/, ''), url: '/music/' + encodeURIComponent(f) }))));

/* ---------- uploads ---------- */
const upload = multer({
  storage: multer.diskStorage({ destination: UPLOADS, filename: (r, f, cb) => cb(null, crypto.randomUUID() + path.extname(f.originalname).toLowerCase()) }),
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: (r, f, cb) => (/^(image|audio)\//.test(f.mimetype) ? cb(null, true) : cb(new Error('Only image or audio files are allowed')))
});
app.post('/api/upload', needAdmin, upload.array('files', 50), (req, res) => res.json({ urls: req.files.map((f) => '/uploads/' + f.filename) }));

/* ---------- memory video (FFmpeg) ---------- */
const same = { x: () => 'iw/2-(iw/zoom/2)', y: () => 'ih/2-(ih/zoom/2)' };
const TEMPLATES = {
  dreamy: { ...same, z: () => 'min(zoom+0.0012,1.2)', extra: '' },
  cinematic: { ...same, z: () => 'if(eq(on,0),1.2,max(zoom-0.0012,1))', extra: ',vignette=PI/5' },
  romantic: { z: () => '1.12', x: (f) => `(iw-iw/zoom)*on/${f}`, y: same.y, extra: ',eq=saturation=1.2:contrast=1.05' }
};
const resolveMusic = (u) => {
  if (!u) return null;
  const base = u.startsWith('/music/') ? MUSIC : u.startsWith('/uploads/') ? UPLOADS : null;
  if (!base) return null;
  const p = path.join(base, path.basename(decodeURIComponent(u)));
  return fs.existsSync(p) ? p : null;
};
const jobMw = (req, res, next) => { req.jobId = crypto.randomUUID(); req.n = 0; fs.mkdirSync(path.join(TMP, req.jobId), { recursive: true }); next(); };
const vidUp = multer({
  storage: multer.diskStorage({
    destination: (req, f, cb) => cb(null, path.join(TMP, req.jobId)),
    filename: (req, f, cb) => cb(null, 'f' + String(++req.n).padStart(3, '0') + '.jpg')
  }),
  limits: { fileSize: 20 * 1024 * 1024 }
});
app.post('/api/video', needAdmin, jobMw, vidUp.array('frames', 200), (req, res, next) => {
  const jobDir = path.join(TMP, req.jobId);
  const cleanup = () => fs.rm(jobDir, { recursive: true, force: true }, () => {});
  try {
    if (!ffmpegPath) throw new Error('FFmpeg binary not found');
    const frames = req.files;
    if (!frames?.length) throw new Error('No frames received');
    const D = Math.min(12, Math.max(2, Number(req.body.seconds) || 4)), fps = 25, n = frames.length;
    const T = TEMPLATES[req.body.template] || TEMPLATES.dreamy;
    const music = resolveMusic(req.body.musicUrl);
    const args = ['-y'];
    frames.forEach((f) => args.push('-i', f.path));
    if (music) args.push('-i', music);
    let fc = '';
    frames.forEach((_, i) => {
      fc += `[${i}:v]scale=1920:1080,setsar=1,zoompan=z='${T.z()}':x='${T.x(D * fps)}':y='${T.y()}':d=${D * fps}:s=1280x720:fps=${fps},fade=t=in:st=0:d=0.8,fade=t=out:st=${D - 0.8}:d=0.8${T.extra},setsar=1[v${i}];`;
    });
    fc += frames.map((_, i) => `[v${i}]`).join('') + `concat=n=${n}:v=1:a=0,format=yuv420p[v]`;
    args.push('-filter_complex', fc, '-map', '[v]');
    if (music) args.push('-map', `${n}:a`, '-af', `afade=t=out:st=${Math.max(0, n * D - 2)}:d=2`, '-c:a', 'aac', '-b:a', '192k', '-shortest');
    const out = path.join(VIDEOS, req.jobId + '.mp4');
    args.push('-c:v', 'libx264', '-preset', 'veryfast', '-movflags', '+faststart', out);
    const p = spawn(ffmpegPath, args);
    let err = '';
    p.stderr.on('data', (d) => { err = (err + d).slice(-1500); });
    p.on('error', (e) => { cleanup(); next(e); });
    p.on('close', (code) => {
      cleanup();
      if (code === 0) res.json({ url: '/videos/' + req.jobId + '.mp4' });
      else next(new Error('FFmpeg failed: ' + err.split('\n').slice(-3).join(' ')));
    });
  } catch (e) { cleanup(); next(e); }
});

if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found' });
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'), (e) => { if (e) next(e); });
  });
} else {
  app.get('/', (req, res) => res.json({ ok: true, health: '/api/health' }));
}

app.use((err, req, res, next) => { console.error(err.message); res.status(400).json({ error: err.message || 'Server error' }); });
app.listen(PORT, () => console.log(`💖 Love Story API running on http://localhost:${PORT}`));
